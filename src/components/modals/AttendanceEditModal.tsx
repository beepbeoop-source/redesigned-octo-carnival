import React, { useState, useEffect } from 'react'
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
import { CheckCircle2, Clock, XCircle, Lock, Unlock } from 'lucide-react'
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
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [selectedMark, setSelectedMark] = useState<AttendanceMark>('')

  useEffect(() => {
    if (staff && date) {
      setSelectedMark(staff.attendance[date] || '')
    }
    setIsEditing(false)
  }, [staff, date, isOpen])

  if (!staff || !date) return null

  const handleSave = () => {
    onSave(staff.id, date, selectedMark)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Edit Past Attendance Record
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee:</span>
              <strong className="text-foreground">{staff.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="font-mono text-foreground">{staff.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Record Date:</span>
              <strong className="text-foreground">{formatDate(date)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {staff.attendance[date] === 'P'
                  ? 'Present (P)'
                  : staff.attendance[date] === 'H'
                  ? 'Half Day (H)'
                  : staff.attendance[date] === 'A'
                  ? 'Absent (A)'
                  : 'Unmarked'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Select New Attendance Mark:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setSelectedMark('P')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all',
                  !isEditing && 'opacity-60 cursor-not-allowed',
                  selectedMark === 'P'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                )}
              >
                <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Present · P</span>
              </button>

              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setSelectedMark('H')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all',
                  !isEditing && 'opacity-60 cursor-not-allowed',
                  selectedMark === 'H'
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                )}
              >
                <Clock className="w-5 h-5 mb-1 text-amber-600" />
                <span>Half Day · H</span>
              </button>

              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setSelectedMark('A')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all',
                  !isEditing && 'opacity-60 cursor-not-allowed',
                  selectedMark === 'A'
                    ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500'
                    : 'border-border bg-card hover:bg-muted/40 text-foreground'
                )}
              >
                <XCircle className="w-5 h-5 mb-1 text-rose-600" />
                <span>Absent · A</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs"
          >
            Cancel
          </Button>

          {!isEditing ? (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              <Unlock className="w-3.5 h-3.5 mr-1.5" />
              <span>Enable Edit</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              <span>Save Changes</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
