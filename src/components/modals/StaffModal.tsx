import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Staff, StaffStatus } from '@/types/attendance'

interface StaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (staffData: Omit<Staff, 'attendance' | 'overtime' | 'advances'>) => void
  editingStaff: Staff | null
  existingOutlets: string[]
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStaff,
  existingOutlets
}) => {
  const [id, setId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [dept, setDept] = useState<string>('')
  const [outlet, setOutlet] = useState<string>('')
  const [designation, setDesignation] = useState<string>('')
  const [status, setStatus] = useState<StaffStatus>('Working')
  const [salaryType, setSalaryType] = useState<'fixed' | 'variable'>('fixed')
  const [wage, setWage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const availableOutlets = Array.from(
    new Set([
      ...(existingOutlets && existingOutlets.length > 0
        ? existingOutlets
        : ['Main Branch']),
      ...(editingStaff?.outlet ? [editingStaff.outlet] : []),
      ...(outlet ? [outlet] : [])
    ])
  ).filter(Boolean)

  useEffect(() => {
    const defaultOutlet =
      existingOutlets && existingOutlets.length > 0
        ? existingOutlets[0]
        : 'Main Branch'

    if (editingStaff) {
      setId(editingStaff.id)
      setName(editingStaff.name)
      setDept(editingStaff.dept)
      setOutlet(editingStaff.outlet || defaultOutlet)
      setDesignation(
        editingStaff.designation && editingStaff.designation !== '-'
          ? editingStaff.designation
          : ''
      )
      setStatus(editingStaff.status)
      setSalaryType(editingStaff.salaryChanges ? 'variable' : 'fixed')
      setWage(String(editingStaff.wage || ''))
    } else {
      setId('')
      setName('')
      setDept('')
      setOutlet(defaultOutlet)
      setDesignation('')
      setStatus('Working')
      setSalaryType('fixed')
      setWage('650')
    }
    setError('')
  }, [editingStaff, isOpen, existingOutlets])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim() || !name.trim()) {
      setError('Employee ID and Name are required.')
      return
    }

    try {
      onSave({
        id: id.trim(),
        name: name.trim(),
        dept: dept.trim() || 'Other',
        outlet: outlet.trim(),
        designation: designation.trim() || '-',
        status,
        wage: wage.trim() || '0',
        salaryChanges: salaryType === 'variable'
      })
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save staff record.')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingStaff ? 'Edit Staff Details' : 'Add New Staff Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-id" className="text-xs">
                Employee ID <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="staff-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                readOnly={!!editingStaff}
                placeholder="e.g. 143"
                className="h-9 bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-status" className="text-xs">
                Status
              </Label>
              <select
                id="staff-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffStatus)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs font-medium"
              >
                <option value="Working">Working</option>
                <option value="Active">Active</option>
                <option value="Left">Left</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-name" className="text-xs">
              Staff Full Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahamed Ali"
              className="h-9 bg-background"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-dept" className="text-xs">
                Department
              </Label>
              <Input
                id="staff-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="e.g. Cashier, Kitchen, Briyani"
                className="h-9 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-outlet" className="text-xs font-semibold">
                Branch / Outlet <span className="text-rose-500">*</span>
              </Label>
              <select
                id="staff-outlet"
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              >
                {availableOutlets.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-designation" className="text-xs">
              Designation / Role Description
            </Label>
            <Input
              id="staff-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Head Chef, Assistant"
              className="h-9 bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-salary-type" className="text-xs">
                Salary Type
              </Label>
              <select
                id="staff-salary-type"
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as 'fixed' | 'variable')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs font-medium"
              >
                <option value="fixed">Fixed daily wage</option>
                <option value="variable">Changes by date</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-wage" className="text-xs">
                Usual Daily Wage (₹)
              </Label>
              <Input
                id="staff-wage"
                type="number"
                min="0"
                step="1"
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                placeholder="650"
                className="h-9 bg-background"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {editingStaff ? 'Save Changes' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
