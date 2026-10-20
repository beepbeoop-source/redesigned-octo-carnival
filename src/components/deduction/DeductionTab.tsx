import React from 'react'
import { Scissors, Info, ShieldAlert, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { Staff } from '@/types/attendance'
import { formatDate, localToday } from '@/lib/attendanceUtils'
import { DatePicker } from '@/components/ui/date-picker'
import { UnsavedChangesBanner } from '@/components/layout/UnsavedChangesBanner'

interface DeductionTabProps {
  staffList: Staff[]
  entryDate: string
  isAdmin?: boolean
  onEntryDateChange: (date: string) => void
  onUpdateDeduction: (id: string, date: string, amount: string | number) => void
  pendingChangesCount?: number
  isSavingPending?: boolean
  onSavePendingChanges?: () => Promise<void>
  onDiscardPendingChanges?: () => void
}

export const DeductionTab: React.FC<DeductionTabProps> = ({
  staffList,
  entryDate,
  isAdmin = false,
  onEntryDateChange,
  onUpdateDeduction,
  pendingChangesCount = 0,
  isSavingPending = false,
  onSavePendingChanges,
  onDiscardPendingChanges
}) => {
  return (
    <div className="space-y-4">
      {/* Date Bar & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Salary Deductions Entry
              </h2>
              {isAdmin ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Admin Authorized
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> View Only
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Allocate and manage staff wage deductions for {formatDate(entryDate)}
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

      {/* Info / Notice Banner */}
      {isAdmin ? (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-900 dark:text-red-200">
          <Info className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>
            Admin allocation: Enter deduction amounts in ₹ for each employee on {formatDate(entryDate)}. Deductions directly reduce net payable salary.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            View-only access: Only system administrators have authorization to allocate or edit salary deductions.
          </span>
        </div>
      )}

      {/* 1. Mobile Cards View (Hidden on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {staffList.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
            No staff records found.
          </div>
        ) : (
          staffList.map((staff) => {
            const deductionVal = staff.deductions?.[entryDate] !== undefined ? staff.deductions[entryDate] : ''
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
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {deductionVal ? `₹${deductionVal}` : '₹0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      disabled={!isAdmin}
                      value={deductionVal}
                      onChange={(e) => onUpdateDeduction(staff.id, entryDate, e.target.value)}
                      placeholder="Deduction ₹"
                      className="h-8.5 text-xs bg-background text-red-600 dark:text-red-400 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {isAdmin &&
                      [100, 200, 500].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const nextVal = (Number(deductionVal) || 0) + val
                            onUpdateDeduction(staff.id, entryDate, nextVal)
                          }}
                          className="h-8.5 px-2 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          +{val}
                        </Button>
                      ))}
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
                <TableHead className="font-semibold text-xs">Department</TableHead>
                <TableHead className="font-semibold text-xs text-left">
                  Deduction amount for {formatDate(entryDate)} (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No staff records found.
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map((staff) => {
                  const deductionVal =
                    staff.deductions?.[entryDate] !== undefined ? staff.deductions[entryDate] : ''

                  return (
                    <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="font-semibold text-foreground">{staff.name}</div>
                        <div className="text-[11px] text-muted-foreground">ID: {staff.id}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staff.outlet || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-muted text-[11px]">
                          {staff.dept}
                        </span>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            disabled={!isAdmin}
                            value={deductionVal}
                            onChange={(e) => onUpdateDeduction(staff.id, entryDate, e.target.value)}
                            placeholder="Deduction ₹"
                            className="h-8 w-32 text-left text-xs bg-background border-border/80 font-medium text-red-600 dark:text-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {isAdmin &&
                            [100, 200, 500].map((val) => (
                              <Button
                                key={val}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nextVal = (Number(deductionVal) || 0) + val
                                  onUpdateDeduction(staff.id, entryDate, nextVal)
                                }}
                                className="h-8 px-2 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                +{val}
                              </Button>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Floating Unsaved Changes Popup */}
      {isAdmin && (
        <UnsavedChangesBanner
          count={pendingChangesCount}
          isSaving={isSavingPending}
          onSave={onSavePendingChanges}
          onDiscard={onDiscardPendingChanges}
        />
      )}
    </div>
  )
}
