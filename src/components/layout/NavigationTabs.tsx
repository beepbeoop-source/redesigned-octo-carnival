import React from 'react'
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  CircleDollarSign,
  HandCoins,
  Users,
  FileSpreadsheet,
  Receipt
} from 'lucide-react'
import type { TabType } from '@/types/attendance'
import { cn } from '@/lib/utils'

interface NavigationTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'overtime', label: 'Over Duty', icon: Clock },
  { id: 'dailywage', label: 'Daily Wage', icon: CircleDollarSign },
  { id: 'advance', label: 'Advance', icon: HandCoins },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'report', label: 'Report', icon: FileSpreadsheet },
  { id: 'payslip', label: 'Payslip', icon: Receipt }
]

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* Desktop / Tablet Horizontal or Top Bar Tabs */}
      <nav aria-label="Main Navigation" className="w-full">
        <div className="flex items-center gap-1.5 p-1.5 bg-muted/60 dark:bg-card border border-border/80 rounded-2xl backdrop-blur-md overflow-x-auto scrollbar-none shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none',
                  isActive
                    ? 'bg-background text-emerald-700 dark:text-emerald-400 shadow-sm border border-border/70 scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar for Touch Screens & Native App */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around overflow-x-auto scrollbar-none gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-lg transition-all text-[10px] font-medium',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 mb-0.5', isActive && 'stroke-[2.5]')} />
                <span className="truncate max-w-[64px]">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
