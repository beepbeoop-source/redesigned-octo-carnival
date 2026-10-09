import { getSupabase, isSupabaseConfigured } from './supabaseClient'
import type { Staff, StoreProfile } from '../types/attendance'

export interface SyncResult {
  success: boolean
  message: string
  timestamp: string
}

/**
 * Fetch staff records and their attendance / overtime / advances from Supabase
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
    const { data: staffData, error: staffError } = await client
      .from('staff')
      .select('*')
      .order('id', { ascending: true })

    if (staffError) {
      return { data: null, error: staffError.message }
    }

    if (!staffData || staffData.length === 0) {
      return { data: [], error: null }
    }

    // Format into application Staff model
    const staffList: Staff[] = staffData.map((row: any) => ({
      id: String(row.id || row.user_id),
      name: row.name || 'Unnamed',
      dept: row.dept || row.department || 'Other',
      outlet: row.outlet || 'Main Branch',
      designation: row.designation || '-',
      status: row.status || 'Working',
      wage: row.wage || row.daily_wage || '650',
      salaryChanges: Boolean(row.salary_changes ?? row.salaryChanges),
      attendance: row.attendance || {},
      overtime: row.overtime || {},
      advances: row.advances || {},
      wageByDate: row.wage_by_date || row.wageByDate || {}
    }))

    return { data: staffList, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown database error'
    return { data: null, error: msg }
  }
}

/**
 * Upload all staff records and nested maps to Supabase
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
    const payload = staffList.map((staff) => ({
      id: staff.id,
      name: staff.name,
      dept: staff.dept,
      outlet: staff.outlet || 'Main Branch',
      designation: staff.designation || '-',
      status: staff.status,
      wage: String(staff.wage || '0'),
      salary_changes: Boolean(staff.salaryChanges),
      attendance: staff.attendance || {},
      overtime: staff.overtime || {},
      advances: staff.advances || {},
      wage_by_date: staff.wageByDate || {},
      updated_at: timestamp
    }))

    const { error } = await client.from('staff').upsert(payload, { onConflict: 'id' })

    if (error) {
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        timestamp
      }
    }

    return {
      success: true,
      message: `Synced ${staffList.length} staff records to Supabase`,
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

/**
 * Delete a single staff member from Supabase
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
