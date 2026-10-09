import React from 'react'
import { Clock, Info } from 'lucide-react'
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
import { formatDate } from '@/lib/attendanceUtils'

interface OvertimeTabProps {
  staffList: Staff[]
  entryDate: string
  onEntryDateChange: (date: string) => void
  onUpdateOvertime: (id: string, date: string, amount: string | number) => void
}

export const OvertimeTab: React.FC<OvertimeTabProps> = ({
  staffList,
  entryDate,
  onEntryDateChange,
  onUpdateOvertime
}) => {
  return (
    <div className="space-y-4">
      {/* Date Bar & Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Over Duty / Extra Hours Entry
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter extra duty payout amount for {formatDate(entryDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Entry Date:</label>
          <Input
            type="date"
            value={entryDate}
            onChange={(e) => onEntryDateChange(e.target.value)}
            className="h-9 w-38 bg-background border-border text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Enter extra duty payout amount in ₹ for each employee on {formatDate(entryDate)}.
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
            const ot = staff.overtime[entryDate] || {}
            const amount = ot.amount !== undefined ? ot.amount : ''
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
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {amount ? `₹${amount}` : '₹0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => onUpdateOvertime(staff.id, entryDate, e.target.value)}
                      placeholder="Amount ₹"
                      className="h-8.5 text-xs bg-background"
                    />
                    {[100, 200, 500].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextVal = (Number(amount) || 0) + val
                          onUpdateOvertime(staff.id, entryDate, nextVal)
                        }}
                        className="h-8.5 px-2 text-[11px] font-medium"
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
                <TableHead className="font-semibold text-xs text-right">
                  Over-duty amount for {formatDate(entryDate)} (₹)
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
                  const ot = staff.overtime[entryDate] || {}
                  const amount =
                    ot.amount !== undefined && ot.amount !== ''
                      ? ot.amount
                      : ot.hours && ot.rate
                      ? Number(ot.hours) * Number(ot.rate)
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
                      <TableCell className="text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-muted text-[11px]">
                          {staff.dept}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={amount}
                          onChange={(e) => onUpdateOvertime(staff.id, entryDate, e.target.value)}
                          placeholder="Amount ₹"
                          className="h-8 w-32 ml-auto text-right text-xs bg-background border-border/80 font-medium"
                        />
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
