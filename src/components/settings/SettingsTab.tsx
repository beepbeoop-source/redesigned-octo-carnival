import React, { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cloud,
  Phone,
  MapPin,
  Store,
  Users,
  Edit2,
  Check,
  X,
  Database,
  FileSpreadsheet,
  Activity
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserManagementSection } from './UserManagementSection'
import type { StoreProfile, OutletLogo, Staff, UserProfile } from '@/types/attendance'
import type { SyncResult } from '@/lib/supabaseSync'
import { exportPayrollCsv } from '@/lib/attendanceUtils'
import { uploadImage } from '@/lib/storageUtils'
import { cn } from '@/lib/utils'

type SettingsCategory = 'general' | 'outlets' | 'users' | 'database'

interface SettingsTabProps {
  storeProfile: StoreProfile
  staffList: Staff[]
  currentUserProfile?: UserProfile | null
  isAdmin?: boolean
  onSaveProfile: (profile: StoreProfile) => Promise<SyncResult | void> | void
  onRenameOutlet?: (oldName: string, newName: string) => void
  onManualSync?: () => void
  onPullFromSupabase?: () => void
  fetchUsersList?: () => Promise<UserProfile[]>
  onAdminCreateUser?: (
    username: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>
  onAdminChangePassword?: (
    userId: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>
  onAdminDeleteUser?: (userId: string) => Promise<{ success: boolean; error?: string }>
  onChangeMyPassword?: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  isSyncing?: boolean
  isSupabaseConnected?: boolean
  supabaseLatency?: number | null
}

const CATEGORIES: {
  id: SettingsCategory
  label: string
  description: string
  icon: React.FC<{ className?: string }>
}[] = [
  {
    id: 'general',
    label: 'General & Branding',
    description: 'Name, address, contact & main restaurant logo',
    icon: Store
  },
  {
    id: 'outlets',
    label: 'Outlets & Branches',
    description: 'Manage store locations and outlet-specific logos',
    icon: Building2
  },
  {
    id: 'users',
    label: 'Staff Accounts & Security',
    description: 'Manage staff credentials, reset passwords & access',
    icon: Users
  },
  {
    id: 'database',
    label: 'Cloud Sync & Database',
    description: 'Supabase real-time connection & backup status',
    icon: Cloud
  }
]

export const SettingsTab: React.FC<SettingsTabProps> = ({
  storeProfile,
  staffList,
  currentUserProfile = null,
  isAdmin = false,
  onSaveProfile,
  onRenameOutlet,
  onManualSync,
  onPullFromSupabase,
  fetchUsersList,
  onAdminCreateUser,
  onAdminChangePassword,
  onAdminDeleteUser,
  onChangeMyPassword,
  isSyncing = false,
  isSupabaseConnected = false,
  supabaseLatency = null
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general')
  const [name, setName] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [logo, setLogo] = useState<string>('')
  const [outlets, setOutlets] = useState<string[]>([])
  const [outletLogos, setOutletLogos] = useState<OutletLogo[]>([])
  const [newOutletName, setNewOutletName] = useState<string>('')
  const [editingOutletName, setEditingOutletName] = useState<string | null>(null)
  const [editingOutletValue, setEditingOutletValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    setName(storeProfile.name || '')
    setAddress(storeProfile.address || '')
    setPhone(storeProfile.phone || '')
    setLogo(storeProfile.logo || '')
    setOutlets(
      Array.isArray(storeProfile.outlets) && storeProfile.outlets.length > 0
        ? storeProfile.outlets
        : ['Main Branch']
    )
    setOutletLogos(Array.isArray(storeProfile.outletLogos) ? storeProfile.outletLogos : [])
  }, [storeProfile])

  const handleMainLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsSaving(true)
    try {
      const res = await uploadImage(file, 'store_logo')
      if (res.url) {
        setLogo(res.url)
        setSaveFeedback({ type: 'success', text: 'Store logo uploaded. Click "Save Settings" to apply.' })
      } else if (res.error) {
        setSaveFeedback({ type: 'error', text: res.error })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddOutlet = () => {
    const trimmed = newOutletName.trim()
    if (!trimmed) return
    if (outlets.includes(trimmed)) {
      setNewOutletName('')
      return
    }

    setOutlets((prev) => [...prev, trimmed])
    setNewOutletName('')
  }

  const handleStartEditOutlet = (outletName: string) => {
    setEditingOutletName(outletName)
    setEditingOutletValue(outletName)
  }

  const handleCancelEditOutlet = () => {
    setEditingOutletName(null)
    setEditingOutletValue('')
  }

  const handleSaveEditOutlet = (oldName: string) => {
    const trimmed = editingOutletValue.trim()
    if (!trimmed || trimmed === oldName) {
      handleCancelEditOutlet()
      return
    }

    if (outlets.some((o) => o.toLowerCase() === trimmed.toLowerCase() && o !== oldName)) {
      alert('An outlet with this name already exists.')
      return
    }

    setOutlets((prev) => prev.map((o) => (o === oldName ? trimmed : o)))
    setOutletLogos((prev) =>
      prev.map((l) => (l.name === oldName ? { ...l, name: trimmed } : l))
    )

    if (onRenameOutlet) {
      onRenameOutlet(oldName, trimmed)
    }

    setEditingOutletName(null)
    setEditingOutletValue('')
  }

  const handleRemoveOutlet = (outletToRemove: string) => {
    setOutlets((prev) => {
      const filtered = prev.filter((o) => o !== outletToRemove)
      return filtered.length > 0 ? filtered : ['Main Branch']
    })
    setOutletLogos((prev) => prev.filter((l) => l.name !== outletToRemove))
  }

  const handleOutletLogoUpload = async (
    outletName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsSaving(true)
    try {
      const res = await uploadImage(file, 'outlet_logos')
      if (res.url) {
        setOutletLogos((prev) => {
          const existing = prev.find((l) => l.name === outletName)
          if (existing) {
            return prev.map((l) =>
              l.name === outletName ? { ...l, logo: res.url } : l
            )
          }
          return [...prev, { name: outletName, logo: res.url }]
        })
        setSaveFeedback({ type: 'success', text: `Logo uploaded for ${outletName}. Click "Save Settings" to apply.` })
      } else if (res.error) {
        setSaveFeedback({ type: 'error', text: res.error })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveOutletLogo = (outletName: string) => {
    setOutletLogos((prev) => prev.filter((l) => l.name !== outletName))
  }

  const handleSaveAll = async () => {
    const updated: StoreProfile = {
      name: name.trim() || 'Hotel Bilal & Restaurant',
      address: address.trim(),
      phone: phone.trim(),
      outlets: outlets,
      logo,
      outletLogos: outletLogos.filter((l) => l.name.trim() && l.logo)
    }

    setIsSaving(true)
    setSaveFeedback(null)

    try {
      const res = await onSaveProfile(updated)
      if (res && typeof res === 'object' && 'success' in res && !res.success) {
        setSaveFeedback({
          type: 'error',
          text: res.message || 'Failed to sync with Supabase'
        })
      } else {
        setSaveFeedback({
          type: 'success',
          text: isSupabaseConnected
            ? 'Settings saved & synced to Supabase!'
            : 'Settings saved locally!'
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings'
      setSaveFeedback({ type: 'error', text: msg })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveFeedback(null), 4000)
    }
  }

  // Count staff assigned to each outlet
  const getOutletStaffCount = (outletName: string) => {
    return staffList.filter((s) => s.outlet === outletName).length
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Bar with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Restaurant & App Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure restaurant branding, branches, staff login accounts, and cloud backup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold animate-fade-in border',
                saveFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              )}
            >
              {saveFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{saveFeedback.text}</span>
            </div>
          )}

          {(activeCategory === 'general' || activeCategory === 'outlets') && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9 px-4"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'p-3 rounded-2xl border text-left transition-all duration-150 flex flex-col gap-1.5 cursor-pointer',
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-card hover:bg-muted/50 border-border/80 text-foreground'
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {cat.id === 'outlets' && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {outlets.length}
                  </span>
                )}
                {cat.id === 'database' && (
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full ring-2',
                      isSupabaseConnected
                        ? isActive
                          ? 'bg-emerald-200 ring-white/40'
                          : 'bg-emerald-500 ring-emerald-500/20'
                        : isActive
                        ? 'bg-amber-300 ring-white/40'
                        : 'bg-amber-500 ring-amber-500/20'
                    )}
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{cat.label}</p>
                <p
                  className={cn(
                    'text-[10px] line-clamp-1 mt-0.5',
                    isActive ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {cat.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* CATEGORY 1: GENERAL & BRANDING */}
      {activeCategory === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Logo Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Restaurant Main Logo</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Appears on top banners, reports, and printed payslips
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border bg-muted/20 text-center relative group">
                  {logo ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <img
                        src={logo}
                        alt="Store Logo Preview"
                        className="w-24 h-24 object-contain rounded-xl bg-background p-2 border border-border shadow-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogo('')}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <label
                          htmlFor="main-logo-input"
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Upload an image
                        </label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          PNG, JPG or SVG (Max 2MB)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="main-logo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleMainLogoUpload}
                    className="hidden"
                  />
                </div>

                {!logo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('main-logo-input')?.click()}
                    className="w-full h-8 text-xs font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Select Logo File
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restaurant Details Card */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Company & Business Information</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Basic business details printed on payslips and monthly summaries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="store-name" className="text-xs font-semibold">
                    Restaurant / Business Name
                  </Label>
                  <Input
                    id="store-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hotel Bilal & Restaurant"
                    className="h-9 bg-background text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-phone" className="text-xs font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Contact Phone Number</span>
                    </Label>
                    <Input
                      id="store-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="store-address" className="text-xs font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Business Address / Location</span>
                    </Label>
                    <Input
                      id="store-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Main Road, Triplicane, Chennai"
                      className="h-9 bg-background text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Changes will be applied to generated payslips and headers.</span>
                  <Button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CATEGORY 2: OUTLETS & BRANCHES */}
      {activeCategory === 'outlets' && (
        <div className="space-y-4 animate-fade-in">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Outlets & Branches Management</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add branches, rename outlets, and assign custom outlet logos for payslips
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground w-fit">
                  {outlets.length} {outlets.length === 1 ? 'Outlet' : 'Outlets'} Active
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Outlet Input Box */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border/80 rounded-xl">
                <Input
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOutlet()
                    }
                  }}
                  placeholder="Enter new outlet name (e.g. Highway Branch, Express Counter)"
                  className="h-9 bg-background text-sm flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddOutlet}
                  disabled={!newOutletName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3 shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Add Outlet</span>
                </Button>
              </div>

              {/* Outlets List */}
              <div className="space-y-3 pt-1">
                {outlets.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    No outlets configured. Add your first outlet above.
                  </div>
                ) : (
                  outlets.map((outletName) => {
                    const assignedStaffCount = getOutletStaffCount(outletName)
                    const outletLogoObj = outletLogos.find((l) => l.name === outletName)
                    const inputId = `outlet-logo-${outletName.replace(/\s+/g, '-')}`

                    return (
                      <div
                        key={outletName}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:border-emerald-500/30 transition-all"
                      >
                        {/* Outlet Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {outletLogoObj?.logo ? (
                            <img
                              src={outletLogoObj.logo}
                              alt={outletName}
                              className="w-10 h-10 object-contain rounded-lg bg-muted/40 p-1 border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
                              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            {editingOutletName === outletName ? (
                              <div className="flex items-center gap-1.5 py-0.5">
                                <Input
                                  value={editingOutletValue}
                                  onChange={(e) => setEditingOutletValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleSaveEditOutlet(outletName)
                                    } else if (e.key === 'Escape') {
                                      handleCancelEditOutlet()
                                    }
                                  }}
                                  autoFocus
                                  className="h-8 text-xs bg-background max-w-[240px]"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveEditOutlet(outletName)}
                                  className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Save Name"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditOutlet}
                                  className="h-8 w-8 p-0 text-muted-foreground"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground truncate">
                                  {outletName}
                                </h3>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEditOutlet(outletName)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  title="Edit Outlet Name"
                                >
                                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {assignedStaffCount}{' '}
                                {assignedStaffCount === 1 ? 'employee' : 'employees'} assigned
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Outlet Actions: Logo upload & Delete */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <input
                            id={inputId}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOutletLogoUpload(outletName, e)}
                            className="hidden"
                          />

                          {outletLogoObj?.logo ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveOutletLogo(outletName)}
                              className="h-8 text-xs text-muted-foreground hover:text-rose-600"
                              title="Remove Outlet Logo"
                            >
                              Remove Logo
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(inputId)?.click()}
                              className="h-8 text-xs font-medium"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              <span>Upload Logo</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOutlet(outletName)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Remove Outlet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CATEGORY 3: USERS & ACCESS CONTROL */}
      {activeCategory === 'users' && fetchUsersList && onAdminCreateUser && onAdminChangePassword && onAdminDeleteUser && onChangeMyPassword && (
        <div className="animate-fade-in">
          <UserManagementSection
            currentUserProfile={currentUserProfile}
            isAdmin={isAdmin}
            fetchUsersList={fetchUsersList}
            onAdminCreateUser={onAdminCreateUser}
            onAdminChangePassword={onAdminChangePassword}
            onAdminDeleteUser={onAdminDeleteUser}
            onChangeMyPassword={onChangeMyPassword}
          />
        </div>
      )}

      {/* CATEGORY 4: CLOUD DATABASE & BACKUP */}
      {activeCategory === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Cloud Sync Status */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Real-Time Cloud Database</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Live multi-device database connection and latency status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'w-3 h-3 rounded-full ring-4',
                      isSupabaseConnected
                        ? 'bg-emerald-500 ring-emerald-500/20'
                        : 'bg-amber-500 ring-amber-500/20'
                    )}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {isSupabaseConnected ? 'Connected & Live Sync Active' : 'Offline Mode (Local Storage)'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isSupabaseConnected
                        ? 'Changes are automatically backed up to Supabase'
                        : 'Running on local browser cache'}
                    </p>
                  </div>
                </div>

                {supabaseLatency !== null && (
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {supabaseLatency}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {onManualSync && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="flex-1 h-9 text-xs font-semibold"
                  >
                    <RefreshCw
                      className={cn(
                        'w-3.5 h-3.5 mr-1.5',
                        isSyncing && 'animate-spin text-emerald-600'
                      )}
                    />
                    <span>Force Push to Cloud</span>
                  </Button>
                )}

                {onPullFromSupabase && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onPullFromSupabase}
                    disabled={isSyncing}
                    className="flex-1 h-9 text-xs font-semibold"
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                    <span>Pull from Cloud</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backup & Keep-Alive Monitoring */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Keep-Alive Heartbeat & Data Export</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Export period records or verify automatic keep-alive pings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/80 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">Database Ping Frequency:</span>
                  <span className="font-bold text-foreground">Every 4 minutes</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-muted-foreground">Pause Inactivity Prevention:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Enabled</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const dates = [new Date().toISOString().split('T')[0]]
                  exportPayrollCsv(staffList, dates)
                }}
                className="w-full h-9 text-xs font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>Export Master Payroll Backup (CSV)</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SettingsTab
