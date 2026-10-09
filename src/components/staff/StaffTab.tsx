import React from 'react'
import { UserPlus, Edit3, Trash2, Users, SlidersHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface StaffTabProps {
  staffList: Staff[]
  onOpenAddStaff: () => void
  onOpenEditStaff: (staff: Staff) => void
  onDeleteStaff: (id: string) => void
  onOpenStaffActionSheet?: (staff: Staff) => void
}

export const StaffTab: React.FC<StaffTabProps> = ({
  staffList,
  onOpenAddStaff,
  onOpenEditStaff,
  onDeleteStaff,
  onOpenStaffActionSheet
}) => {
  return (
    <div className="space-y-4">
      {/* Header bar with Add Staff Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Staff Directory & Roster</h2>
            <p className="text-xs text-muted-foreground">
              Manage employee designations, assigned outlets, status and wage profiles
            </p>
          </div>
        </div>

        <Button
          onClick={onOpenAddStaff}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* 1. Mobile Cards View (Hidden on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
        {staffList.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
            No staff records found.
          </div>
        ) : (
          staffList.map((staff) => (
            <Card
              key={staff.id}
              className="border-border/80 shadow-xs bg-card hover:border-emerald-500/40 transition-all"
            >
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground">{staff.name}</h3>
                      <span className="text-xs font-mono text-muted-foreground">
                        #{staff.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {staff.dept} • {staff.designation && staff.designation !== '-' ? staff.designation : 'Staff'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      staff.status === 'Working'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : staff.status === 'Active'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {staff.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">
                    Wage: <strong>{staff.wage && Number(staff.wage) > 0 ? formatCurrency(Number(staff.wage)) : '—'}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEditStaff(staff)}
                      className="h-7 text-xs px-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Edit</span>
                    </Button>
                    {onOpenStaffActionSheet && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenStaffActionSheet(staff)}
                        className="h-7 w-7 p-0"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 2. Desktop Table View (Hidden on Mobile) */}
      <Card className="border-border/80 shadow-sm overflow-hidden hidden md:block">
        <CardHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between bg-muted/20">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Total Staff Records: {staffList.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs w-[100px]">Employee ID</TableHead>
                  <TableHead className="font-semibold text-xs">Name</TableHead>
                  <TableHead className="font-semibold text-xs">Outlet</TableHead>
                  <TableHead className="font-semibold text-xs">Department</TableHead>
                  <TableHead className="font-semibold text-xs">Designation</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Salary Type</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Usual Daily Wage</TableHead>
                  <TableHead className="font-semibold text-xs text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No staff members registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffList.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {staff.id}
                      </TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm text-foreground">
                        {staff.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staff.outlet || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-muted text-[11px] font-medium">
                          {staff.dept}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staff.designation || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                            staff.status === 'Working' && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
                            staff.status === 'Active' && 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
                            staff.status === 'Left' && 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {staff.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staff.salaryChanges ? 'Changes by date' : 'Fixed daily'}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-semibold">
                        {staff.wage && Number(staff.wage) > 0 ? formatCurrency(Number(staff.wage)) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenEditStaff(staff)}
                            className="h-7.5 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${staff.name}?`)) {
                                onDeleteStaff(staff.id)
                              }
                            }}
                            className="h-7.5 w-7.5 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
