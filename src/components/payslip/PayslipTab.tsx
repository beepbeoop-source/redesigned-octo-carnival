import React, { useState } from 'react'
import { Printer, Users, Receipt, Calendar, Download, FileSpreadsheet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        className={`payslip-tablebox overflow-x-auto bg-white text-[#20332c] dark:bg-[#1c2a25] dark:text-[#e5eee9] border border-[#e3ebe7] dark:border-[#34463f] rounded-xl shadow-xs ${
          isPrintSlip ? 'print-slip' : ''
        }`}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            {/* 1. Brand & Outlet Header */}
            <tr>
              <th
                colSpan={6}
                className="p-3.5 bg-[#fafcfb] dark:bg-[#24352d] border-b border-[#dfe8e3] dark:border-[#3a4c43] font-normal"
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
                      <div className="text-lg font-bold text-[#173b2f] dark:text-[#e5eee9] leading-tight">
                        {storeProfile.name || 'Store / Company Name'}
                      </div>
                      <div className="text-[11px] text-[#718078] dark:text-[#a4b5ac] font-normal max-w-md">
                        {storeProfile.address || 'Address not added'}
                      </div>
                      {storeProfile.phone && (
                        <div className="text-[11px] text-[#718078] dark:text-[#a4b5ac] font-normal">
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
                      <div className="text-xs font-semibold text-[#173b2f] dark:text-[#a8e5c7] mt-1">
                        {staff.outlet}
                      </div>
                    )}
                  </div>
                </div>
              </th>
            </tr>

            {/* 2. Subheader Banner */}
            <tr className="bg-[#f1f6f3] dark:bg-[#203028] border-b border-[#dfe8e3] dark:border-[#3a4c43]">
              <th
                colSpan={6}
                className="px-3.5 py-2.5 text-xs font-bold text-[#173b2f] dark:text-[#e5eee9] uppercase tracking-wider"
              >
                PAY SLIP · {staff.name} (ID {staff.id}) · {staff.dept} · {periodLabel}
              </th>
            </tr>

            {/* 3. Column Headers */}
            <tr className="bg-[#fafcfb] dark:bg-[#24352d] border-b border-[#dfe8e3] dark:border-[#3a4c43] text-[11px] font-bold text-[#52675d] dark:text-[#c0d0c7] uppercase">
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
                  className="border-b border-[#edf1ef] dark:border-[#2e4037] hover:bg-[#f8fbf9] dark:hover:bg-[#24362d] text-xs text-[#31443c] dark:text-[#bdcbc4]"
                >
                  <td className="px-3 py-1.5">{formatDate(d)}</td>
                  <td className="px-3 py-1.5 font-bold">
                    <span
                      className={
                        mark === 'P'
                          ? 'text-[#11724f] dark:text-[#9fe2bd]'
                          : mark === 'H'
                          ? 'text-[#98600c] dark:text-[#ffdc91]'
                          : mark === 'A'
                          ? 'text-[#b7404b] dark:text-[#ffb7b7]'
                          : 'text-neutral-400'
                      }
                    >
                      {mark}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    ₹{wage.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#98600c] dark:text-[#ffdc91]">
                    ₹{ot.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#b7404b] dark:text-[#ffb7b7]">
                    ₹{adv.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-bold text-[#162b26] dark:text-[#e5eee9]">
                    ₹{net.toLocaleString('en-IN')}
                  </td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="bg-[#f1f6f3] dark:bg-[#24352d] font-bold text-xs border-t-2 border-[#dfe8e3] dark:border-[#3a4c43]">
              <th
                colSpan={2}
                className="px-3 py-2.5 text-left text-[#162b26] dark:text-[#e5eee9] font-bold"
              >
                Period totals · Present {calc.full} · Half {calc.half} · Absent {calc.abs}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-[#162b26] dark:text-[#e5eee9] font-bold">
                ₹{calc.base.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-[#162b26] dark:text-[#e5eee9] font-bold">
                ₹{calc.otPay.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-[#162b26] dark:text-[#e5eee9] font-bold">
                ₹{calc.advance.toLocaleString('en-IN')}
              </th>
              <th className="px-3 py-2.5 text-right font-mono text-sm font-extrabold text-[#117a5b] dark:text-[#a8e5c7]">
                ₹{calc.net.toLocaleString('en-IN')}
              </th>
            </tr>
          </tfoot>
        </table>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Bar (hidden in print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs print:hidden">
        <div className="flex items-center flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Payslip Month:</span>
            </label>
            <Input
              type="month"
              value={payslipMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="h-9 w-40 bg-background border-border text-sm"
            />
          </div>

          <div className="space-y-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Staff Member:</span>
            </label>
            <Select
              value={selectedStaffId || (staffList[0]?.id || '')}
              onValueChange={(val) => setSelectedStaffId(val as string)}
            >
              <SelectTrigger className="w-full h-9 bg-background border-border text-sm font-medium">
                <SelectValue placeholder="Select Staff Member" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.id} - {s.name} ({s.dept})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
