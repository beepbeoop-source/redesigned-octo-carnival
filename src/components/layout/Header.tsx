import React from 'react'
import {
  Sun,
  Moon,
  Building2,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StoreProfile } from '@/types/attendance'
import { formatDate } from '@/lib/attendanceUtils'
import { cn } from '@/lib/utils'

interface HeaderProps {
  storeProfile: StoreProfile
  fromDate: string
  toDate: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenStoreSettings: () => void
  onOpenSupabaseSettings: () => void
  onExportCsv: () => void
  onManualSync?: () => void
  isSyncing?: boolean
  isSupabaseConnected?: boolean
  supabaseLatency?: number | null
}

export const Header: React.FC<HeaderProps> = ({
  storeProfile,
  fromDate,
  toDate,
  theme,
  onToggleTheme,
  onOpenStoreSettings,
  onOpenSupabaseSettings,
  onExportCsv,
  onManualSync,
  isSyncing = false,
  isSupabaseConnected = false,
  supabaseLatency = null
}) => {
  const periodLabel =
    fromDate === toDate
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} to ${formatDate(toDate)}`

  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 dark:from-emerald-950 dark:via-neutral-900 dark:to-teal-950 text-white p-5 sm:p-7 shadow-lg border border-emerald-700/30">
      {/* Decorative ambient ring */}
      <div className="absolute -right-12 -top-24 w-64 h-64 rounded-full border border-white/10 pointer-events-none shadow-[0_0_0_24px_rgba(255,255,255,0.03),0_0_0_48px_rgba(255,255,255,0.02)]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {storeProfile.logo ? (
              <img
                src={storeProfile.logo}
                alt="Store Logo"
                className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 border border-white/20 shadow-sm"
              />
            ) : null}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {storeProfile.name || 'Staff Attendance & Payroll'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-100/80 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Attendance period: {periodLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1 md:pt-0">
          {/* Supabase Status Button */}
          <button
            type="button"
            onClick={onOpenSupabaseSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm shadow-xs transition-colors cursor-pointer"
            title="Supabase Database Settings & Status"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full ring-2',
                isSupabaseConnected ? 'bg-emerald-400 ring-emerald-400/30' : 'bg-amber-400 ring-amber-400/30'
              )}
            />
            <span>{isSupabaseConnected ? 'Supabase Live' : 'Supabase (Local)'}</span>
            {supabaseLatency !== null && (
              <span className="text-[10px] text-emerald-200 font-mono font-normal">
                {supabaseLatency}ms
              </span>
            )}
          </button>

          {onManualSync && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onManualSync}
              disabled={isSyncing}
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm shadow-sm h-8 px-2"
              title="Sync with Supabase"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin text-emerald-300')} />
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleTheme}
            className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm shadow-sm font-medium"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 mr-1.5 text-amber-300" />
                <span>Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-1.5 text-emerald-200" />
                <span>Night Mode</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenStoreSettings}
            className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm shadow-sm font-medium"
          >
            <Building2 className="w-4 h-4 mr-1.5 text-teal-200" />
            <span>Store Details</span>
          </Button>

          <Button
            size="sm"
            onClick={onExportCsv}
            className="bg-white hover:bg-emerald-50 text-emerald-950 dark:bg-emerald-400 dark:text-neutral-950 font-semibold shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download CSV</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
