import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft
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
import type { StoreProfile, OutletLogo, Staff, UserProfile, UserRole } from '@/types/attendance'
import type { SyncResult } from '@/lib/supabaseSync'
import { exportPayrollCsv } from '@/lib/attendanceUtils'
import { uploadImage } from '@/lib/storageUtils'
import { cn } from '@/lib/utils'
import { App as CapApp } from '@capacitor/app'

export type SettingsCategory = 'branding' | 'outlets' | 'users' | 'sync'

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
    name: string,
    role?: UserRole,
    outlet?: string
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
}[] = [
  {
    id: 'branding',
    label: 'Branding',
    description: 'Logo, restaurant name & contact details'
  },
  {
    id: 'outlets',
    label: 'Outlets',
    description: 'Branches, outlet logos & employee counts'
  },
  {
    id: 'users',
    label: 'Users',
    description: 'App login credentials, roles & permissions'
  },
  {
    id: 'sync',
    label: 'Sync',
    description: 'Supabase cloud database & master backup'
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
  // Desktop Active Category
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('branding')

  // Mobile Active Subpage (null means showing Mobile Hub)
  const [mobileSubpage, setMobileSubpage] = useState<SettingsCategory | null>(null)

  // Local Form States
  const [name, setName] = useState<string>(storeProfile.name || '')
  const [address, setAddress] = useState<string>(storeProfile.address || '')
  const [phone, setPhone] = useState<string>(storeProfile.phone || '')
  const [logo, setLogo] = useState<string>(storeProfile.logo || '')
  const [outlets, setOutlets] = useState<string[]>(
    Array.isArray(storeProfile.outlets) && storeProfile.outlets.length > 0
      ? storeProfile.outlets
      : ['Main Branch']
  )
  const [outletLogos, setOutletLogos] = useState<OutletLogo[]>(
    Array.isArray(storeProfile.outletLogos) ? storeProfile.outletLogos : []
  )

  const [newOutletName, setNewOutletName] = useState<string>('')
  const [editingOutletName, setEditingOutletName] = useState<string | null>(null)
  const [editingOutletValue, setEditingOutletValue] = useState<string>('')

  // Auto-Save Status States
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync state with incoming storeProfile props
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

  // Capacitor Android Hardware Back Button Integration
  useEffect(() => {
    let backListenerHandle: { remove: () => void } | null = null

    const registerBackHandler = async () => {
      try {
        backListenerHandle = await CapApp.addListener('backButton', () => {
          if (mobileSubpage) {
            setMobileSubpage(null)
          }
        })
      } catch {
        // Fallback for non-Capacitor environments
      }
    }

    if (mobileSubpage) {
      registerBackHandler()
    }

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove()
      }
    }
  }, [mobileSubpage])

  // Central Auto-Save Handler
  const triggerAutoSave = useCallback(
    async (updatedProfile: StoreProfile) => {
      setSaveStatus('saving')
      try {
        const res = await onSaveProfile(updatedProfile)
        if (res && typeof res === 'object' && 'success' in res && !res.success) {
          setSaveStatus('error')
          setStatusMessage(res.message || 'Auto-save failed')
        } else {
          setSaveStatus('saved')
          setStatusMessage(isSupabaseConnected ? 'Synced to cloud' : 'Saved locally')
        }
      } catch (err: unknown) {
        setSaveStatus('error')
        setStatusMessage(err instanceof Error ? err.message : 'Failed to save')
      } finally {
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
        }, 3000)
      }
    },
    [onSaveProfile, isSupabaseConnected]
  )

  // Debounced Auto-Save for Text Input Fields (name, phone, address)
  const handleFieldChange = (field: 'name' | 'phone' | 'address', value: string) => {
    if (field === 'name') setName(value)
    if (field === 'phone') setPhone(value)
    if (field === 'address') setAddress(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setSaveStatus('saving')

    debounceTimerRef.current = setTimeout(() => {
      const updated: StoreProfile = {
        name: (field === 'name' ? value : name).trim() || 'Hotel Bilal & Restaurant',
        address: (field === 'address' ? value : address).trim(),
        phone: (field === 'phone' ? value : phone).trim(),
        outlets,
        logo,
        outletLogos: outletLogos.filter((l) => l.name.trim() && l.logo)
      }
      triggerAutoSave(updated)
    }, 500)
  }

  // Instant Auto-Save for Direct Actions (Logos, Outlets)
  const saveImmediate = (partial: Partial<StoreProfile>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const updated: StoreProfile = {
      name: (partial.name ?? name).trim() || 'Hotel Bilal & Restaurant',
      address: (partial.address ?? address).trim(),
      phone: (partial.phone ?? phone).trim(),
      outlets: partial.outlets ?? outlets,
      logo: partial.logo ?? logo,
      outletLogos: (partial.outletLogos ?? outletLogos).filter((l) => l.name.trim() && l.logo)
    }

    triggerAutoSave(updated)
  }

  // Logo Upload Handler
  const handleMainLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaveStatus('saving')
    try {
      const res = await uploadImage(file, 'store_logo')
      if (res.url) {
        setLogo(res.url)
        saveImmediate({ logo: res.url })
      } else if (res.error) {
        setSaveStatus('error')
        setStatusMessage(res.error)
      }
    } catch {
      setSaveStatus('error')
      setStatusMessage('Failed to upload logo image')
    }
  }

  const handleRemoveMainLogo = () => {
    setLogo('')
    saveImmediate({ logo: '' })
  }

  // Outlet Management Handlers
  const handleAddOutlet = () => {
    const trimmed = newOutletName.trim()
    if (!trimmed) return
    if (outlets.includes(trimmed)) {
      setNewOutletName('')
      return
    }

    const updatedOutlets = [...outlets, trimmed]
    setOutlets(updatedOutlets)
    setNewOutletName('')
    saveImmediate({ outlets: updatedOutlets })
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

    const updatedOutlets = outlets.map((o) => (o === oldName ? trimmed : o))
    const updatedLogos = outletLogos.map((l) => (l.name === oldName ? { ...l, name: trimmed } : l))

    setOutlets(updatedOutlets)
    setOutletLogos(updatedLogos)

    if (onRenameOutlet) {
      onRenameOutlet(oldName, trimmed)
    }

    saveImmediate({ outlets: updatedOutlets, outletLogos: updatedLogos })
    setEditingOutletName(null)
    setEditingOutletValue('')
  }

  const handleRemoveOutlet = (outletToRemove: string) => {
    if (outlets.length <= 1) {
      alert('You must have at least one active branch.')
      return
    }

    const updatedOutlets = outlets.filter((o) => o !== outletToRemove)
    const updatedLogos = outletLogos.filter((l) => l.name !== outletToRemove)

    setOutlets(updatedOutlets)
    setOutletLogos(updatedLogos)
    saveImmediate({ outlets: updatedOutlets, outletLogos: updatedLogos })
  }

  const handleOutletLogoUpload = async (
    outletName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaveStatus('saving')
    try {
      const res = await uploadImage(file, 'outlet_logos')
      if (res.url) {
        let updatedLogos: OutletLogo[]
        const existing = outletLogos.find((l) => l.name === outletName)
        if (existing) {
          updatedLogos = outletLogos.map((l) =>
            l.name === outletName ? { ...l, logo: res.url } : l
          )
        } else {
          updatedLogos = [...outletLogos, { name: outletName, logo: res.url }]
        }
        setOutletLogos(updatedLogos)
        saveImmediate({ outletLogos: updatedLogos })
      } else if (res.error) {
        setSaveStatus('error')
        setStatusMessage(res.error)
      }
    } catch {
      setSaveStatus('error')
      setStatusMessage('Logo upload failed')
    }
  }

  const handleRemoveOutletLogo = (outletName: string) => {
    const updatedLogos = outletLogos.filter((l) => l.name !== outletName)
    setOutletLogos(updatedLogos)
    saveImmediate({ outletLogos: updatedLogos })
  }

  const getOutletStaffCount = (outletName: string) => {
    return staffList.filter((s) => s.outlet === outletName).length
  }

  // Live Auto-Save Status Pill Component
  const AutoSaveStatusBadge = () => (
    <div className="flex items-center gap-1.5 text-xs font-semibold">
      {saveStatus === 'saving' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[11px] font-mono">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] animate-fade-in font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{statusMessage || 'Saved'}</span>
        </span>
      )}
      {saveStatus === 'error' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[11px] font-medium">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>{statusMessage || 'Save error'}</span>
        </span>
      )}
    </div>
  )

  // Subpage Contents
  const renderSubpageContent = (category: SettingsCategory) => {
    switch (category) {
      case 'branding':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
            {/* Main Logo Card */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Restaurant Logo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Theme accent color is dynamically picked from this logo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center relative">
                    {logo ? (
                      <div className="space-y-3 flex flex-col items-center">
                        <img
                          src={logo}
                          alt="Store Logo Preview"
                          className="w-24 h-24 object-contain rounded-xl bg-background p-2 border border-border shadow-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveMainLogo}
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Remove Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 py-3 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <label
                            htmlFor="main-logo-input"
                            className="font-semibold text-foreground hover:underline cursor-pointer"
                          >
                            Upload an image
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            PNG, JPG or SVG
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
                  <CardTitle className="text-sm font-semibold">
                    Business Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Information displayed on monthly payslips and headers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name" className="text-xs font-medium">
                      Restaurant / Business Name
                    </Label>
                    <Input
                      id="store-name"
                      value={name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="e.g. Hotel Bilal & Restaurant"
                      className="h-9 bg-background text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="store-phone" className="text-xs font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        id="store-phone"
                        value={phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-9 bg-background text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="store-address" className="text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Address</span>
                      </Label>
                      <Input
                        id="store-address"
                        value={address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="e.g. Main Road, Triplicane, Chennai"
                        className="h-9 bg-background text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">Changes auto-save in real-time.</span>
                    <AutoSaveStatusBadge />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'outlets':
        return (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Outlets & Branches
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage branch locations and branch-specific logos
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground w-fit font-mono">
                    {outlets.length} {outlets.length === 1 ? 'branch' : 'branches'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Outlet Input Box */}
                <div className="flex items-center gap-2 p-2.5 bg-muted/30 border border-border/80 rounded-xl">
                  <Input
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddOutlet()
                      }
                    }}
                    placeholder="Enter branch name (e.g. Express Counter)"
                    className="h-8.5 bg-background text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleAddOutlet}
                    disabled={!newOutletName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 px-3.5 shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Branch</span>
                  </Button>
                </div>

                {/* Outlet List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {outlets.map((outletName) => {
                    const isEditing = editingOutletName === outletName
                    const outletLogoObj = outletLogos.find((l) => l.name === outletName)
                    const assignedStaffCount = getOutletStaffCount(outletName)
                    const inputId = `outlet-logo-${outletName.replace(/\s+/g, '-')}`

                    return (
                      <div
                        key={outletName}
                        className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-border transition-all flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                            {outletLogoObj?.logo ? (
                              <img
                                src={outletLogoObj.logo}
                                alt={`${outletName} Logo`}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground uppercase">
                                {outletName.slice(0, 2)}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  value={editingOutletValue}
                                  onChange={(e) => setEditingOutletValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditOutlet(outletName)
                                    if (e.key === 'Escape') handleCancelEditOutlet()
                                  }}
                                  className="h-7 text-xs bg-background"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveEditOutlet(outletName)}
                                  className="h-7 w-7 p-0 bg-emerald-600 text-white"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditOutlet}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-foreground truncate">
                                  {outletName}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditOutlet(outletName)}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                                  title="Rename Outlet"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              {assignedStaffCount} {assignedStaffCount === 1 ? 'employee' : 'employees'} assigned
                            </p>
                          </div>
                        </div>

                        {/* Outlet Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
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
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOutletLogo(outletName)}
                              className="h-7 text-[11px] text-rose-600 hover:text-rose-700 px-2"
                            >
                              Remove Logo
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(inputId)?.click()}
                              className="h-7 text-[11px] font-medium px-2"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              <span>Custom Logo</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOutlet(outletName)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Remove Outlet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'users':
        return (
          fetchUsersList &&
          onAdminCreateUser &&
          onAdminChangePassword &&
          onAdminDeleteUser &&
          onChangeMyPassword && (
            <div className="animate-fade-in">
              <UserManagementSection
                currentUserProfile={currentUserProfile}
                isAdmin={isAdmin}
                availableOutlets={outlets}
                fetchUsersList={fetchUsersList}
                onAdminCreateUser={onAdminCreateUser}
                onAdminChangePassword={onAdminChangePassword}
                onAdminDeleteUser={onAdminDeleteUser}
                onChangeMyPassword={onChangeMyPassword}
              />
            </div>
          )
        )

      case 'sync':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
            {/* Cloud Sync Status */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Supabase Cloud Database
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time synchronization status and latency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full ring-2',
                        isSupabaseConnected
                          ? 'bg-emerald-500 ring-emerald-500/20'
                          : 'bg-amber-500 ring-amber-500/20'
                      )}
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {isSupabaseConnected
                          ? 'Live Connection Active'
                          : 'Offline Mode'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isSupabaseConnected
                          ? 'Authenticated records synchronize in real-time'
                          : 'Using local cached database'}
                      </p>
                    </div>
                  </div>

                  {supabaseLatency !== null && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
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
                      className="flex-1 h-8.5 text-xs font-semibold"
                    >
                      <RefreshCw
                        className={cn(
                          'w-3.5 h-3.5 mr-1.5',
                          isSyncing && 'animate-spin text-emerald-600'
                        )}
                      />
                      <span>Force Push</span>
                    </Button>
                  )}

                  {onPullFromSupabase && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onPullFromSupabase}
                      disabled={isSyncing}
                      className="flex-1 h-8.5 text-xs font-semibold"
                    >
                      <span>Pull from Cloud</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Backup & Keep-Alive Monitoring */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Data Backup & Export
                </CardTitle>
                <CardDescription className="text-xs">
                  Export master payroll records or verify uptime keep-alive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-muted-foreground">Keep-Alive Heartbeat:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active (Every 4 min)</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-muted-foreground">Supabase Pause Prevention:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enabled</span>
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
                  className="w-full h-8.5 text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <span>Export Master Payroll (CSV)</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4 w-full flex-1 flex flex-col min-h-0 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. MOBILE LAYOUT (< md screen)                                */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden space-y-3">
        {/* If Mobile Subpage is OPEN -> Show Subpage View with Back Header */}
        {mobileSubpage ? (
          <div className="space-y-3 animate-fade-in">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between p-3 bg-card border border-border/80 rounded-xl shadow-2xs sticky top-0 z-10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMobileSubpage(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:opacity-80 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {CATEGORIES.find((c) => c.id === mobileSubpage)?.label}
                </span>
                <AutoSaveStatusBadge />
              </div>
            </div>

            {/* Subpage Content */}
            {renderSubpageContent(mobileSubpage)}
          </div>
        ) : (
          /* Mobile Settings Hub Menu */
          <div className="space-y-3 animate-fade-in">
            {/* Hub Header Card */}
            <div className="p-4 bg-card border border-border/80 rounded-xl shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Settings</h2>
                <p className="text-[11px] text-muted-foreground">{name || 'Hotel Bilal & Restaurant'}</p>
              </div>
              <AutoSaveStatusBadge />
            </div>

            {/* Category Navigation Menu Items in Vercel List Group Style */}
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60 shadow-2xs">
              {CATEGORIES.map((cat) => {
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMobileSubpage(cat.id)}
                    className="w-full p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{cat.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cat.id === 'outlets' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {outlets.length}
                        </span>
                      )}
                      {cat.id === 'sync' && (
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                          )}
                        />
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. DESKTOP LAYOUT (>= md screen)                              */}
      {/* Sidebar matching DesktopSidebar.tsx style + Active Content    */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:flex gap-5 items-start flex-1 w-full min-h-0">
        {/* Left Column: Mini Side Navigation (exact style as sidebar) */}
        <div className="w-56 lg:w-64 shrink-0 space-y-1 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Settings Menu
          </div>

          <nav className="space-y-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-bold scale-[1.01]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span className="truncate">{cat.label}</span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.id === 'outlets' && (
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded',
                          isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {outlets.length}
                      </span>
                    )}
                    {cat.id === 'sync' && (
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isSupabaseConnected
                            ? isActive
                              ? 'bg-white'
                              : 'bg-emerald-500'
                            : isActive
                            ? 'bg-white'
                            : 'bg-amber-500'
                        )}
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right Column: Active Subpage Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Subpage Header Bar with Title & Auto-Save Badge */}
          <div className="flex items-center justify-between p-3.5 bg-card border border-border/80 rounded-2xl shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {CATEGORIES.find((c) => c.id === activeCategory)?.description}
              </p>
            </div>
            <AutoSaveStatusBadge />
          </div>

          {/* Subpage Card Content */}
          {renderSubpageContent(activeCategory)}
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
