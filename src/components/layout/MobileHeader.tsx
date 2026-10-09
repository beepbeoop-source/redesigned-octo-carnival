import React, { useState } from 'react'
import {
  Menu,
  Sun,
  Moon,
  Download,
  RefreshCw,
  Calendar,
  LayoutDashboard,
  CalendarCheck,
  Clock,
  CircleDollarSign,
  HandCoins,
  Users,
  FileSpreadsheet,
  Receipt,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import type { TabType, StoreProfile } from '@/types/attendance'
import { formatDate } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
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
  { id: 'payslip', label: 'Payslip', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export const MobileHeader: React.FC<MobileHeaderProps> = ({
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} - ${formatDate(toDate)}`

  const handleSelectTab = (tab: TabType) => {
    onTabChange(tab)
    setIsDrawerOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/80 px-3.5 py-2.5 pt-safe flex items-center justify-between shadow-xs -mx-3 -mt-3 sm:mx-0 sm:mt-0 rounded-b-xl sm:rounded-none">
        {/* Hamburger Trigger */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 w-9 p-0 rounded-xl hover:bg-muted text-foreground"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate leading-tight">
              {storeProfile.name || 'Hotel Bilal Attendance'}
            </h1>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium truncate">
              <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                {activeTab}
              </span>
              <span>•</span>
              <span className="truncate">{periodLabel}</span>
            </div>
          </div>
        </div>

        {/* Quick Top Right Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted/60 text-foreground border border-border/80">
            <span
              className={cn(
                'w-2 h-2 rounded-full ring-2',
                isSupabaseConnected ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-amber-500 ring-amber-500/20'
              )}
            />
            <span className="text-[10px]">{isSupabaseConnected ? 'Live' : 'Local'}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground"
            aria-label="Toggle Day or Night Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-600" />
            )}
          </Button>
        </div>
      </header>

      {/* Navigation Drawer (Sheet) */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="w-[82vw] max-w-[320px] p-0 flex flex-col bg-card border-r border-border">
          {/* Drawer Header with Brand Profile */}
          <SheetHeader className="p-4 border-b border-border/80 text-left bg-muted/30">
            <div className="flex items-center gap-3">
              {storeProfile.logo ? (
                <img
                  src={storeProfile.logo}
                  alt="Store Logo"
                  className="w-10 h-10 object-contain rounded-xl bg-background p-1 border border-border shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  {storeProfile.name ? storeProfile.name.charAt(0) : 'H'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm font-bold text-foreground truncate">
                  {storeProfile.name || 'Hotel Bilal Attendance'}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground truncate">
                  {storeProfile.outlets && storeProfile.outlets.length > 0
                    ? storeProfile.outlets[0]
                    : (storeProfile.address || 'Staff Payroll & Attendance')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{periodLabel}</span>
            </div>
          </SheetHeader>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon
                    className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cloud Sync Status in Drawer */}
          <div className="p-3 mx-3 mb-2 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full ring-2',
                    isSupabaseConnected ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-amber-500 ring-amber-500/20'
                  )}
                />
                <span className="font-bold text-foreground text-[11px]">
                  {isSupabaseConnected ? 'Cloud Sync Live' : 'Offline Mode'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onManualSync}
                disabled={isSyncing}
                className="h-6 w-6 p-0 text-muted-foreground"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin text-emerald-600')} />
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{isSupabaseConnected ? 'Keep-Alive Active' : 'Offline Mode'}</span>
              {supabaseLatency !== null && (
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  {supabaseLatency}ms
                </span>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3 border-t border-border/70 space-y-1.5 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTheme}
              className="w-full h-8 text-xs font-medium border-border/80 bg-background justify-center"
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

            <Button
              size="sm"
              onClick={() => {
                setIsDrawerOpen(false)
                onExportCsv()
              }}
              className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Export Period CSV</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
