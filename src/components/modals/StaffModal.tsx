import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
      setWage('')
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
        outlet: outlet.trim() || 'Main Branch',
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
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as StaffStatus)}
              >
                <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={outlet || availableOutlets[0] || 'Main Branch'}
                onValueChange={(val) => setOutlet(val as string)}
              >
                <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableOutlets.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select
                value={salaryType}
                onValueChange={(val) => setSalaryType(val as 'fixed' | 'variable')}
              >
                <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs">
                  <SelectValue placeholder="Salary Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed daily wage</SelectItem>
                  <SelectItem value="variable">Changes by date</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="Leave empty or enter wage"
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
