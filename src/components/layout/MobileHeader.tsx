import React, { useState } from 'react'
import {
  Menu,
  Sun,
  Moon,
  Download,
  LayoutDashboard,
  CalendarCheck,
  Clock,
  CircleDollarSign,
  HandCoins,
  Users,
  FileSpreadsheet,
  Receipt,
  Settings,
  LogOut,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import type { TabType, StoreProfile, UserProfile } from '@/types/attendance'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  storeProfile: StoreProfile
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onExportCsv: () => void
  isSupabaseConnected: boolean
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
  { id: 'payslip', label: 'Payslip', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onTabChange,
  storeProfile,
  theme,
  onToggleTheme,
  onExportCsv,
  isSupabaseConnected,
  currentUserProfile,
  onOpenChangePassword,
  onLogout
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleSelectTab = (tab: TabType) => {
    onTabChange(tab)
    setIsDrawerOpen(false)
  }

  const isAdmin = currentUserProfile?.role === 'admin'

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/80 px-3 py-2 pt-[max(0.625rem,env(safe-area-inset-top))] flex items-center justify-between shadow-xs">
        {/* Hamburger Trigger & Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 w-9 p-0 rounded-xl hover:bg-muted text-foreground shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-foreground truncate leading-tight">
              {storeProfile.name || 'Hotel Bilal Attendance'}
            </h1>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium truncate">
              <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                {activeTab}
              </span>
              <span>•</span>
              <span className="truncate">
                {storeProfile.outlets && storeProfile.outlets.length > 0
                  ? storeProfile.outlets[0]
                  : (storeProfile.address || 'Payroll & Attendance')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Top Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentUserProfile && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider hidden xs:inline-flex items-center gap-0.5',
                isAdmin
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              )}
            >
              {isAdmin ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
              <span>{currentUserProfile.role}</span>
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold bg-muted/60 text-foreground border border-border/80">
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
        <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 flex flex-col bg-card border-r border-border pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Drawer Header with Brand Profile & Top Actions */}
          <SheetHeader className="p-3.5 border-b border-border/80 text-left bg-muted/30 space-y-2.5">
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

            {/* Top Action Buttons: Theme Toggle & Export CSV */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
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
                onClick={() => {
                  setIsDrawerOpen(false)
                  onExportCsv()
                }}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs px-2"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span className="truncate">CSV Export</span>
              </Button>
            </div>
          </SheetHeader>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Menu Navigation
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

          {/* Drawer Footer with Current User Profile Pill */}
          {currentUserProfile && (
            <div className="p-3 border-t border-border/70 bg-muted/20 space-y-2">
              <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0',
                      isAdmin
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    {currentUserProfile.displayName
                      ? currentUserProfile.displayName.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {currentUserProfile.displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate font-mono">
                      @{currentUserProfile.username}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0',
                    isAdmin
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {currentUserProfile.role}
                </span>
              </div>

              {/* User Account Controls */}
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenChangePassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDrawerOpen(false)
                      onOpenChangePassword()
                    }}
                    className="h-8 text-xs font-medium border-border/80 bg-background"
                  >
                    <KeyRound className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    <span>Password</span>
                  </Button>
                )}

                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDrawerOpen(false)
                      onLogout()
                    }}
                    className="h-8 text-xs font-medium border-border/80 bg-background text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    <span>Logout</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
