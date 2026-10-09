import React, { useState, useMemo } from 'react'
import {
  Users,
  Banknote,
  ClockAlert,
  HandCoins,
  Wallet,
  Info,
  Building
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  formatCurrency,
  calculateGroupSummary,
  calculateStaffPayroll,
  localToday,
  makeDates
} from '@/lib/attendanceUtils'
import { PeriodRangePicker } from '@/components/layout/PeriodRangePicker'

interface DashboardTabProps {
  staffList: Staff[]
  dates?: string[]
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ staffList }) => {
  const today = useMemo(() => localToday(), [])
  const defaultMonthStart = useMemo(() => `${today.slice(0, 7)}-01`, [today])

  // Summary Table local range state (defaults to current month up to today)
  const [summaryFrom, setSummaryFrom] = useState(defaultMonthStart)
  const [summaryTo, setSummaryTo] = useState(today)

  // Top metric cards calculate across current month dates
  const monthDates = useMemo(
    () => makeDates(defaultMonthStart, today) || [today],
    [defaultMonthStart, today]
  )

  const totalStats = useMemo(
    () =>
      staffList.reduce(
        (acc, staff) => {
          const calc = calculateStaffPayroll(staff, monthDates)
          acc.base += calc.base
          acc.ot += calc.otPay
          acc.adv += calc.advance
          acc.net += calc.net
          acc.full += calc.full
          acc.half += calc.half
          acc.abs += calc.abs
          return acc
        },
        { base: 0, ot: 0, adv: 0, net: 0, full: 0, half: 0, abs: 0 }
      ),
    [staffList, monthDates]
  )

  // Summary table dates based on summaryFrom / summaryTo
  const summaryDates = useMemo(() => {
    return makeDates(summaryFrom, summaryTo)?.filter((d) => d <= today) || [today]
  }, [summaryFrom, summaryTo, today])

  const groupSummaries = useMemo(
    () => calculateGroupSummary(staffList, summaryDates),
    [staffList, summaryDates]
  )

  const summaryTotals = useMemo(
    () =>
      staffList.reduce(
        (acc, staff) => {
          const calc = calculateStaffPayroll(staff, summaryDates)
          acc.base += calc.base
          acc.ot += calc.otPay
          acc.adv += calc.advance
          acc.net += calc.net
          acc.full += calc.full
          acc.half += calc.half
          acc.abs += calc.abs
          return acc
        },
        { base: 0, ot: 0, adv: 0, net: 0, full: 0, half: 0, abs: 0 }
      ),
    [staffList, summaryDates]
  )

  return (
    <div className="space-y-6">
      {/* 5 Key Metric Cards (2x2 on mobile, 5-col on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5">
        {/* Staff Members */}
        <Card className="border-border/80 shadow-2xs bg-card hover:border-border transition-colors">
          <CardContent className="p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block truncate leading-tight">
                Staff Members
              </span>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate mt-0.5">
                {staffList.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Pay */}
        <Card className="border-border/80 shadow-2xs bg-card hover:border-border transition-colors">
          <CardContent className="p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block truncate leading-tight">
                Attendance Pay
              </span>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
                {formatCurrency(totalStats.base)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Over-Duty Pay */}
        <Card className="border-border/80 shadow-2xs bg-card hover:border-border transition-colors">
          <CardContent className="p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ClockAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block truncate leading-tight">
                Over-Duty Pay
              </span>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 truncate mt-0.5">
                {formatCurrency(totalStats.ot)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advance Deducted */}
        <Card className="border-border/80 shadow-2xs bg-card hover:border-border transition-colors">
          <CardContent className="p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <HandCoins className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block truncate leading-tight">
                Advance Deducted
              </span>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 truncate mt-0.5">
                {formatCurrency(totalStats.adv)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Salary */}
        <Card className="col-span-2 sm:col-span-1 border-border/80 shadow-2xs bg-card hover:border-border transition-colors border-emerald-500/30">
          <CardContent className="p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 block truncate leading-tight">
                Net Salary
              </span>
              <div className="text-base sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-300 truncate mt-0.5">
                {formatCurrency(totalStats.net)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/20 border-l-4 border-emerald-600 rounded-r-xl text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
        <Info className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <strong>Dashboard Summary:</strong> Breakdown grouped by outlet and department for current active period. Use Attendance tab to configure daily records.
        </div>
      </div>

      {/* Grouped Breakdown Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Outlet & Department Summary
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregated attendance and payroll totals
            </p>
          </div>
          <div className="shrink-0">
            <PeriodRangePicker
              fromDate={summaryFrom}
              toDate={summaryTo}
              onSetPeriod={(from, to) => {
                setSummaryFrom(from)
                setSummaryTo(to)
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs">Outlet</TableHead>
                  <TableHead className="font-semibold text-xs">Department</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Staff</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Present (P)</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Half (H)</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Absent (A)</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Attendance Pay</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Over-Duty</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Advance</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No staff records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupSummaries.map((g, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-xs sm:text-sm">{g.outlet}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground">
                          {g.dept}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs sm:text-sm">
                        {g.staff}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold">
                        {g.full}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-semibold">
                        {g.half}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold">
                        {g.abs}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        {formatCurrency(g.base)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                        {formatCurrency(g.ot)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                        {formatCurrency(g.adv)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(g.net)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="bg-muted/70 font-bold border-t-2 border-border">
                <TableRow>
                  <TableCell colSpan={2} className="text-xs sm:text-sm">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">{staffList.length}</TableCell>
                  <TableCell className="text-center text-green-700 dark:text-green-300 text-xs sm:text-sm">
                    {summaryTotals.full}
                  </TableCell>
                  <TableCell className="text-center text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
                    {summaryTotals.half}
                  </TableCell>
                  <TableCell className="text-center text-red-700 dark:text-red-300 text-xs sm:text-sm">
                    {summaryTotals.abs}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(summaryTotals.base)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(summaryTotals.ot)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(summaryTotals.adv)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-extrabold">
                    {formatCurrency(summaryTotals.net)}
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
