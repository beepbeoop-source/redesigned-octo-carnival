import React, { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { Staff, AttendanceMark } from '@/types/attendance'
import { formatDate, formatCurrency, calculateStaffPayroll } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface AttendanceTabProps {
  staffList: Staff[]
  dates: string[]
  fromDate: string
  toDate: string
  today: string
  onSetPeriod: (from: string, to: string) => boolean
  onUpdateAttendance: (id: string, date: string, mark: AttendanceMark) => void
  onUpdateWage: (id: string, wage: string | number) => void
  onOpenAttendanceEdit: (staff: Staff, date: string) => void
  onOpenStaffActionSheet?: (staff: Staff, date: string) => void
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  staffList,
  dates,
  fromDate,
  toDate,
  today,
  onSetPeriod,
  onUpdateAttendance,
  onUpdateWage,
  onOpenAttendanceEdit,
  onOpenStaffActionSheet
}) => {
  const [localFrom, setLocalFrom] = useState<string>(fromDate)
  const [localTo, setLocalTo] = useState<string>(toDate)
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(today)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'table'
    }
    return 'cards'
  })
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleApply = () => {
    setErrorMsg('')
    const success = onSetPeriod(localFrom, localTo)
    if (!success) {
      setErrorMsg('Please select a valid date range of up to 62 days.')
    }
  }

  const handleSetToday = () => {
    setLocalFrom(today)
    setLocalTo(today)
    setSelectedMobileDate(today)
    onSetPeriod(today, today)
  }

  const handleCycleMark = (staff: Staff, date: string) => {
    if (date === today) {
      const current = staff.attendance[date] || ''
      const next: AttendanceMark = current === 'P' ? 'H' : current === 'H' ? 'A' : 'P'
      onUpdateAttendance(staff.id, date, next)
    } else if (date < today) {
      onOpenAttendanceEdit(staff, date)
    } else {
      setErrorMsg('Cannot mark attendance for a future date.')
      setTimeout(() => setErrorMsg(''), 3500)
    }
  }

  const handleDirectMark = (staffId: string, date: string, mark: AttendanceMark) => {
    if (date > today) {
      setErrorMsg('Cannot mark attendance for a future date.')
      setTimeout(() => setErrorMsg(''), 3500)
      return
    }
    onUpdateAttendance(staffId, date, mark)
  }

  const shiftMobileDate = (offset: number) => {
    const current = new Date(`${selectedMobileDate}T00:00:00`)
    current.setDate(current.getDate() + offset)
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    setSelectedMobileDate(`${y}-${m}-${d}`)
  }

  return (
    <div className="space-y-4">
      {/* Top Bar / Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">From Date</label>
            <Input
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="h-8.5 w-34 sm:w-38 bg-background border-border text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">To Date</label>
            <Input
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="h-8.5 w-34 sm:w-38 bg-background border-border text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={handleApply}
              className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetToday}
              className="h-8.5 border-border text-foreground font-medium text-xs px-2.5"
            >
              Today
            </Button>
          </div>
        </div>

        {/* View Mode Toggle for Mobile / Tablet */}
        <div className="flex items-center justify-end gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className={cn(
              'h-8 px-2.5 text-xs font-semibold gap-1.5',
              viewMode === 'cards' && 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </Button>

          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              'h-8 px-2.5 text-xs font-semibold gap-1.5',
              viewMode === 'table' && 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-200 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mobile Selected Date Navigator (Shown in Cards View) */}
      {viewMode === 'cards' && (
        <div className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/70 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => shiftMobileDate(-1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-foreground">
              {formatDate(selectedMobileDate)}
            </span>
            {selectedMobileDate === today && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                TODAY
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => shiftMobileDate(1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 1. Mobile Cards View (Large touch targets for rapid marking) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staffList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
              No staff members match filter.
            </div>
          ) : (
            staffList.map((staff) => {
              const mark = staff.attendance[selectedMobileDate] || ''
              const calc = calculateStaffPayroll(staff, dates)
              return (
                <Card
                  key={staff.id}
                  className="border-border/80 shadow-xs bg-card hover:border-emerald-500/40 transition-all"
                >
                  <CardContent className="p-3.5 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {staff.name}
                          </h3>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            #{staff.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-medium">
                            {staff.dept}
                          </span>
                          <span>•</span>
                          <span>{staff.outlet || 'Main'}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(Number(staff.wage || 0))}/day
                          </span>
                        </div>
                      </div>

                      {onOpenStaffActionSheet && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenStaffActionSheet(staff, selectedMobileDate)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Open Action Sheet"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Quick P / H / A Segmented Touch Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDirectMark(staff.id, selectedMobileDate, 'P')}
                        className={cn(
                          'flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-all select-none',
                          mark === 'P'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectMark(staff.id, selectedMobileDate, 'H')}
                        className={cn(
                          'flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-all select-none',
                          mark === 'H'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Half</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectMark(staff.id, selectedMobileDate, 'A')}
                        className={cn(
                          'flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-all select-none',
                          mark === 'A'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                    </div>

                    {/* Period Mini Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                      <span>
                        Period: <strong className="text-emerald-600 font-bold">{calc.full}P</strong> ·{' '}
                        <strong className="text-amber-600 font-bold">{calc.half}H</strong> ·{' '}
                        <strong className="text-rose-600 font-bold">{calc.abs}A</strong>
                      </span>
                      <span className="font-bold text-foreground">
                        Earned: {formatCurrency(calc.net)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* 2. Full Table Matrix View */}
      {viewMode === 'table' && (
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-[140px] font-semibold text-xs sticky left-0 z-20 bg-muted/95 backdrop-blur-xs">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-xs">Dept</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-xs text-right">
                      Daily Wage (₹)
                    </TableHead>
                    {dates.map((d) => (
                      <TableHead
                        key={d}
                        className={cn(
                          'text-center font-semibold text-[11px] min-w-[58px] px-1',
                          d === today && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                        )}
                      >
                        <div>{formatDate(d).slice(0, 5)}</div>
                        <div className="text-[9px] text-muted-foreground font-normal">
                          {d === today ? 'Today' : ''}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-semibold text-xs text-emerald-600">P</TableHead>
                    <TableHead className="text-center font-semibold text-xs text-amber-600">H</TableHead>
                    <TableHead className="text-center font-semibold text-xs text-rose-600">A</TableHead>
                    <TableHead className="text-right font-semibold text-xs">Attendance Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={dates.length + 8} className="text-center py-8 text-muted-foreground">
                        No staff members match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffList.map((staff) => {
                      const calc = calculateStaffPayroll(staff, dates)
                      return (
                        <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium text-xs sm:text-sm sticky left-0 z-10 bg-card/95 backdrop-blur-xs border-r border-border/40">
                            <div className="font-semibold text-foreground">{staff.name}</div>
                            <div className="text-[11px] text-muted-foreground">ID: {staff.id}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[11px]">
                              {staff.dept}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                staff.status === 'Working'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : staff.status === 'Active'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {staff.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={staff.wage || ''}
                              onChange={(e) => onUpdateWage(staff.id, e.target.value)}
                              placeholder="Wage"
                              className="h-7.5 w-20 ml-auto text-right text-xs bg-background border-border/70 p-1"
                            />
                          </TableCell>

                          {/* Attendance Marks */}
                          {dates.map((d) => {
                            const mark = staff.attendance[d] || ''
                            return (
                              <TableCell key={d} className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCycleMark(staff, d)}
                                  className={cn(
                                    'w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center mx-auto cursor-pointer select-none',
                                    mark === 'P' &&
                                      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 hover:bg-emerald-200',
                                    mark === 'H' &&
                                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50 hover:bg-amber-200',
                                    mark === 'A' &&
                                      'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/50 hover:bg-rose-200',
                                    !mark &&
                                      'bg-muted/50 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground border border-transparent'
                                  )}
                                  title={`${staff.name} - ${formatDate(d)}: ${mark || 'Unmarked'}`}
                                >
                                  {mark || '—'}
                                </button>
                              </TableCell>
                            )
                          })}

                          <TableCell className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                            {calc.full}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs text-amber-600 dark:text-amber-400">
                            {calc.half}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs text-rose-600 dark:text-rose-400">
                            {calc.abs}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(calc.base)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
