import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Key,
  Trash2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { UserProfile, UserRole } from '@/types/attendance'
import { ChangePasswordModal } from './ChangePasswordModal'
import { cn } from '@/lib/utils'

interface UserManagementSectionProps {
  currentUserProfile: UserProfile | null
  isAdmin: boolean
  availableOutlets?: string[]
  fetchUsersList: () => Promise<UserProfile[]>
  onAdminCreateUser: (
    username: string,
    password: string,
    name: string,
    role?: UserRole,
    outlet?: string
  ) => Promise<{ success: boolean; error?: string }>
  onAdminChangePassword: (
    userId: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>
  onAdminDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
  onAdminUpdateUserRole?: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>
  onChangeMyPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentUserProfile,
  isAdmin,
  availableOutlets = ['All Branches'],
  fetchUsersList,
  onAdminCreateUser,
  onAdminChangePassword,
  onAdminDeleteUser,
  onAdminUpdateUserRole,
  onChangeMyPassword
}) => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Create User Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
  const [createUsername, setCreateUsername] = useState<string>('')
  const [createName, setCreateName] = useState<string>('')
  const [createRole, setCreateRole] = useState<UserRole>('staff')
  const [createOutlet, setCreateOutlet] = useState<string>('All Branches')
  const [createPassword, setCreatePassword] = useState<string>('')
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string>('')

  // Change Password Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false)
  const [targetPasswordUser, setTargetPasswordUser] = useState<UserProfile | null>(null)

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await fetchUsersList()
      setUsers(list)
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsersList])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleOpenCreate = () => {
    setCreateUsername('')
    setCreateName('')
    setCreateRole('staff')
    setCreateOutlet('All Branches')
    setCreatePassword('')
    setCreateError('')
    setIsCreateOpen(true)
  }

  const handleToggleRole = async (user: UserProfile) => {
    if (!onAdminUpdateUserRole) return
    const newRole: UserRole = user.role === 'admin' ? 'staff' : 'admin'
    const confirmMsg = user.role === 'admin'
      ? `Change "${user.displayName}" (@${user.username}) to Staff User?\n\nStaff users cannot add more users, but can do everything else like an admin.`
      : `Promote "${user.displayName}" (@${user.username}) to Administrator?\n\nThey will have full access including creating and managing other app users.`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await onAdminUpdateUserRole(user.id, newRole)
      if (!res.success) {
        alert(res.error || 'Failed to update user role.')
      } else {
        setFeedback({
          type: 'success',
          text: `Updated role for "${user.displayName}" to ${newRole === 'admin' ? 'Administrator' : 'Staff User'}.`
        })
        setTimeout(() => setFeedback(null), 3500)
        await loadUsers()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update role'
      alert(msg)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    if (!createUsername.trim() || !createName.trim() || !createPassword.trim()) {
      setCreateError('All required fields must be filled.')
      return
    }

    if (createPassword.length < 6) {
      setCreateError('Password must be at least 6 characters.')
      return
    }

    setCreateLoading(true)

    try {
      const res = await onAdminCreateUser(
        createUsername.trim(),
        createPassword,
        createName.trim(),
        createRole,
        createOutlet
      )

      if (!res.success) {
        setCreateError(res.error || 'Failed to create user account.')
      } else {
        setIsCreateOpen(false)
        setFeedback({ type: 'success', text: `User account for "${createName.trim()}" created successfully in Supabase.` })
        setTimeout(() => setFeedback(null), 3500)
        await loadUsers()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      setCreateError(msg)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUserProfile?.id) {
      alert('You cannot delete your own active account.')
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user "${user.displayName}" (@${user.username})? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const res = await onAdminDeleteUser(user.id)
      if (!res.success) {
        alert(res.error || 'Failed to delete user.')
      } else {
        setFeedback({ type: 'success', text: `User ${user.displayName} was removed.` })
        setTimeout(() => setFeedback(null), 3500)
        await loadUsers()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user'
      alert(msg)
    }
  }

  const handleOpenChangePassword = (user?: UserProfile) => {
    setTargetPasswordUser(user || null)
    setIsPasswordModalOpen(true)
  }

  const handleExecuteChangePassword = async (
    newPassword: string,
    targetUserId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (targetUserId && isAdmin && targetUserId !== currentUserProfile?.id) {
      return onAdminChangePassword(targetUserId, newPassword)
    } else {
      return onChangeMyPassword(newPassword)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>App Login Accounts & Roles</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage who can log in to operate this app (Admins and Standard Users)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChangePassword()}
                className="h-8 text-xs"
              >
                <Key className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Change My Password</span>
              </Button>

              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  <span>Create App User</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {feedback && (
            <div
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold animate-fade-in border',
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
              )}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* User List Table (Desktop) */}
          <div className="rounded-xl border border-border/70 overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold">User Name</TableHead>
                  <TableHead className="text-xs font-semibold">Login Username / Email</TableHead>
                  <TableHead className="text-xs font-semibold">Branch Access</TableHead>
                  <TableHead className="text-xs font-semibold">App Role</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-emerald-600" />
                      Loading authorized users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                      No user accounts found. Click "Create User" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUserProfile?.id
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-xs text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                          @{u.username}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground text-[11px] font-medium border border-border/60">
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            <span>{u.outlet || 'All Branches'}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                            )}
                          >
                            {u.role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                <span>Administrator</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Staff User</span>
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && (
                              <>
                                {!isSelf && onAdminUpdateUserRole && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleRole(u)}
                                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                                    title={u.role === 'admin' ? 'Change to Staff User' : 'Promote to Admin'}
                                  >
                                    <span>{u.role === 'admin' ? 'To Staff' : 'To Admin'}</span>
                                  </Button>
                                )}

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenChangePassword(u)}
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                  title="Change User Password"
                                >
                                  <Key className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                  <span>Reset PW</span>
                                </Button>

                                {!isSelf && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(u)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* User Cards (Mobile) */}
          <div className="space-y-2 md:hidden">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-emerald-600" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No user accounts found.
              </div>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUserProfile?.id
                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-border/80 bg-card space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <span>{u.displayName}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground font-semibold">
                          @{u.username}
                        </p>
                      </div>

                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        )}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Building2 className="w-3 h-3 text-emerald-600" />
                      <span>{u.outlet || 'All Branches'}</span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                        {!isSelf && onAdminUpdateUserRole && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(u)}
                            className="h-7 text-xs px-2"
                          >
                            <span>{u.role === 'admin' ? 'Change to Staff' : 'Promote to Admin'}</span>
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenChangePassword(u)}
                          className="h-7 text-xs px-2"
                        >
                          <Key className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>Password</span>
                        </Button>

                        {!isSelf && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u)}
                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Delete</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New User Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Create App Login Account</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 py-1">
            {createError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-200 text-xs font-semibold">
                {createError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-user-name" className="text-xs font-semibold">
                User Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="new-user-name"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Cashier Counter 1 or Riskhan"
                className="h-9 bg-background text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-user-role" className="text-xs font-semibold">
                App Access Role <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={createRole}
                onValueChange={(val) => setCreateRole(val as UserRole)}
              >
                <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff User (Standard Operational)</SelectItem>
                  <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-2.5 rounded-lg border text-[11px] space-y-1 bg-muted/40 border-border/70">
                {createRole === 'staff' ? (
                  <>
                    <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Staff Role User</span>
                    </p>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Staff role users are app users who <strong>cannot add more users</strong>, but can do everything else just like admin (Attendance, Over Duty, Daily Wage, Cash Advance, Staff Roster, and Payslip Generator).
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Administrator Role</span>
                    </p>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                      Admin role users have full system access including creating and managing other app users.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-user-outlet" className="text-xs font-semibold">
                Branch / Outlet Access <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={createOutlet}
                onValueChange={(val) => setCreateOutlet(val || 'All Branches')}
              >
                <SelectTrigger className="w-full h-9 bg-background border-border/80 text-xs">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  {availableOutlets.map((outlet) => (
                    <SelectItem key={outlet} value={outlet}>
                      {outlet} {outlet === 'All Branches' ? '(Default & Full Access)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                All branches is the default and only option. User will have access across all branches.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-user-username" className="text-xs font-semibold">
                Username or Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="new-user-username"
                type="text"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                placeholder="e.g. cashier1 or staff@hotelbilal.com"
                className="h-9 bg-background text-sm"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Enter a username (e.g. <span className="font-mono">cashier1</span>) or any valid email address.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-user-password" className="text-xs font-semibold">
                Initial Password <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="h-9 pr-9 bg-background text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={createLoading}
                className="h-8.5 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createLoading}
                className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {createLoading
                  ? 'Creating Account...'
                  : createRole === 'staff'
                  ? 'Create Staff User'
                  : 'Create Admin User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        targetUser={targetPasswordUser}
        onChangePassword={handleExecuteChangePassword}
      />
    </div>
  )
}
