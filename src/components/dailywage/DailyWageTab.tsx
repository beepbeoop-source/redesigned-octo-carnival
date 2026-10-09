import React from 'react'
import { CircleDollarSign, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { Staff } from '@/types/attendance'
import { formatDate, formatCurrency, localToday } from '@/lib/attendanceUtils'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

interface DailyWageTabProps {
  staffList: Staff[]
  entryDate: string
  onEntryDateChange: (date: string) => void
  onUpdateDailyWage: (id: string, date: string, wage: string | number) => void
}

export const DailyWageTab: React.FC<DailyWageTabProps> = ({
  staffList,
  entryDate,
  onEntryDateChange,
  onUpdateDailyWage
}) => {
  return (
    <div className="space-y-4">
      {/* Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Variable Daily Wage Overrides
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure date-specific rates for {formatDate(entryDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Entry Date:</label>
          <DatePicker
            value={entryDate}
            onChange={onEntryDateChange}
            maxDate={localToday()}
            className="h-9 w-40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-900 dark:text-teal-200">
        <Info className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
        <span>
          For employees configured with variable wages (&ldquo;Changes by date&rdquo;), you can enter a specific wage for {formatDate(entryDate)}. Blank will use their default usual wage.
        </span>
      </div>

      {/* 1. Mobile Cards View (Hidden on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {staffList.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
            No staff records found.
          </div>
        ) : (
          staffList.map((staff) => {
            const mark = staff.attendance[entryDate] || '—'
            const custom =
              staff.wageByDate && staff.wageByDate[entryDate] !== undefined
                ? staff.wageByDate[entryDate]
                : ''

            return (
              <Card key={staff.id} className="border-border/80 shadow-xs bg-card">
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{staff.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        ID #{staff.id} • {staff.dept}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center',
                        mark === 'P' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                        mark === 'H' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                        mark === 'A' && 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                        mark === '—' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {mark}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">
                      Usual: <strong>{staff.wage && Number(staff.wage) > 0 ? formatCurrency(Number(staff.wage)) : '—'}</strong>
                    </span>

                    {staff.salaryChanges ? (
                      <Input
                        type="number"
                        min="0"
                        value={custom}
                        onChange={(e) => onUpdateDailyWage(staff.id, entryDate, e.target.value)}
                        placeholder="Override ₹"
                        className="h-8 w-28 text-right text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Fixed Wage</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 2. Desktop Table View (Hidden on Mobile) */}
      <Card className="border-border/80 shadow-sm overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs">Employee</TableHead>
                <TableHead className="font-semibold text-xs">Outlet</TableHead>
                <TableHead className="font-semibold text-xs text-right">Usual Daily Wage</TableHead>
                <TableHead className="font-semibold text-xs text-right min-w-[180px]">
                  Wage for {formatDate(entryDate)} (₹)
                </TableHead>
                <TableHead className="font-semibold text-xs text-center">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No staff records found.
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map((staff) => {
                  const mark = staff.attendance[entryDate] || '—'
                  const custom =
                    staff.wageByDate && staff.wageByDate[entryDate] !== undefined
                      ? staff.wageByDate[entryDate]
                      : ''

                  return (
                    <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="font-semibold text-foreground">{staff.name}</div>
                        <div className="text-[11px] text-muted-foreground">ID: {staff.id}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staff.outlet || '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium">
                        {staff.wage && Number(staff.wage) > 0 ? formatCurrency(Number(staff.wage)) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {staff.salaryChanges ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={custom}
                            onChange={(e) => onUpdateDailyWage(staff.id, entryDate, e.target.value)}
                            placeholder="Same as usual"
                            className="h-8 w-36 ml-auto text-right text-xs bg-background border-border/80"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Fixed Salary</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold',
                            mark === 'P' && 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
                            mark === 'H' && 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
                            mark === 'A' && 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
                            mark === '—' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {mark}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
