export type AttendanceMark = 'P' | 'H' | 'A' | ''

export type StaffStatus = 'Working' | 'Active' | 'Left'

export type SalaryType = 'fixed' | 'variable'

export interface OvertimeEntry {
  hours?: string | number
  rate?: string | number
  amount?: string | number
}

export interface Staff {
  id: string
  name: string
  dept: string
  outlet?: string
  designation?: string
  status: StaffStatus
  wage: string | number
  salaryChanges?: boolean
  attendance: Record<string, AttendanceMark>
  overtime: Record<string, OvertimeEntry>
  advances: Record<string, string | number>
  wageByDate?: Record<string, string | number>
}

export interface OutletLogo {
  name: string
  logo: string
}

export interface StoreProfile {
  name: string
  address: string
  phone: string
  outlets: string[]
  logo: string
  outletLogos: OutletLogo[]
}

export type TabType = 
  | 'dashboard'
  | 'attendance'
  | 'overtime'
  | 'dailywage'
  | 'advance'
  | 'staff'
  | 'report'
  | 'payslip'
  | 'settings'

export interface StaffCalculation {
  full: number
  half: number
  abs: number
  base: number
  otPay: number
  advance: number
  net: number
}

export interface GroupSummary {
  outlet: string
  dept: string
  staff: number
  full: number
  half: number
  abs: number
  base: number
  ot: number
  adv: number
  net: number
}
