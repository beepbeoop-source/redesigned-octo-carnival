import React from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
          className="pl-9 h-9.5 bg-background border-border/80 focus-visible:ring-emerald-500 text-sm"
        />
      </div>

      {/* Outlet Dropdown Filter */}
      {outlets.length > 0 && (
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <select
            aria-label="Filter by branch or outlet"
            value={outletFilter}
            onChange={(e) => onOutletChange(e.target.value)}
            className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-foreground cursor-pointer"
          >
            <option value="">All Outlets</option>
            {outlets.map((outletName) => (
              <option key={outletName} value={outletName}>
                {outletName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Department Dropdown Filter */}
      <div className="flex items-center gap-1.5 min-w-[140px]">
        <select
          aria-label="Filter by department"
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-foreground cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Mark on Specific Date Filter */}
      {activeTab === 'attendance' && (
        <div className="flex items-center gap-1.5 min-w-[170px]">
          <select
            aria-label="Filter by attendance mark"
            value={markFilter}
            onChange={(e) => onMarkFilterChange(e.target.value)}
            className="h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-foreground cursor-pointer"
          >
            <option value="">All Status Marks</option>
            {dates.map((d) => (
              <React.Fragment key={d}>
                <option value={`${d}|P`}>{formatDate(d)} · Present (P)</option>
                <option value={`${d}|H`}>{formatDate(d)} · Half day (H)</option>
                <option value={`${d}|A`}>{formatDate(d)} · Absent (A)</option>
              </React.Fragment>
            ))}
          </select>
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="h-9.5 px-3 border-border hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
        <span>Reset</span>
      </Button>
    </div>
  )
}
