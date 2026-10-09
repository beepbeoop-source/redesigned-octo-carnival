import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { formatDate } from '@/lib/attendanceUtils'
import type { TabType } from '@/types/attendance'

interface FilterBarProps {
  activeTab: TabType
  searchQuery: string
  onSearchChange: (value: string) => void
  departmentFilter: string
  onDepartmentChange: (value: string) => void
  departments: string[]
  outletFilter: string
  onOutletChange: (value: string) => void
  outlets: string[]
  markFilter: string
  onMarkFilterChange: (value: string) => void
  dates: string[]
  onReset: () => void
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  outletFilter,
  onOutletChange,
  outlets,
  markFilter,
  onMarkFilterChange,
  dates,
  onReset
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-card border border-border/70 rounded-xl shadow-xs">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employee by name, ID or outlet..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-background border-border/80 focus-visible:ring-emerald-500 text-sm"
        />
      </div>

      {/* Outlet Dropdown Filter (shadcn Select) */}
      {outlets.length > 0 && (
        <div className="w-full sm:w-auto min-w-[150px]">
          <Select
            value={outletFilter || 'ALL'}
            onValueChange={(val) => onOutletChange(val === 'ALL' ? '' : (val as string))}
          >
            <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs font-medium">
              <SelectValue placeholder="All Outlets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Outlets</SelectItem>
              {outlets.map((outletName) => (
                <SelectItem key={outletName} value={outletName}>
                  {outletName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Department Dropdown Filter (shadcn Select) */}
      <div className="w-full sm:w-auto min-w-[150px]">
        <Select
          value={departmentFilter || 'ALL'}
          onValueChange={(val) => onDepartmentChange(val === 'ALL' ? '' : (val as string))}
        >
          <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs font-medium">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Mark Filter (shadcn Select) */}
      {activeTab === 'attendance' && (
        <div className="w-full sm:w-auto min-w-[180px]">
          <Select
            value={markFilter || 'ALL'}
            onValueChange={(val) => onMarkFilterChange(val === 'ALL' ? '' : (val as string))}
          >
            <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs font-medium">
              <SelectValue placeholder="All Status Marks" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="ALL">All Status Marks</SelectItem>
              {dates.map((d) => (
                <React.Fragment key={d}>
                  <SelectItem value={`${d}|P`}>
                    {formatDate(d)} · Present (P)
                  </SelectItem>
                  <SelectItem value={`${d}|H`}>
                    {formatDate(d)} · Half day (H)
                  </SelectItem>
                  <SelectItem value={`${d}|A`}>
                    {formatDate(d)} · Absent (A)
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="h-9 px-3 border-border hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-xs shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
        <span>Reset</span>
      </Button>
    </div>
  )
}
