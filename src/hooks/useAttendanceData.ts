import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Staff, StoreProfile, TabType, AttendanceMark } from '../types/attendance'
import {
  localToday,
  makeDates,
  monthRange,
  calculateStaffPayroll
} from '../lib/attendanceUtils'
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient'
import { startKeepAliveService, stopKeepAliveService } from '../lib/supabaseKeepAlive'
import {
  fetchStaffFromSupabase,
  pushStaffToSupabase,
  fetchStoreProfileFromSupabase,
  pushStoreProfileToSupabase,
  syncAttendanceRecord,
  syncOvertimeRecord,
  syncAdvanceRecord,
  syncDailyWageRecord,
  syncStaffProfile,
  deleteStaffFromSupabase
} from '../lib/supabaseSync'

const STORAGE_KEY = 'storeAttendance_real_v2'
const PROFILE_KEY = 'storeProfile_real_v2'
const FROM_KEY = 'attendanceFrom'
const TO_KEY = 'attendanceTo'
const MONTH_KEY = 'attendancePayslipMonth'
const THEME_KEY = 'attendanceTheme'

const EMPTY_STORE_PROFILE: StoreProfile = {
  name: '',
  address: '',
  phone: '',
  outlets: ['Main Branch'],
  logo: '',
  outletLogos: []
}

export function useAttendanceData() {
  const today = useMemo(() => localToday(), [])

  // Theme state
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'night' || saved === 'dark') return 'dark'
    return 'light'
  })

  // Date states
  const [fromDate, setFromDate] = useState<string>(() => {
    return localStorage.getItem(FROM_KEY) || today
  })

  const [toDate, setToDate] = useState<string>(() => {
    return localStorage.getItem(TO_KEY) || today
  })

  const [entryDate, setEntryDate] = useState<string>(today)
  const [payslipMonth, setPayslipMonth] = useState<string>(() => {
    return localStorage.getItem(MONTH_KEY) || today.slice(0, 7)
  })

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')
  const [outletFilter, setOutletFilter] = useState<string>('')
  const [markFilter, setMarkFilter] = useState<string>('')

  // Supabase sync states
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false)
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  // Staff list state (pure real data)
  const [staffList, setStaffList] = useState<Staff[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch {
      // fallback
    }
    return []
  })

  // Store Profile state
  const [storeProfile, setStoreProfileState] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          return {
            ...EMPTY_STORE_PROFILE,
            ...parsed,
            outlets:
              Array.isArray(parsed.outlets) && parsed.outlets.length > 0
                ? parsed.outlets
                : ['Main Branch']
          }
        }
      }
    } catch {
      // fallback
    }
    return EMPTY_STORE_PROFILE
  })

  // Initialize Supabase & Keep-Alive service
  useEffect(() => {
    const initSupabase = async () => {
      if (isSupabaseConfigured()) {
        startKeepAliveService()
        const res = await testSupabaseConnection()
        setIsSupabaseConnected(res.success)
        setSupabaseLatency(res.latencyMs || null)

        if (res.success) {
          setIsSyncing(true)
          const { data: cloudStaff } = await fetchStaffFromSupabase()
          const { data: cloudProfile } = await fetchStoreProfileFromSupabase()

          if (cloudStaff && Array.isArray(cloudStaff)) {
            setStaffList(cloudStaff)
          }

          if (cloudProfile && cloudProfile.name) {
            setStoreProfileState(cloudProfile)
          }

          setIsSyncing(false)
        }
      } else {
        stopKeepAliveService()
        setIsSupabaseConnected(false)
        setSupabaseLatency(null)
      }
    }

    initSupabase().catch(console.error)
    return () => {
      stopKeepAliveService()
    }
  }, [])

  // Save staff list locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(staffList))
    } catch (err) {
      console.error('Failed to persist staff list locally:', err)
    }
  }, [staffList])

  // Save store profile locally
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(storeProfile))
    } catch (err) {
      console.error('Failed to persist store profile locally:', err)
    }
  }, [storeProfile])

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      document.body.dataset.theme = 'night'
    } else {
      root.classList.remove('dark')
      document.body.dataset.theme = 'day'
    }
    localStorage.setItem(THEME_KEY, theme === 'dark' ? 'night' : 'day')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  // Calculate dates based on active tab
  const activeDates = useMemo(() => {
    if (activeTab === 'attendance') {
      return makeDates(fromDate, toDate) || [today]
    }
    if (activeTab === 'payslip') {
      return monthRange(payslipMonth)
    }
    return monthRange(today.slice(0, 7))
  }, [activeTab, fromDate, toDate, payslipMonth, today])

  // Make sure entryDate is valid
  useEffect(() => {
    if (
      (activeTab === 'overtime' || activeTab === 'advance' || activeTab === 'dailywage') &&
      !activeDates.includes(entryDate)
    ) {
      setEntryDate(activeDates.includes(today) ? today : activeDates[0] || today)
    }
  }, [activeTab, activeDates, entryDate, today])

  // Unique departments
  const departments = useMemo(() => {
    const set = new Set<string>()
    staffList.forEach((s) => {
      if (s.dept) set.add(s.dept)
    })
    return Array.from(set).sort()
  }, [staffList])

  // Configured & active outlets list
  const outlets = useMemo(() => {
    if (storeProfile.outlets && storeProfile.outlets.length > 0) {
      return storeProfile.outlets
    }
    return ['Main Branch']
  }, [storeProfile.outlets])

  // Filtered staff list
  const filteredStaffList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let filterDate = ''
    let filterMark = ''
    if (markFilter.includes('|')) {
      const parts = markFilter.split('|')
      filterDate = parts[0]
      filterMark = parts[1]
    }

    return staffList.filter((p) => {
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesId = p.id.toLowerCase().includes(q)
        const matchesDept = p.dept.toLowerCase().includes(q)
        const matchesOutlet = (p.outlet || '').toLowerCase().includes(q)
        if (!matchesName && !matchesId && !matchesDept && !matchesOutlet) return false
      }

      if (departmentFilter && p.dept !== departmentFilter) {
        return false
      }

      if (outletFilter && (p.outlet || '') !== outletFilter) {
        return false
      }

      if (activeTab === 'attendance' && filterDate && filterMark) {
        if ((p.attendance[filterDate] || '') !== filterMark) {
          return false
        }
      }

      return true
    })
  }, [staffList, searchQuery, departmentFilter, outletFilter, markFilter, activeTab])

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalBase = 0
    let totalOt = 0
    let totalAdvance = 0
    let totalNet = 0

    staffList.forEach((p) => {
      const calc = calculateStaffPayroll(p, activeDates)
      totalBase += calc.base
      totalOt += calc.otPay
      totalAdvance += calc.advance
      totalNet += calc.net
    })

    return {
      staffCount: staffList.length,
      totalBase,
      totalOt,
      totalAdvance,
      totalNet
    }
  }, [staffList, activeDates])

  // Period handler
  const handleSetPeriod = useCallback((start: string, end: string): boolean => {
    const dates = makeDates(start, end)
    if (!dates) {
      return false
    }
    setFromDate(start)
    setToDate(end)
    localStorage.setItem(FROM_KEY, start)
    localStorage.setItem(TO_KEY, end)
    return true
  }, [])

  const handleSetPayslipMonth = useCallback((month: string) => {
    setPayslipMonth(month)
    localStorage.setItem(MONTH_KEY, month)
  }, [])

  // Granular Real-Time Database Operations
  const updateAttendance = useCallback((id: string, date: string, mark: AttendanceMark) => {
    setStaffList((prev) =>
      prev.map((staff) => {
        if (staff.id === id) {
          return {
            ...staff,
            attendance: {
              ...staff.attendance,
              [date]: mark
            }
          }
        }
        return staff
      })
    )
    syncAttendanceRecord(id, date, mark)
  }, [])

  const updateUsualWage = useCallback((id: string, wage: string | number) => {
    setStaffList((prev) =>
      prev.map((staff) => {
        if (staff.id === id) {
          const updated = { ...staff, wage }
          syncStaffProfile(updated)
          return updated
        }
        return staff
      })
    )
  }, [])

  const updateDailyWage = useCallback((id: string, date: string, wage: string | number) => {
    setStaffList((prev) =>
      prev.map((staff) => {
        if (staff.id === id) {
          const updated = { ...(staff.wageByDate || {}) }
          if (wage === '') {
            delete updated[date]
          } else {
            updated[date] = wage
          }
          return { ...staff, wageByDate: updated }
        }
        return staff
      })
    )
    syncDailyWageRecord(id, date, wage)
  }, [])

  const updateOvertime = useCallback((id: string, date: string, amount: string | number) => {
    setStaffList((prev) =>
      prev.map((staff) => {
        if (staff.id === id) {
          const ot = { ...(staff.overtime || {}) }
          ot[date] = { ...ot[date], amount }
          return { ...staff, overtime: ot }
        }
        return staff
      })
    )
    syncOvertimeRecord(id, date, amount)
  }, [])

  const updateAdvance = useCallback((id: string, date: string, amount: string | number) => {
    setStaffList((prev) =>
      prev.map((staff) => {
        if (staff.id === id) {
          const adv = { ...(staff.advances || {}) }
          adv[date] = amount
          return { ...staff, advances: adv }
        }
        return staff
      })
    )
    syncAdvanceRecord(id, date, amount)
  }, [])

  const addStaff = useCallback((newStaff: Omit<Staff, 'attendance' | 'overtime' | 'advances'>) => {
    setStaffList((prev) => {
      if (prev.some((x) => x.id === newStaff.id)) {
        throw new Error('Employee ID already exists')
      }
      const item: Staff = {
        ...newStaff,
        attendance: {},
        overtime: {},
        advances: {},
        wageByDate: {}
      }
      const updated = [...prev, item]
      updated.sort((a, b) => Number(a.id) - Number(b.id))
      syncStaffProfile(item)
      return updated
    })
  }, [])

  const updateStaff = useCallback((updatedStaff: Staff) => {
    setStaffList((prev) =>
      prev.map((item) => (item.id === updatedStaff.id ? updatedStaff : item))
    )
    syncStaffProfile(updatedStaff)
  }, [])

  const deleteStaff = useCallback((id: string) => {
    setStaffList((prev) => prev.filter((item) => item.id !== id))
    deleteStaffFromSupabase(id)
  }, [])

  const resetFilters = useCallback(() => {
    setSearchQuery('')
    setDepartmentFilter('')
    setOutletFilter('')
    setMarkFilter('')
  }, [])

  const handleSaveStoreProfile = useCallback(async (profile: StoreProfile) => {
    setStoreProfileState(profile)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch (err) {
      console.error('Failed to persist store profile locally:', err)
    }

    if (isSupabaseConfigured()) {
      setIsSyncing(true)
      const res = await pushStoreProfileToSupabase(profile)
      setIsSyncing(false)
      return res
    }
    return {
      success: true,
      message: 'Store profile saved locally',
      timestamp: new Date().toISOString()
    }
  }, [])

  const renameOutlet = useCallback(
    (oldName: string, newName: string) => {
      const trimmedOld = oldName.trim()
      const trimmedNew = newName.trim()
      if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return

      // 1. Update staff members assigned to this outlet
      setStaffList((prev) => {
        const updated = prev.map((s) =>
          s.outlet === trimmedOld ? { ...s, outlet: trimmedNew } : s
        )
        // Sync modified staff profiles
        updated.filter((s) => s.outlet === trimmedNew).forEach((s) => syncStaffProfile(s))
        return updated
      })

      // 2. Update storeProfile
      setStoreProfileState((prev) => {
        const updatedOutlets = (prev.outlets || []).map((o) =>
          o === trimmedOld ? trimmedNew : o
        )
        const updatedLogos = (prev.outletLogos || []).map((l) =>
          l.name === trimmedOld ? { ...l, name: trimmedNew } : l
        )
        const updated = {
          ...prev,
          outlets: updatedOutlets,
          outletLogos: updatedLogos
        }
        handleSaveStoreProfile(updated)
        return updated
      })
    },
    [handleSaveStoreProfile]
  )

  // Manual Cloud Actions
  const pullFromSupabase = useCallback(async () => {
    setIsSyncing(true)
    const { data: cloudStaff } = await fetchStaffFromSupabase()
    const { data: cloudProfile } = await fetchStoreProfileFromSupabase()
    if (cloudStaff && Array.isArray(cloudStaff)) {
      setStaffList(cloudStaff)
    }
    if (cloudProfile && cloudProfile.name) {
      setStoreProfileState(cloudProfile)
    }
    const res = await testSupabaseConnection()
    setIsSupabaseConnected(res.success)
    setSupabaseLatency(res.latencyMs || null)
    setIsSyncing(false)
  }, [])

  const pushToSupabase = useCallback(async () => {
    setIsSyncing(true)
    await pushStaffToSupabase(staffList)
    await pushStoreProfileToSupabase(storeProfile)
    const res = await testSupabaseConnection()
    setIsSupabaseConnected(res.success)
    setSupabaseLatency(res.latencyMs || null)
    setIsSyncing(false)
  }, [staffList, storeProfile])

  return {
    today,
    theme,
    toggleTheme,
    fromDate,
    toDate,
    entryDate,
    payslipMonth,
    activeTab,
    searchQuery,
    departmentFilter,
    outletFilter,
    markFilter,
    staffList,
    filteredStaffList,
    departments,
    outlets,
    storeProfile,
    activeDates,
    overallStats,
    isSupabaseConnected,
    supabaseLatency,
    isSyncing,
    setFromDate,
    setToDate,
    setEntryDate,
    setPayslipMonth: handleSetPayslipMonth,
    setActiveTab,
    setSearchQuery,
    setDepartmentFilter,
    setOutletFilter,
    setMarkFilter,
    setStoreProfile: handleSaveStoreProfile,
    renameOutlet,
    handleSetPeriod,
    updateAttendance,
    updateUsualWage,
    updateDailyWage,
    updateOvertime,
    updateAdvance,
    addStaff,
    updateStaff,
    deleteStaff,
    resetFilters,
    pullFromSupabase,
    pushToSupabase
  }
}
