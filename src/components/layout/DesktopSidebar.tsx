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
  LogOut,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TabType, StoreProfile, UserProfile } from '@/types/attendance'
import { cn } from '@/lib/utils'

interface DesktopSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  storeProfile: StoreProfile
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onExportCsv: () => void
  currentUserProfile?: UserProfile | null
  onOpenChangePassword?: () => void
  onLogout?: () => void
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
  theme,
  onToggleTheme,
  onExportCsv,
  currentUserProfile,
  onOpenChangePassword,
  onLogout
}) => {
  const isAdmin = currentUserProfile?.role === 'admin'

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-30 shadow-sm select-none">
      {/* Brand Header & Top Actions */}
      <div className="p-4 border-b border-sidebar-border space-y-2.5 bg-sidebar/50">
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

        {/* Top Action Buttons: Theme Toggle & Export CSV */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="h-8 text-xs font-medium border-border/80 bg-background hover:bg-muted justify-center"
            title="Toggle Day/Night Mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 mr-1 text-amber-400" />
                <span>Day</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Night</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={onExportCsv}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs px-2"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="truncate">CSV Export</span>
          </Button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
        <div className="px-3 pb-1.5 text-[10px] font-extrabold tracking-wider text-muted-foreground uppercase">
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

      {/* Current Logged-in User Profile Pill (Bottom of sidebar) */}
      {currentUserProfile && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-muted/30 border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                isAdmin
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              )}
            >
              {currentUserProfile.displayName
                ? currentUserProfile.displayName.charAt(0).toUpperCase()
                : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate leading-none">
                {currentUserProfile.displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                    isAdmin
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-2.5 h-2.5" />
                  ) : (
                    <UserCheck className="w-2.5 h-2.5" />
                  )}
                  <span>{currentUserProfile.role}</span>
                </span>
                <span className="text-[10px] text-muted-foreground truncate font-mono">
                  @{currentUserProfile.username}
                </span>
              </div>
            </div>
          </div>

          {/* Quick User Actions */}
          <div className="flex items-center gap-1 pt-1 border-t border-border/50">
            {onOpenChangePassword && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenChangePassword}
                className="flex-1 h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground justify-start"
                title="Change Password"
              >
                <KeyRound className="w-3 h-3 mr-1 text-muted-foreground" />
                <span className="truncate">Password</span>
              </Button>
            )}

            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Log Out"
              >
                <LogOut className="w-3 h-3 mr-1" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
