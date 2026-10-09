import React from 'react'
import { FileSpreadsheet, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table'
import type { Staff } from '@/types/attendance'
import { formatDate, formatCurrency, calculateStaffPayroll } from '@/lib/attendanceUtils'

interface ReportTabProps {
  staffList: Staff[]
  dates: string[]
  fromDate: string
  toDate: string
}

export const ReportTab: React.FC<ReportTabProps> = ({
  staffList,
  dates,
  fromDate,
  toDate
}) => {
  const totals = staffList.reduce(
    (acc, staff) => {
      const calc = calculateStaffPayroll(staff, dates)
      acc.full += calc.full
      acc.half += calc.half
      acc.abs += calc.abs
      acc.base += calc.base
      acc.ot += calc.otPay
      acc.adv += calc.advance
      acc.net += calc.net
      return acc
    },
    { full: 0, half: 0, abs: 0, base: 0, ot: 0, adv: 0, net: 0 }
  )

  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} to ${formatDate(toDate)}`

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Comprehensive Attendance & Payroll Report
            </h2>
            <p className="text-xs text-muted-foreground">Period: {periodLabel}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
        <Info className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          Each date cell shows: <strong>[Mark · Wage · OT · Advance · Day Net]</strong>. Scroll horizontally to inspect full timeline data.
        </span>
      </div>

      {/* Report Table Card */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[140px] font-semibold text-xs sticky left-0 z-20 bg-muted/95 backdrop-blur-xs">
                    Employee
                  </TableHead>
                  <TableHead className="font-semibold text-xs">Outlet</TableHead>
                  <TableHead className="font-semibold text-xs">Department</TableHead>
                  <TableHead className="font-semibold text-xs text-center text-emerald-600">P</TableHead>
                  <TableHead className="font-semibold text-xs text-center text-amber-600">H</TableHead>
                  <TableHead className="font-semibold text-xs text-center text-rose-600">A</TableHead>

                  {/* Date Columns */}
                  {dates.map((d) => (
                    <TableHead key={d} className="min-w-[130px] font-semibold text-[11px] text-center px-2">
                      <div>{formatDate(d)}</div>
                      <div className="text-[9px] text-muted-foreground font-normal">
                        Mark · Wage · OT · Adv · Net
                      </div>
                    </TableHead>
                  ))}

                  <TableHead className="font-semibold text-xs text-right min-w-[110px]">
                    Attendance Pay
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right min-w-[90px]">
                    Over-Duty
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right min-w-[90px]">
                    Advance
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right min-w-[110px]">
                    Net Salary
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={dates.length + 10} className="text-center py-8 text-muted-foreground">
                      No staff records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffList.map((staff) => {
                    const calc = calculateStaffPayroll(staff, dates)
                    return (
                      <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium text-xs sticky left-0 z-10 bg-card/95 backdrop-blur-xs border-r border-border/40">
                          <div className="font-semibold text-foreground">{staff.name}</div>
                          <div className="text-[10px] text-muted-foreground">ID: {staff.id}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {staff.outlet || '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px]">
                            {staff.dept}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {calc.full}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {calc.half}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {calc.abs}
                        </TableCell>

                        {/* Daily Multi-metric Cell */}
                        {dates.map((d) => {
                          const mark = staff.attendance[d] || '—'
                          const dailyRate = Number(
                            staff.wageByDate &&
                              staff.wageByDate[d] !== undefined &&
                              staff.wageByDate[d] !== ''
                              ? staff.wageByDate[d]
                              : staff.wage || 0
                          )
                          const wage =
                            dailyRate * (mark === 'P' ? 1 : mark === 'H' ? 0.5 : 0)
                          const ot = staff.overtime[d] || {}
                          const otAmt = Number(
                            ot.amount !== undefined
                              ? ot.amount
                              : Number(ot.hours || 0) * Number(ot.rate || 0)
                          )
                          const adv = Number(staff.advances[d] || 0)
                          const dayNet = wage + otAmt - adv

                          return (
                            <TableCell key={d} className="p-1.5 text-center text-[10px] whitespace-nowrap">
                              <span className="font-bold text-foreground">{mark}</span>
                              <span className="text-muted-foreground"> · ₹{wage}</span>
                              <span className="text-amber-600 dark:text-amber-400"> · ₹{otAmt}</span>
                              <span className="text-rose-600 dark:text-rose-400"> · ₹{adv}</span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                {' '}
                                = ₹{dayNet}
                              </span>
                            </TableCell>
                          )
                        })}

                        <TableCell className="text-right text-xs font-medium">
                          {formatCurrency(calc.base)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-amber-600 dark:text-amber-400">
                          {formatCurrency(calc.otPay)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-rose-600 dark:text-rose-400">
                          {formatCurrency(calc.advance)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(calc.net)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
              <TableFooter className="bg-muted/70 font-bold border-t-2 border-border">
                <TableRow>
                  <TableCell colSpan={3} className="text-xs">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-center text-xs text-emerald-700 dark:text-emerald-300">
                    {totals.full}
                  </TableCell>
                  <TableCell className="text-center text-xs text-amber-700 dark:text-amber-300">
                    {totals.half}
                  </TableCell>
                  <TableCell className="text-center text-xs text-rose-700 dark:text-rose-300">
                    {totals.abs}
                  </TableCell>
                  <TableCell colSpan={dates.length} className="text-center text-[11px] text-muted-foreground">
                    — Detailed Day Calculations —
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatCurrency(totals.base)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-amber-600 dark:text-amber-400">
                    {formatCurrency(totals.ot)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-rose-600 dark:text-rose-400">
                    {formatCurrency(totals.adv)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(totals.net)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
