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
  X
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
import type { StoreProfile, OutletLogo, Staff } from '@/types/attendance'
import type { SyncResult } from '@/lib/supabaseSync'
import { cn } from '@/lib/utils'

interface SettingsTabProps {
  storeProfile: StoreProfile
  staffList: Staff[]
  onSaveProfile: (profile: StoreProfile) => Promise<SyncResult | void> | void
  onRenameOutlet?: (oldName: string, newName: string) => void
  onManualSync?: () => void
  onPullFromSupabase?: () => void
  isSyncing?: boolean
  isSupabaseConnected?: boolean
  supabaseLatency?: number | null
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  storeProfile,
  staffList,
  onSaveProfile,
  onRenameOutlet,
  onManualSync,
  onPullFromSupabase,
  isSyncing = false,
  isSupabaseConnected = false,
  supabaseLatency = null
}) => {
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

  const handleMainLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
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

  const handleOutletLogoUpload = (
    outletName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setOutletLogos((prev) => {
        const existing = prev.find((l) => l.name === outletName)
        if (existing) {
          return prev.map((l) =>
            l.name === outletName ? { ...l, logo: dataUrl } : l
          )
        }
        return [...prev, { name: outletName, logo: dataUrl }]
      })
    }
    reader.readAsDataURL(file)
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage restaurant branding, branches, contact details, and outlet logos
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Store Details & Main Logo */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Logo Card */}
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
                  className="w-full h-8 text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Select Logo File
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cloud Sync Status Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cloud className="w-4 h-4 text-teal-600" />
                <span>Cloud Database Sync</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time backup and multi-device connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full ring-2',
                      isSupabaseConnected
                        ? 'bg-emerald-500 ring-emerald-500/30'
                        : 'bg-amber-500 ring-amber-500/30'
                    )}
                  />
                  <span className="font-bold text-foreground">
                    {isSupabaseConnected ? 'Connected & Live' : 'Local Offline Mode'}
                  </span>
                </div>

                {supabaseLatency !== null && (
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {supabaseLatency}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onManualSync && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="flex-1 h-8 text-xs font-medium"
                    title="Push local data to Supabase"
                  >
                    <RefreshCw
                      className={cn(
                        'w-3.5 h-3.5 mr-1.5',
                        isSyncing && 'animate-spin text-emerald-600'
                      )}
                    />
                    <span>Push Cloud</span>
                  </Button>
                )}

                {onPullFromSupabase && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onPullFromSupabase}
                    disabled={isSyncing}
                    className="flex-1 h-8 text-xs font-medium"
                    title="Pull remote records from Supabase"
                  >
                    <Cloud className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                    <span>Pull Cloud</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Restaurant Profile & Outlets Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Company & Restaurant Information</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Basic business details displayed on header and payslips
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
                  className="h-9 bg-background text-sm"
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
                    <span>Business Address</span>
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
            </CardContent>
          </Card>

          {/* Outlets & Branches Management */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Outlets & Branches Management</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add new outlets and upload custom outlet logos for payslips
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground w-fit">
                  {outlets.length} {outlets.length === 1 ? 'Outlet' : 'Outlets'}
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
                  placeholder="Enter new outlet name (e.g. Highway Branch, Express Outlet)"
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
                    const outletLogoObj = outletLogos.find(
                      (l) => l.name === outletName
                    )
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
      </div>
    </div>
  )
}
