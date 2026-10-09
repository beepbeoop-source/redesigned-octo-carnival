import React, { useState } from 'react'
import {
  Printer,
  Users,
  Receipt,
  Calendar,
  Download,
  FileSpreadsheet,
  Building2,
  Briefcase,
  IndianRupee
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Staff, StoreProfile } from '@/types/attendance'
import {
  formatDate,
  monthRange,
  calculateStaffPayroll,
  exportSinglePayslipCsv,
  exportMonthlyPayslipsSummaryCsv
} from '@/lib/attendanceUtils'

interface PayslipTabProps {
  staffList: Staff[]
  storeProfile: StoreProfile
  payslipMonth: string
  onMonthChange: (month: string) => void
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

const YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030']

export const PayslipTab: React.FC<PayslipTabProps> = ({
  staffList,
  storeProfile,
  payslipMonth,
  onMonthChange
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    return staffList[0]?.id || ''
  })
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false)

  // Parse Month and Year from payslipMonth (format: YYYY-MM)
  const [currentYear, currentMonth] = (
    payslipMonth || new Date().toISOString().slice(0, 7)
  ).split('-')

  const selectedYear = currentYear || new Date().getFullYear().toString()
  const selectedMonth =
    currentMonth || String(new Date().getMonth() + 1).padStart(2, '0')

  const handleYearChange = (newYear: string | null) => {
    if (newYear) {
      onMonthChange(`${newYear}-${selectedMonth}`)
    }
  }

  const handleMonthChange = (newMonth: string | null) => {
    if (newMonth) {
      onMonthChange(`${selectedYear}-${newMonth}`)
    }
  }

  const dates = monthRange(payslipMonth)
  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || staffList[0]

  const handlePrintSingle = () => {
    window.print()
  }

  const handlePrintAll = () => {
    setIsPrintingAll(true)
    setTimeout(() => {
      window.print()
      setIsPrintingAll(false)
    }, 150)
  }

  const handleExportSingleCsv = () => {
    if (selectedStaff) {
      exportSinglePayslipCsv(selectedStaff, dates, storeProfile)
    }
  }

  const handleExportMonthlySummary = () => {
    exportMonthlyPayslipsSummaryCsv(staffList, payslipMonth, storeProfile)
  }

  const renderSingleSlip = (staff: Staff, isPrintSlip = false) => {
    const calc = calculateStaffPayroll(staff, dates)
    const outletLogo = (storeProfile.outletLogos || []).find(
      (x) => x.name === staff.outlet && x.logo
    )

    const periodLabel = dates.length
      ? `${formatDate(dates[0])}${
          dates.length > 1 ? ` to ${formatDate(dates[dates.length - 1])}` : ''
        }`
      : ''

    return (
      <section
        className={`payslip-tablebox overflow-x-auto bg-white text-black dark:bg-[#121212] dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-xs ${
          isPrintSlip ? 'print-slip' : ''
        }`}
      >
        <table className="w-full border-collapse text-left text-black dark:text-white">
          <thead>
            {/* 1. Brand & Outlet Header */}
            <tr>
              <th
                colSpan={6}
                className="p-3.5 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 font-normal"
              >
                <div className="flex items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    {storeProfile.logo ? (
                      <img
                        src={storeProfile.logo}
                        alt="Logo"
                        style={{ maxWidth: '85px', maxHeight: '65px', objectFit: 'contain' }}
                        className="rounded"
                      />
                    ) : null}
                    <div>
                      <div className="text-lg font-bold text-black dark:text-white leading-tight">
                        {storeProfile.name || 'Store / Company Name'}
                      </div>
                      <div className="text-xs text-neutral-900 dark:text-neutral-200 font-normal max-w-md">
                        {storeProfile.address || 'Address not added'}
                      </div>
                      {storeProfile.phone && (
                        <div className="text-xs text-neutral-900 dark:text-neutral-200 font-normal">
                          Phone: {storeProfile.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {outletLogo ? (
                      <img
                        src={outletLogo.logo}
                        alt="Outlet Logo"
                        style={{ maxWidth: '85px', maxHeight: '65px', objectFit: 'contain' }}
                        className="ml-auto rounded"
                      />
                    ) : null}
                    {staff.outlet && (
                      <div className="text-xs font-bold text-black dark:text-white mt-1">
                        {staff.outlet}
                      </div>
                    )}
                  </div>
                </div>
              </th>
            </tr>

            {/* 2. Subheader Banner */}
            <tr className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-300 dark:border-neutral-700">
              <th
                colSpan={6}
                className="px-3.5 py-2.5 text-xs font-bold text-black dark:text-white uppercase tracking-wider"
              >
                PAY SLIP · {staff.name} (ID {staff.id}) · {staff.dept} · {periodLabel}
              </th>
            </tr>

            {/* 3. Column Headers */}
            <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-700 text-[11px] font-bold text-black dark:text-white uppercase">
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Attendance</th>
              <th className="px-3 py-2 text-right">Daily wage ₹</th>
              <th className="px-3 py-2 text-right">Over-duty ₹</th>
              <th className="px-3 py-2 text-right">Advance ₹</th>
              <th className="px-3 py-2 text-right">Day net ₹</th>
            </tr>
          </thead>

          <tbody>
            {dates.map((d) => {
              const mark = staff.attendance[d] || '—'
              const rate = Number(
                staff.wageByDate &&
                  staff.wageByDate[d] !== undefined &&
                  staff.wageByDate[d] !== ''
                  ? staff.wageByDate[d]
                  : staff.wage || 0
              )
              const wage = rate * (mark === 'P' ? 1 : mark === 'H' ? 0.5 : 0)
              const o = staff.overtime[d] || {}
              const ot = Number(
                o.amount !== undefined
                  ? o.amount
                  : Number(o.hours || 0) * Number(o.rate || 0)
              )
              const adv = Number(staff.advances[d] || 0)
              const net = wage + ot - adv

              return (
                <tr
                  key={d}
                  className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-xs text-black dark:text-white"
                >
                  <td className="px-3 py-1.5 font-medium">{formatDate(d)}</td>
                  <td className="px-3 py-1.5 font-bold text-black dark:text-white">
                    {mark}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-black dark:text-white">
                    ₹{wage.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-black dark:text-white">
                    ₹{ot.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-black dark:text-white">
                    ₹{adv.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold text-black dark:text-white">
                    ₹{net.toLocaleString('en-IN')}
                  </td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="font-bold text-xs border-t-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white">
              <th
                colSpan={2}
                className="px-3 py-2.5 text-left text-black dark:text-white font-bold"
              >
                Period totals · Present {calc.full} · Half {calc.half} · Absent {calc.abs}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-black dark:text-white font-bold">
                ₹{calc.base.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-black dark:text-white font-bold">
                ₹{calc.otPay.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-black dark:text-white font-bold">
                ₹{calc.advance.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-xs font-bold text-black dark:text-white">
                ₹{calc.net.toLocaleString('en-IN')}
              </th>
            </tr>
          </tfoot>
        </table>
      </section>
    )
  }

  const selectedStaffCalc = selectedStaff ? calculateStaffPayroll(selectedStaff, dates) : null

  return (
    <div className="space-y-4">
      {/* Control Bar (hidden in print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-4 bg-card border border-border/80 rounded-xl shadow-xs print:hidden">
        <div className="flex items-center flex-wrap gap-4">
          {/* Month & Year shadcn UI Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Month & Year:</span>
            </label>
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-9 min-w-[125px] bg-background border-border text-sm font-medium">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 min-w-[90px] bg-background border-border text-sm font-medium">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Staff Member Picker */}
          <div className="space-y-1.5 min-w-[240px] sm:min-w-[300px]">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Select Employee:</span>
            </label>
            <Select
              value={selectedStaffId || (staffList[0]?.id || '')}
              onValueChange={(val) => {
                if (val) setSelectedStaffId(val)
              }}
            >
              <SelectTrigger className="w-full h-9 bg-background border-border text-sm font-medium">
                {selectedStaff ? (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      #{selectedStaff.id}
                    </span>
                    <span className="truncate font-medium">{selectedStaff.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto hidden sm:inline-block">
                      {selectedStaff.dept}
                    </span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select Staff Member" />
                )}
              </SelectTrigger>
              <SelectContent className="max-h-64 min-w-[320px]">
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                          #{s.id}
                        </span>
                        <span className="font-medium text-foreground truncate">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                        <span>{s.dept}</span>
                        {s.outlet && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-muted/60">
                            {s.outlet}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0">
          <Button
            onClick={handlePrintSingle}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print Payslip</span>
          </Button>

          <Button
            variant="outline"
            onClick={handlePrintAll}
            className="border-border hover:bg-muted font-medium text-xs sm:text-sm h-9"
          >
            <Receipt className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <span>Print Everyone</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportSingleCsv}
            className="border-border hover:bg-muted font-medium text-xs sm:text-sm h-9"
            title="Download this employee's payslip as CSV"
          >
            <Download className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <span>Slip CSV</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportMonthlySummary}
            className="border-border hover:bg-muted font-medium text-xs sm:text-sm h-9"
            title="Download full monthly payroll summary as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <span>Monthly CSV</span>
          </Button>
        </div>
      </div>

      {/* Staff Preview Header Banner (shows ID, name, designation, dept, wages, net summary) */}
      {!isPrintingAll && selectedStaff && selectedStaffCalc && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-card border border-border/80 rounded-xl shadow-xs print:hidden">
          {/* Employee Info Card */}
          <div className="flex items-center gap-3.5 md:col-span-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-lg flex items-center justify-center shrink-0">
              {selectedStaff.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  ID #{selectedStaff.id}
                </span>
                <span className="font-bold text-base text-foreground truncate">
                  {selectedStaff.name}
                </span>
                {selectedStaff.designation && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {selectedStaff.designation}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {selectedStaff.dept}
                </span>
                {selectedStaff.outlet && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedStaff.outlet}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {selectedStaff.wage && Number(selectedStaff.wage) > 0 ? `₹${Number(selectedStaff.wage).toLocaleString('en-IN')} / day` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Month Stats */}
          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-border/60 pt-2.5 md:pt-0 md:pl-4">
            <div className="text-left md:text-right">
              <div className="text-xs text-muted-foreground font-medium">Days Attended</div>
              <div className="text-sm font-bold text-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">{selectedStaffCalc.full}P</span>
                {selectedStaffCalc.half > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1.5">{selectedStaffCalc.half}H</span>
                )}
                {selectedStaffCalc.abs > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 ml-1.5">{selectedStaffCalc.abs}A</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Month Net Pay</div>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{selectedStaffCalc.net.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Single Payslip View */}
      {!isPrintingAll && selectedStaff ? (
        renderSingleSlip(selectedStaff)
      ) : !isPrintingAll ? (
        <Card className="p-8 text-center text-muted-foreground">
          No staff member selected.
        </Card>
      ) : null}

      {/* Bulk Print View (Active only when Print Everyone is clicked) */}
      {isPrintingAll && (
        <div id="allPayslips" className="space-y-8">
          {staffList.map((staff) => (
            <div key={staff.id}>
              {renderSingleSlip(staff, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
