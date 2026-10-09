import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate, localToday } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface PeriodRangePickerProps {
  fromDate: string
  toDate: string
  onSetPeriod: (from: string, to: string) => void
  className?: string
  defaultOpen?: boolean
}

export const PeriodRangePicker: React.FC<PeriodRangePickerProps> = ({
  fromDate,
  toDate,
  onSetPeriod,
  className,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [localFrom, setLocalFrom] = useState(fromDate)
  const [localTo, setLocalTo] = useState(toDate)

  // Keep local state in sync with external props
  React.useEffect(() => {
    setLocalFrom(fromDate)
    setLocalTo(toDate)
  }, [fromDate, toDate])

  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} - ${formatDate(toDate)}`

  // Helper presets
  const applyPreset = (preset: 'today' | '7days' | 'thisMonth' | 'lastMonth') => {
    const todayStr = localToday()
    const now = new Date()

    if (preset === 'today') {
      onSetPeriod(todayStr, todayStr)
      setLocalFrom(todayStr)
      setLocalTo(todayStr)
    } else if (preset === '7days') {
      const past = new Date(now)
      past.setDate(past.getDate() - 6)
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
      onSetPeriod(pastStr, todayStr)
      setLocalFrom(pastStr)
      setLocalTo(todayStr)
    } else if (preset === 'thisMonth') {
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      const start = `${y}-${m}-01`
      const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
      onSetPeriod(start, end)
      setLocalFrom(start)
      setLocalTo(end)
    } else if (preset === 'lastMonth') {
      const pastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const y = pastMonth.getFullYear()
      const m = String(pastMonth.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(y, pastMonth.getMonth() + 1, 0).getDate()
      const start = `${y}-${m}-01`
      const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
      onSetPeriod(start, end)
      setLocalFrom(start)
      setLocalTo(end)
    }
  }

  const handleFromChange = (newFrom: string) => {
    setLocalFrom(newFrom)
    if (newFrom && localTo && newFrom <= localTo) {
      onSetPeriod(newFrom, localTo)
    } else if (newFrom && (!localTo || newFrom > localTo)) {
      setLocalTo(newFrom)
      onSetPeriod(newFrom, newFrom)
    }
  }

  const handleToChange = (newTo: string) => {
    setLocalTo(newTo)
    if (newTo && localFrom && localFrom <= newTo) {
      onSetPeriod(localFrom, newTo)
    } else if (newTo && (!localFrom || localFrom > newTo)) {
      setLocalFrom(newTo)
      onSetPeriod(newTo, newTo)
    }
  }

  return (
    <div className={cn('rounded-xl border border-emerald-500/20 bg-emerald-500/5 transition-all', className)}>
      {/* Clickable Header / Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer text-left"
        title="Click to change date range"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate font-semibold">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
          <span>Range</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
      </button>

      {/* Expandable Date Selection Controls */}
      {isOpen && (
        <div className="p-2.5 pt-1 space-y-2 border-t border-emerald-500/15 animate-fade-in text-xs">
          {/* Quick Preset Pills */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => applyPreset('today')}
              className={cn(
                'py-1 px-1 text-[10px] font-bold rounded-md transition-colors text-center cursor-pointer',
                fromDate === toDate && fromDate === localToday()
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-foreground border border-border/80'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7days')}
              className="py-1 px-1 text-[10px] font-bold rounded-md bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-foreground border border-border/80 transition-colors text-center cursor-pointer"
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="py-1 px-1 text-[10px] font-bold rounded-md bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-foreground border border-border/80 transition-colors text-center cursor-pointer"
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="py-1 px-1 text-[10px] font-bold rounded-md bg-background hover:bg-emerald-500/10 text-muted-foreground hover:text-foreground border border-border/80 transition-colors text-center cursor-pointer"
            >
              Prev
            </button>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                From
              </label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full h-7 px-1.5 text-xs font-medium rounded-lg bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                To
              </label>
              <input
                type="date"
                value={localTo}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-full h-7 px-1.5 text-xs font-medium rounded-lg bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
