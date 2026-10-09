import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Staff, AttendanceMark } from '@/types/attendance'
import { formatDate } from '@/lib/attendanceUtils'
import { CheckCircle2, Clock, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceEditModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
  date: string
  onSave: (id: string, date: string, mark: AttendanceMark) => void
}

export const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  isOpen,
  onClose,
  staff,
  date,
  onSave
}) => {
  if (!staff || !date) return null

  const currentMark = staff.attendance[date] || ''

  const handleSelectOption = (mark: AttendanceMark) => {
    onSave(staff.id, date, mark)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Set Attendance Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Staff & Date Summary Box */}
          <div className="p-3.5 bg-muted/40 border border-border/70 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Employee:</span>
              <strong className="text-foreground text-sm">{staff.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID & Department:</span>
              <span className="font-medium text-foreground">
                #{staff.id} • {staff.dept} {staff.outlet ? `• ${staff.outlet}` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <strong className="text-foreground font-semibold">{formatDate(date)}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Current Status:</span>
              <span
                className={cn(
                  'font-bold text-xs px-2 py-0.5 rounded',
                  currentMark === 'P' && 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
                  currentMark === 'H' && 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
                  currentMark === 'A' && 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
                  !currentMark && 'bg-muted text-muted-foreground'
                )}
              >
                {currentMark === 'P'
                  ? 'Present (P)'
                  : currentMark === 'H'
                  ? 'Half Day (H)'
                  : currentMark === 'A'
                  ? 'Absent (A)'
                  : 'Unmarked (—)'}
              </span>
            </div>
          </div>

          {/* Mark Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Choose an attendance mark to apply:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectOption('P')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all select-none cursor-pointer',
                  currentMark === 'P'
                    ? 'bg-green-100 dark:bg-green-950/70 border-green-500 text-green-800 dark:text-green-200 ring-2 ring-green-500 shadow-xs'
                    : 'border-border bg-card hover:bg-green-500/10 hover:border-green-500/40 text-foreground'
                )}
              >
                <CheckCircle2 className="w-5 h-5 mb-1.5 text-green-600 dark:text-green-400" />
                <span>Present · P</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('H')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all select-none cursor-pointer',
                  currentMark === 'H'
                    ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500 shadow-xs'
                    : 'border-border bg-card hover:bg-amber-500/10 hover:border-amber-500/40 text-foreground'
                )}
              >
                <Clock className="w-5 h-5 mb-1.5 text-amber-600 dark:text-amber-400" />
                <span>Half · H</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('A')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all select-none cursor-pointer',
                  currentMark === 'A'
                    ? 'bg-red-100 dark:bg-red-950/70 border-red-500 text-red-800 dark:text-red-200 ring-2 ring-red-500 shadow-xs'
                    : 'border-border bg-card hover:bg-red-500/10 hover:border-red-500/40 text-foreground'
                )}
              >
                <XCircle className="w-5 h-5 mb-1.5 text-red-600 dark:text-red-400" />
                <span>Absent · A</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all select-none cursor-pointer',
                  currentMark === ''
                    ? 'bg-muted border-foreground/30 text-foreground ring-2 ring-foreground/20 shadow-xs'
                    : 'border-border bg-card hover:bg-muted/70 text-muted-foreground'
                )}
              >
                <MinusCircle className="w-5 h-5 mb-1.5 text-muted-foreground" />
                <span>Unmark · —</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-9 text-xs"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
