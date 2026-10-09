import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Staff, AttendanceMark } from '@/types/attendance'
import { formatDate } from '@/lib/attendanceUtils'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  IndianRupee,
  ClockAlert,
  HandCoins
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StaffActionSheetProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
  currentDate: string
  onUpdateAttendance: (id: string, date: string, mark: AttendanceMark) => void
  onUpdateOvertime: (id: string, date: string, amount: string | number) => void
  onUpdateAdvance: (id: string, date: string, amount: string | number) => void
  onUpdateWage: (id: string, wage: string | number) => void
  onOpenEditStaff: (staff: Staff) => void
  onDeleteStaff: (id: string) => void
}

export const StaffActionSheet: React.FC<StaffActionSheetProps> = ({
  isOpen,
  onClose,
  staff,
  currentDate,
  onUpdateAttendance,
  onUpdateOvertime,
  onUpdateAdvance,
  onUpdateWage,
  onOpenEditStaff,
  onDeleteStaff
}) => {
  const [otInput, setOtInput] = useState<string>('')
  const [advInput, setAdvInput] = useState<string>('')
  const [wageInput, setWageInput] = useState<string>('')

  useEffect(() => {
    if (staff && currentDate) {
      const ot = staff.overtime[currentDate] || {}
      const otAmt = ot.amount !== undefined ? ot.amount : ''
      setOtInput(String(otAmt || ''))
      setAdvInput(String(staff.advances[currentDate] || ''))
      setWageInput(staff.wage && String(staff.wage) !== '0' ? String(staff.wage) : '')
    }
  }, [staff, currentDate, isOpen])

  if (!staff) return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const isFutureDate = currentDate > todayStr
  const currentMark = staff.attendance[currentDate] || ''

  const handleMark = (mark: AttendanceMark) => {
    if (isFutureDate) return
    onUpdateAttendance(staff.id, currentDate, mark)
  }

  const handleSaveOt = () => {
    onUpdateOvertime(staff.id, currentDate, otInput)
  }

  const handleSaveAdv = () => {
    onUpdateAdvance(staff.id, currentDate, advInput)
  }

  const handleSaveWage = () => {
    onUpdateWage(staff.id, wageInput)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[88vh] overflow-y-auto p-4 space-y-4">
        <SheetHeader className="p-0 border-b border-border/60 pb-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                {staff.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {staff.id} • {staff.dept}{staff.outlet ? ` • ${staff.outlet}` : ''}
              </p>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                staff.status === 'Working'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {staff.status}
            </span>
          </div>
        </SheetHeader>

        {/* 1. Quick Attendance Marking for Current Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              Attendance for {formatDate(currentDate)}:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {currentMark === 'P'
                ? 'Present (1.0)'
                : currentMark === 'H'
                ? 'Half Day (0.5)'
                : currentMark === 'A'
                ? 'Absent (0.0)'
                : 'Unmarked'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isFutureDate}
              onClick={() => handleMark('P')}
              className={cn(
                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                isFutureDate && 'opacity-60 cursor-not-allowed',
                currentMark === 'P'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-600 dark:text-emerald-400" />
              <span>Present (P)</span>
            </button>

            <button
              type="button"
              disabled={isFutureDate}
              onClick={() => handleMark('H')}
              className={cn(
                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                isFutureDate && 'opacity-60 cursor-not-allowed',
                currentMark === 'H'
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <Clock className="w-5 h-5 mb-1 text-amber-600 dark:text-amber-400" />
              <span>Half Day (H)</span>
            </button>

            <button
              type="button"
              disabled={isFutureDate}
              onClick={() => handleMark('A')}
              className={cn(
                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none',
                isFutureDate && 'opacity-60 cursor-not-allowed',
                currentMark === 'A'
                  ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <XCircle className="w-5 h-5 mb-1 text-rose-600 dark:text-rose-400" />
              <span>Absent (A)</span>
            </button>
          </div>
        </div>

        {/* 2. Quick Overtime / Extra Hours */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1 text-foreground">
              <ClockAlert className="w-3.5 h-3.5 text-amber-600" /> Over-Duty Amount (₹)
            </span>
            <span className="text-muted-foreground text-[11px]">{formatDate(currentDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={otInput}
              onChange={(e) => setOtInput(e.target.value)}
              placeholder="0"
              className="h-8.5 text-xs bg-background"
            />
            <Button
              size="sm"
              onClick={handleSaveOt}
              className="h-8.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs"
            >
              Set OT
            </Button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pt-1">
            {[100, 200, 300, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setOtInput(String(val))
                  onUpdateOvertime(staff.id, currentDate, val)
                }}
                className="px-2 py-1 rounded-md bg-background border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                +{val}₹
              </button>
            ))}
          </div>
        </div>

        {/* 3. Quick Advance Adjustment */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1 text-foreground">
              <HandCoins className="w-3.5 h-3.5 text-rose-600" /> Advance Cash Disbursed (₹)
            </span>
            <span className="text-muted-foreground text-[11px]">{formatDate(currentDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={advInput}
              onChange={(e) => setAdvInput(e.target.value)}
              placeholder="0"
              className="h-8.5 text-xs bg-background text-rose-600 font-semibold"
            />
            <Button
              size="sm"
              onClick={handleSaveAdv}
              className="h-8.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              Set Adv
            </Button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pt-1">
            {[500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setAdvInput(String(val))
                  onUpdateAdvance(staff.id, currentDate, val)
                }}
                className="px-2 py-1 rounded-md bg-background border border-border text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                +{val}₹
              </button>
            ))}
          </div>
        </div>

        {/* 4. Usual Daily Wage */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-muted/30 rounded-xl text-xs">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Wage:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              value={wageInput}
              onChange={(e) => setWageInput(e.target.value)}
              className="h-8 w-24 text-right text-xs bg-background font-medium"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveWage}
              className="h-8 text-xs px-2.5"
            >
              Update
            </Button>
          </div>
        </div>

        {/* 5. Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              onOpenEditStaff(staff)
            }}
            className="h-9 text-xs font-semibold"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>Full Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(`Delete ${staff.name}?`)) {
                onDeleteStaff(staff.id)
                onClose()
              }
            }}
            className="h-9 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Staff</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
