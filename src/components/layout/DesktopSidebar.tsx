import React from 'react'
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  CircleDollarSign,
  HandCoins,
  Users,
  FileSpreadsheet,
  Receipt,
  Settings,
  Sun,
  Moon,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TabType, StoreProfile } from '@/types/attendance'
import { formatDate } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface DesktopSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  storeProfile: StoreProfile
  fromDate: string
  toDate: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onExportCsv: () => void
  onManualSync: () => void
  isSyncing: boolean
  isSupabaseConnected: boolean
  supabaseLatency: number | null
}

const NAV_ITEMS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'overtime', label: 'Over Duty', icon: Clock },
  { id: 'dailywage', label: 'Daily Wage', icon: CircleDollarSign },
  { id: 'advance', label: 'Advance', icon: HandCoins },
  { id: 'staff', label: 'Staff Roster', icon: Users },
  { id: 'report', label: 'Report Sheet', icon: FileSpreadsheet },
  { id: 'payslip', label: 'Payslip Generator', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  storeProfile,
  fromDate,
  toDate,
  theme,
  onToggleTheme,
  onExportCsv,
  onManualSync,
  isSyncing,
  isSupabaseConnected,
  supabaseLatency
}) => {
  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} to ${formatDate(toDate)}`

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 fixed left-0 top-0 bottom-0 bg-card border-r border-border/80 z-30 shadow-sm select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/70 space-y-3 bg-muted/20">
        <div className="flex items-center gap-3">
          {storeProfile.logo ? (
            <img
              src={storeProfile.logo}
              alt="Logo"
              className="w-10 h-10 object-contain rounded-xl bg-background p-1 border border-border/80 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              {storeProfile.name ? storeProfile.name.charAt(0) : 'H'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-foreground truncate leading-tight">
              {storeProfile.name || 'Hotel Bilal Attendance'}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {storeProfile.outlets && storeProfile.outlets.length > 0
                ? storeProfile.outlets[0]
                : (storeProfile.address || 'Staff Payroll & Attendance')}
            </p>
          </div>
        </div>

        {/* Period Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{periodLabel}</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        <div className="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
          Menu Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-bold scale-[1.01]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform',
                  isActive ? 'text-white' : 'text-muted-foreground'
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Supabase Connection & Live Status Box */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full ring-2',
                isSupabaseConnected
                  ? 'bg-emerald-500 ring-emerald-500/30'
                  : 'bg-amber-500 ring-amber-500/30'
              )}
            />
            <span className="font-bold text-foreground text-[11px]">
              {isSupabaseConnected ? 'Cloud Sync Live' : 'Local Offline Mode'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onManualSync}
            disabled={isSyncing}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title="Force Sync"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin text-emerald-600')} />
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{isSupabaseConnected ? `Keep-Alive Active` : `Automatic Fallback`}</span>
          {supabaseLatency !== null && (
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {supabaseLatency}ms
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer Action Controls */}
      <div className="p-3 border-t border-border/70 space-y-1.5 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="flex-1 h-8 text-xs font-medium border-border/80 bg-background hover:bg-muted justify-center"
            title="Toggle Day/Night Mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>Night Mode</span>
              </>
            )}
          </Button>
        </div>

        <Button
          size="sm"
          onClick={onExportCsv}
          className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Period CSV</span>
        </Button>
      </div>
    </aside>
  )
}
