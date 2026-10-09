import { getSupabase, isSupabaseConfigured } from './supabaseClient'
import type { Staff, StoreProfile, AttendanceMark } from '../types/attendance'

export interface SyncResult {
  success: boolean
  message: string
  timestamp: string
}

/**
 * Fetch all staff records and assemble their attendance, overtime,
 * advances, and daily wage overrides from normalized tables.
 */
export async function fetchStaffFromSupabase(): Promise<{
  data: Staff[] | null
  error: string | null
}> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured' }
  }

  try {
    // 1. Fetch all 5 normalized tables in parallel
    const [
      { data: staffData, error: staffError },
      { data: attendanceData, error: attendanceError },
      { data: overtimeData, error: overtimeError },
      { data: advancesData, error: advancesError },
      { data: dailyWagesData, error: dailyWagesError }
    ] = await Promise.all([
      client.from('staff').select('*').order('id', { ascending: true }),
      client.from('attendance').select('*'),
      client.from('overtime').select('*'),
      client.from('advances').select('*'),
      client.from('daily_wages').select('*')
    ])

    if (staffError) return { data: null, error: staffError.message }
    if (attendanceError) console.warn('Attendance sync warning:', attendanceError.message)
    if (overtimeError) console.warn('Overtime sync warning:', overtimeError.message)
    if (advancesError) console.warn('Advances sync warning:', advancesError.message)
    if (dailyWagesError) console.warn('Daily wages sync warning:', dailyWagesError.message)

    if (!staffData || staffData.length === 0) {
      return { data: [], error: null }
    }

    // 2. Index relational rows by staff_id
    const attendanceMap: Record<string, Record<string, AttendanceMark>> = {}
    ;(attendanceData || []).forEach((row: any) => {
      const sId = String(row.staff_id)
      const d = String(row.date)
      if (!attendanceMap[sId]) attendanceMap[sId] = {}
      attendanceMap[sId][d] = (row.mark as AttendanceMark) || ''
    })

    const overtimeMap: Record<string, Record<string, { hours?: number; rate?: number; amount?: number }>> = {}
    ;(overtimeData || []).forEach((row: any) => {
      const sId = String(row.staff_id)
      const d = String(row.date)
      if (!overtimeMap[sId]) overtimeMap[sId] = {}
      overtimeMap[sId][d] = {
        hours: Number(row.hours || 0),
        rate: Number(row.rate || 0),
        amount: Number(row.amount || 0)
      }
    })

    const advancesMap: Record<string, Record<string, number | string>> = {}
    ;(advancesData || []).forEach((row: any) => {
      const sId = String(row.staff_id)
      const d = String(row.date)
      if (!advancesMap[sId]) advancesMap[sId] = {}
      advancesMap[sId][d] = Number(row.amount || 0)
    })

    const dailyWagesMap: Record<string, Record<string, number | string>> = {}
    ;(dailyWagesData || []).forEach((row: any) => {
      const sId = String(row.staff_id)
      const d = String(row.date)
      if (!dailyWagesMap[sId]) dailyWagesMap[sId] = {}
      dailyWagesMap[sId][d] = Number(row.wage || 0)
    })

    // 3. Assemble unified Staff domain model
    const staffList: Staff[] = staffData.map((row: any) => {
      const id = String(row.id)
      return {
        id,
        name: row.name || 'Unnamed',
        dept: row.dept || 'Other',
        outlet: row.outlet || 'Main Branch',
        designation: row.designation || '-',
        status: row.status || 'Working',
        wage: row.wage !== null && row.wage !== undefined && String(row.wage) !== '0' ? String(row.wage) : '',
        salaryChanges: Boolean(row.salary_changes ?? row.salaryChanges),
        attendance: attendanceMap[id] || {},
        overtime: overtimeMap[id] || {},
        advances: advancesMap[id] || {},
        wageByDate: dailyWagesMap[id] || {}
      }
    })

    return { data: staffList, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown database error'
    return { data: null, error: msg }
  }
}

/**
 * Bulk Push / Sync full staff dataset to normalized tables
 */
export async function pushStaffToSupabase(staffList: Staff[]): Promise<SyncResult> {
  const client = getSupabase()
  const timestamp = new Date().toISOString()

  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase is not configured',
      timestamp
    }
  }

  try {
    // 1. Staff Master Upsert
    const staffPayload = staffList.map((staff) => ({
      id: staff.id,
      name: staff.name,
      dept: staff.dept,
      outlet: staff.outlet || 'Main Branch',
      designation: staff.designation || '-',
      status: staff.status,
      wage: Number(staff.wage || 0),
      salary_changes: Boolean(staff.salaryChanges),
      updated_at: timestamp
    }))

    if (staffPayload.length > 0) {
      const { error: staffErr } = await client.from('staff').upsert(staffPayload, { onConflict: 'id' })
      if (staffErr) throw staffErr
    }

    // 2. Attendance Rows Flatten & Upsert
    const attendanceRows: { staff_id: string; date: string; mark: string; updated_at: string }[] = []
    staffList.forEach((s) => {
      Object.entries(s.attendance || {}).forEach(([date, mark]) => {
        if (mark) {
          attendanceRows.push({ staff_id: s.id, date, mark, updated_at: timestamp })
        }
      })
    })

    if (attendanceRows.length > 0) {
      const { error: attErr } = await client
        .from('attendance')
        .upsert(attendanceRows, { onConflict: 'staff_id,date' })
      if (attErr) console.warn('Attendance push error:', attErr.message)
    }

    // 3. Overtime Rows Flatten & Upsert
    const overtimeRows: { staff_id: string; date: string; hours: number; rate: number; amount: number; updated_at: string }[] = []
    staffList.forEach((s) => {
      Object.entries(s.overtime || {}).forEach(([date, ot]) => {
        const amt = Number(ot.amount !== undefined ? ot.amount : Number(ot.hours || 0) * Number(ot.rate || 0))
        if (amt > 0 || (ot.hours && Number(ot.hours) > 0)) {
          overtimeRows.push({
            staff_id: s.id,
            date,
            hours: Number(ot.hours || 0),
            rate: Number(ot.rate || 0),
            amount: amt,
            updated_at: timestamp
          })
        }
      })
    })

    if (overtimeRows.length > 0) {
      const { error: otErr } = await client
        .from('overtime')
        .upsert(overtimeRows, { onConflict: 'staff_id,date' })
      if (otErr) console.warn('Overtime push error:', otErr.message)
    }

    // 4. Advances Rows Flatten & Upsert
    const advancesRows: { staff_id: string; date: string; amount: number; updated_at: string }[] = []
    staffList.forEach((s) => {
      Object.entries(s.advances || {}).forEach(([date, amt]) => {
        if (Number(amt) > 0) {
          advancesRows.push({
            staff_id: s.id,
            date,
            amount: Number(amt),
            updated_at: timestamp
          })
        }
      })
    })

    if (advancesRows.length > 0) {
      const { error: advErr } = await client
        .from('advances')
        .upsert(advancesRows, { onConflict: 'staff_id,date' })
      if (advErr) console.warn('Advances push error:', advErr.message)
    }

    // 5. Daily Wages Flatten & Upsert
    const dailyWageRows: { staff_id: string; date: string; wage: number; updated_at: string }[] = []
    staffList.forEach((s) => {
      Object.entries(s.wageByDate || {}).forEach(([date, wage]) => {
        if (wage !== '' && wage !== undefined) {
          dailyWageRows.push({
            staff_id: s.id,
            date,
            wage: Number(wage),
            updated_at: timestamp
          })
        }
      })
    })

    if (dailyWageRows.length > 0) {
      const { error: dwErr } = await client
        .from('daily_wages')
        .upsert(dailyWageRows, { onConflict: 'staff_id,date' })
      if (dwErr) console.warn('Daily wages push error:', dwErr.message)
    }

    return {
      success: true,
      message: `Successfully synced ${staffList.length} staff records to Supabase tables`,
      timestamp
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      message: `Sync failed: ${msg}`,
      timestamp
    }
  }
}

/**
 * Single Granular Attendance Sync
 */
export async function syncAttendanceRecord(
  staffId: string,
  date: string,
  mark: AttendanceMark
): Promise<void> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) return

  try {
    if (!mark) {
      await client.from('attendance').delete().match({ staff_id: staffId, date })
    } else {
      await client.from('attendance').upsert(
        {
          staff_id: staffId,
          date,
          mark,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'staff_id,date' }
      )
    }
  } catch (err) {
    console.error('Failed to sync attendance record:', err)
  }
}

/**
 * Single Granular Overtime Sync
 */
export async function syncOvertimeRecord(
  staffId: string,
  date: string,
  amount: string | number
): Promise<void> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) return

  try {
    const num = Number(amount || 0)
    if (num <= 0) {
      await client.from('overtime').delete().match({ staff_id: staffId, date })
    } else {
      await client.from('overtime').upsert(
        {
          staff_id: staffId,
          date,
          amount: num,
          hours: 0,
          rate: 0,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'staff_id,date' }
      )
    }
  } catch (err) {
    console.error('Failed to sync overtime record:', err)
  }
}

/**
 * Single Granular Advance Sync
 */
export async function syncAdvanceRecord(
  staffId: string,
  date: string,
  amount: string | number
): Promise<void> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) return

  try {
    const num = Number(amount || 0)
    if (num <= 0) {
      await client.from('advances').delete().match({ staff_id: staffId, date })
    } else {
      await client.from('advances').upsert(
        {
          staff_id: staffId,
          date,
          amount: num,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'staff_id,date' }
      )
    }
  } catch (err) {
    console.error('Failed to sync advance record:', err)
  }
}

/**
 * Single Granular Daily Wage Override Sync
 */
export async function syncDailyWageRecord(
  staffId: string,
  date: string,
  wage: string | number
): Promise<void> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) return

  try {
    if (wage === '' || wage === undefined) {
      await client.from('daily_wages').delete().match({ staff_id: staffId, date })
    } else {
      await client.from('daily_wages').upsert(
        {
          staff_id: staffId,
          date,
          wage: Number(wage),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'staff_id,date' }
      )
    }
  } catch (err) {
    console.error('Failed to sync daily wage record:', err)
  }
}

/**
 * Single Staff Profile Master Sync
 */
export async function syncStaffProfile(
  staff: Omit<Staff, 'attendance' | 'overtime' | 'advances' | 'wageByDate'>
): Promise<void> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) return

  try {
    await client.from('staff').upsert(
      {
        id: staff.id,
        name: staff.name,
        dept: staff.dept,
        outlet: staff.outlet || 'Main Branch',
        designation: staff.designation || '-',
        status: staff.status,
        wage: Number(staff.wage || 0),
        salary_changes: Boolean(staff.salaryChanges),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
  } catch (err) {
    console.error('Failed to sync staff profile:', err)
  }
}

/**
 * Delete a single staff member from Supabase (cascades to all child tables)
 */
export async function deleteStaffFromSupabase(id: string): Promise<SyncResult> {
  const client = getSupabase()
  const timestamp = new Date().toISOString()

  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase is not configured',
      timestamp
    }
  }

  try {
    const { error } = await client.from('staff').delete().eq('id', id)

    if (error) {
      return {
        success: false,
        message: `Delete failed: ${error.message}`,
        timestamp
      }
    }

    return {
      success: true,
      message: `Deleted staff #${id} from Supabase`,
      timestamp
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      message: `Delete failed: ${msg}`,
      timestamp
    }
  }
}

/**
 * Fetch Store Profile from Supabase
 */
export async function fetchStoreProfileFromSupabase(): Promise<{
  data: StoreProfile | null
  error: string | null
}> {
  const client = getSupabase()
  if (!client || !isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured' }
  }

  try {
    const { data, error } = await client
      .from('store_profile')
      .select('*')
      .eq('id', 'default_store')
      .single()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message }
    }

    if (!data) return { data: null, error: null }

    const profile: StoreProfile = {
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      outlets:
        Array.isArray(data.outlets) && data.outlets.length > 0
          ? data.outlets
          : ['Main Branch'],
      logo: data.logo || '',
      outletLogos: data.outlet_logos || data.outletLogos || []
    }

    return { data: profile, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: msg }
  }
}

/**
 * Push Store Profile to Supabase
 */
export async function pushStoreProfileToSupabase(profile: StoreProfile): Promise<SyncResult> {
  const client = getSupabase()
  const timestamp = new Date().toISOString()

  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase is not configured',
      timestamp
    }
  }

  try {
    const payload = {
      id: 'default_store',
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      outlets: profile.outlets,
      logo: profile.logo,
      outlet_logos: profile.outletLogos,
      updated_at: timestamp
    }

    const { error } = await client.from('store_profile').upsert(payload, { onConflict: 'id' })

    if (error) {
      return {
        success: false,
        message: `Store profile sync failed: ${error.message}`,
        timestamp
      }
    }

    return {
      success: true,
      message: 'Store profile synced to Supabase',
      timestamp
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      message: `Store profile sync failed: ${msg}`,
      timestamp
    }
  }
}
