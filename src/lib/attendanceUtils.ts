import type { Staff, StaffCalculation, GroupSummary, StoreProfile } from '../types/attendance'

export function localToday(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(value?: string): string {
  if (!value) return ''
  const parts = String(value).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return value
}

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function makeDates(fromDate: string, toDate: string): string[] | null {
  const start = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  if (
    Number.isNaN(start.valueOf()) ||
    Number.isNaN(end.valueOf()) ||
    start > end ||
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) > 62
  ) {
    return null
  }

  const result: string[] = []
  const current = new Date(start)

  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    result.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }

  return result
}

export function monthRange(monthStr: string): string[] {
  if (!monthStr || monthStr.length < 7) return [localToday()]
  const year = Number(monthStr.slice(0, 4))
  const month = Number(monthStr.slice(5, 7))
  const lastDay = new Date(year, month, 0).getDate()
  
  const from = `${monthStr}-01`
  const to = `${monthStr}-${String(lastDay).padStart(2, '0')}`
  return makeDates(from, to) || [localToday()]
}

export function calculateStaffPayroll(staff: Staff, dates: string[]): StaffCalculation {
  const marks = dates.map((d) => staff.attendance[d] || '')
  const full = marks.filter((m) => m === 'P').length
  const half = marks.filter((m) => m === 'H').length
  const abs = marks.filter((m) => m === 'A').length

  const base = dates.reduce((sum, d) => {
    const mark = staff.attendance[d]
    if (!mark || mark === 'A') return sum

    const rate = Number(
      staff.wageByDate && staff.wageByDate[d] !== undefined && staff.wageByDate[d] !== ''
        ? staff.wageByDate[d]
        : staff.wage || 0
    )

    const multiplier = mark === 'P' ? 1 : mark === 'H' ? 0.5 : 0
    return sum + rate * multiplier
  }, 0)

  let otPay = 0
  let advance = 0

  dates.forEach((d) => {
    const ot = staff.overtime[d] || {}
    const otAmount =
      ot.amount !== undefined && ot.amount !== ''
        ? Number(ot.amount)
        : Number(ot.hours || 0) * Number(ot.rate || 0)

    otPay += isNaN(otAmount) ? 0 : otAmount
    const advVal = Number(staff.advances[d] || 0)
    advance += isNaN(advVal) ? 0 : advVal
  })

  return {
    full,
    half,
    abs,
    base,
    otPay,
    advance,
    net: base + otPay - advance
  }
}

export function calculateGroupSummary(staffList: Staff[], dates: string[]): GroupSummary[] {
  const groups: Record<string, GroupSummary> = {}

  staffList.forEach((staff) => {
    const outlet = staff.outlet || 'All Staff'
    const dept = staff.dept || 'Other'
    const key = `${outlet}__${dept}`

    if (!groups[key]) {
      groups[key] = {
        outlet,
        dept,
        staff: 0,
        full: 0,
        half: 0,
        abs: 0,
        base: 0,
        ot: 0,
        adv: 0,
        net: 0
      }
    }

    const calc = calculateStaffPayroll(staff, dates)
    const g = groups[key]
    g.staff += 1
    g.full += calc.full
    g.half += calc.half
    g.abs += calc.abs
    g.base += calc.base
    g.ot += calc.otPay
    g.adv += calc.advance
    g.net += calc.net
  })

  return Object.values(groups).sort((a, b) =>
    a.outlet.localeCompare(b.outlet) || a.dept.localeCompare(b.dept)
  )
}

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Full Attendance and Payroll CSV export across active dates (from reference `exportCsv()`)
 */
export function exportPayrollCsv(staffList: Staff[], dates: string[]): void {
  const header = [
    'Employee ID',
    'Name',
    'Outlet',
    'Department',
    'Designation',
    'Status',
    'Daily wage ₹',
    ...dates.flatMap((d) => [`Over-duty amount ${formatDate(d)}`, `Advance ${formatDate(d)}`]),
    ...dates.map((d) => formatDate(d)),
    'Full days',
    'Half days',
    'Absent days',
    'Attendance pay ₹',
    'OT pay ₹',
    'Advance ₹',
    'Net salary ₹'
  ]

  const rows: (string | number)[][] = [header]

  staffList.forEach((staff) => {
    const calc = calculateStaffPayroll(staff, dates)
    const otAndAdv = dates.flatMap((d) => {
      const ot = staff.overtime[d] || {}
      const otAmt =
        ot.amount !== undefined && ot.amount !== ''
          ? Number(ot.amount)
          : Number(ot.hours || 0) * Number(ot.rate || 0)
      const adv = staff.advances[d] || ''
      return [otAmt || 0, adv || '']
    })

    const attMarks = dates.map((d) => staff.attendance[d] || '')

    rows.push([
      staff.id,
      staff.name,
      staff.outlet || '-',
      staff.dept,
      staff.designation || '-',
      staff.status,
      staff.wage || 0,
      ...otAndAdv,
      ...attMarks,
      calc.full,
      calc.half,
      calc.abs,
      calc.base,
      calc.otPay,
      calc.advance,
      calc.net
    ])
  })

  const csvContent = rows
    .map((row) =>
      row
        .map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\r\n')

  triggerDownload(`attendance-payroll-${localToday()}.csv`, csvContent)
}

/**
 * Export Individual Employee's Payslip breakdown to CSV
 */
export function exportSinglePayslipCsv(
  staff: Staff,
  dates: string[],
  storeProfile: StoreProfile
): void {
  const calc = calculateStaffPayroll(staff, dates)
  const periodLabel = `${formatDate(dates[0])} to ${formatDate(dates[dates.length - 1])}`

  const lines: (string | number)[][] = [
    ['COMPANY', storeProfile.name || 'Store'],
    ['OUTLET', staff.outlet || '-'],
    ['ADDRESS', storeProfile.address || ''],
    ['PHONE', storeProfile.phone || ''],
    [''],
    ['PAYSLIP FOR', staff.name],
    ['EMPLOYEE ID', staff.id],
    ['DEPARTMENT', staff.dept],
    ['DESIGNATION', staff.designation || '-'],
    ['PERIOD', periodLabel],
    [''],
    ['Date', 'Attendance', 'Daily Wage ₹', 'Over-Duty ₹', 'Advance ₹', 'Day Net ₹']
  ]

  dates.forEach((d) => {
    const mark = staff.attendance[d] || '—'
    const rate = Number(
      staff.wageByDate &&
        staff.wageByDate[d] !== undefined &&
        staff.wageByDate[d] !== ''
        ? staff.wageByDate[d]
        : staff.wage || 0
    )
    const wage = rate * (mark === 'P' ? 1 : mark === 'H' ? 0.5 : 0)
    const ot = staff.overtime[d] || {}
    const otAmt = Number(
      ot.amount !== undefined
        ? ot.amount
        : Number(ot.hours || 0) * Number(ot.rate || 0)
    )
    const adv = Number(staff.advances[d] || 0)
    const dayNet = wage + otAmt - adv

    lines.push([formatDate(d), mark, wage, otAmt, adv, dayNet])
  })

  lines.push([
    'TOTALS',
    `Present: ${calc.full}, Half: ${calc.half}, Absent: ${calc.abs}`,
    calc.base,
    calc.otPay,
    calc.advance,
    calc.net
  ])

  const csvContent = lines
    .map((row) =>
      row
        .map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\r\n')

  triggerDownload(`payslip-${staff.id}-${staff.name.replace(/\s+/g, '_')}.csv`, csvContent)
}

/**
 * Export All Staff Monthly Payslips Summary CSV
 */
export function exportMonthlyPayslipsSummaryCsv(
  staffList: Staff[],
  monthStr: string,
  storeProfile: StoreProfile
): void {
  const dates = monthRange(monthStr)
  const header = [
    'Store Name',
    'Outlet',
    'Employee ID',
    'Employee Name',
    'Department',
    'Designation',
    'Month',
    'Present Days',
    'Half Days',
    'Absent Days',
    'Payable Days',
    'Base Wage ₹',
    'Overtime Pay ₹',
    'Advance Deducted ₹',
    'Net Payable Salary ₹'
  ]

  const rows: (string | number)[][] = [header]

  staffList.forEach((staff) => {
    const calc = calculateStaffPayroll(staff, dates)
    const payableDays = calc.full + calc.half * 0.5

    rows.push([
      storeProfile.name || '',
      staff.outlet || '-',
      staff.id,
      staff.name,
      staff.dept,
      staff.designation || '-',
      monthStr,
      calc.full,
      calc.half,
      calc.abs,
      payableDays,
      calc.base,
      calc.otPay,
      calc.advance,
      calc.net
    ])
  })

  const csvContent = rows
    .map((row) =>
      row
        .map((val) => `"${String(val ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\r\n')

  triggerDownload(`monthly-payroll-summary-${monthStr}.csv`, csvContent)
}
