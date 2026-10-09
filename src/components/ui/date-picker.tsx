import React, { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { formatDate, localToday } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  maxDate?: string
  minDate?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  maxDate = localToday(),
  minDate,
  placeholder = 'Select date',
  className,
  disabled = false,
  align = 'start'
}) => {
  const [open, setOpen] = useState(false)
  const today = useMemo(() => localToday(), [])

  // Month currently viewed in the calendar view
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) {
      const d = new Date(`${value}T00:00:00`)
      if (!isNaN(d.valueOf())) return d
    }
    return new Date()
  })

  // Keep viewDate in sync when value changes externally
  React.useEffect(() => {
    if (value) {
      const d = new Date(`${value}T00:00:00`)
      if (!isNaN(d.valueOf())) setViewDate(d)
    }
  }, [value])

  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1))
  }

  const nextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1)
    if (maxDate) {
      const maxD = new Date(`${maxDate}T00:00:00`)
      // If first day of next month is beyond maxDate month, we can still allow viewing if month matches
      if (next.getFullYear() > maxD.getFullYear() || (next.getFullYear() === maxD.getFullYear() && next.getMonth() > maxD.getMonth())) {
        return
      }
    }
    setViewDate(next)
  }

  // Days calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay() // 0 is Sunday

  const isNextDisabled = useMemo(() => {
    if (!maxDate) return false
    const maxD = new Date(`${maxDate}T00:00:00`)
    return (
      viewYear > maxD.getFullYear() ||
      (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth())
    )
  }, [maxDate, viewYear, viewMonth])

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0')
    const dStr = String(day).padStart(2, '0')
    const dateStr = `${viewYear}-${mStr}-${dStr}`

    if (maxDate && dateStr > maxDate) return
    if (minDate && dateStr < minDate) return

    onChange(dateStr)
    setOpen(false)
  }

  const handleSelectToday = () => {
    onChange(today)
    setViewDate(new Date())
    setOpen(false)
  }

  const handleSelectYesterday = () => {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
    onChange(yStr)
    setViewDate(y)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-between gap-2 h-8.5 w-full min-w-[130px] rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs sm:text-sm font-medium text-foreground transition-all hover:bg-muted/40 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-2xs',
          className
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? formatDate(value) : placeholder}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[280px] p-3 rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg"
      >
        {/* Header: Month & Year + Controls */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs font-bold text-foreground">
            {monthNames[viewMonth]} {viewYear}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            disabled={isNextDisabled}
            className={cn(
              'h-7 w-7 p-0 text-muted-foreground hover:text-foreground',
              isNextDisabled && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
            <div
              key={w}
              className="text-[10px] font-bold text-muted-foreground uppercase py-0.5"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Leading empty cells for offset */}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1
            const mStr = String(viewMonth + 1).padStart(2, '0')
            const dStr = String(dayNum).padStart(2, '0')
            const dateStr = `${viewYear}-${mStr}-${dStr}`

            const isSelected = value === dateStr
            const isToday = today === dateStr
            const isFuture = maxDate ? dateStr > maxDate : false
            const isPastDisabled = minDate ? dateStr < minDate : false
            const isDisabled = isFuture || isPastDisabled

            return (
              <button
                key={dayNum}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectDay(dayNum)}
                className={cn(
                  'h-7 w-7 text-xs font-semibold rounded-md flex items-center justify-center transition-all select-none',
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : isToday
                    ? 'border border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10'
                    : 'text-foreground hover:bg-muted',
                  isDisabled && 'opacity-20 cursor-not-allowed hover:bg-transparent text-muted-foreground'
                )}
              >
                {dayNum}
              </button>
            )
          })}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-between gap-1 pt-2.5 mt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectYesterday}
            className="h-7 text-[11px] px-2 border-border/80 text-muted-foreground hover:text-foreground"
          >
            Yesterday
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSelectToday}
            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  fromDate: string
  toDate: string
  onSetPeriod: (from: string, to: string) => void
  maxDate?: string
  className?: string
  align?: 'start' | 'center' | 'end'
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onSetPeriod,
  maxDate = localToday(),
  className,
  align = 'end'
}) => {
  const [open, setOpen] = useState(false)

  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} – ${formatDate(toDate)}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/80 bg-background hover:bg-muted/50 text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs',
          className
        )}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{periodLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60 ml-0.5" />
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[260px] p-3 rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-xl space-y-2.5"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            From Date:
          </label>
          <DatePicker
            value={fromDate}
            onChange={(d) => {
              let to = toDate
              if (d > to) to = d
              if (maxDate && to > maxDate) to = maxDate
              onSetPeriod(d, to)
            }}
            maxDate={maxDate}
            className="w-full h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            To Date:
          </label>
          <DatePicker
            value={toDate}
            onChange={(d) => {
              let from = fromDate
              if (d < from) from = d
              onSetPeriod(from, d)
            }}
            maxDate={maxDate}
            minDate={fromDate}
            className="w-full h-8 text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
