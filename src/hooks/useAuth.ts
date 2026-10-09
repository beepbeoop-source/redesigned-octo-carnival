import { useState, useEffect, useCallback } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { UserProfile, UserRole } from '../types/attendance'

const SESSION_STORAGE_KEY = 'hotel_bilal_active_user'

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Save or remove active profile from localStorage
  const persistProfile = useCallback((userProf: UserProfile | null) => {
    setProfile(userProf)
    try {
      if (userProf) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProf))
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch (err) {
      console.error('Failed to save user session:', err)
    }
  }, [])

  // Verify / Refresh current session profile against database
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const savedStr = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!savedStr) {
      setIsLoading(false)
      return null
    }

    const client = getSupabase()
    if (!client || !isSupabaseConfigured()) {
      setIsLoading(false)
      return profile
    }

    try {
      const current: UserProfile = JSON.parse(savedStr)
      const { data, error: fetchErr } = await client
        .from('app_users')
        .select('id, username, display_name, role, outlet, created_at, updated_at')
        .eq('id', current.id)
        .maybeSingle()

      if (!fetchErr && data) {
        const updated: UserProfile = {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          role: (data.role as UserRole) || 'staff',
          outlet: data.outlet || 'Main Branch',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
        persistProfile(updated)
        setIsLoading(false)
        return updated
      } else if (fetchErr) {
        console.warn('Session verify note:', fetchErr.message)
      }
    } catch (err) {
      console.warn('Failed to revalidate session:', err)
    } finally {
      setIsLoading(false)
    }

    return profile
  }, [persistProfile, profile])

  useEffect(() => {
    refreshProfile()
  }, [])

  // 1. Login with Username & Password
  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client || !isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Database connection is not configured. Please check Supabase credentials in settings.'
      }
    }

    setError(null)
    const cleanUsername = username.trim()

    try {
      const { data, error: rpcErr } = await client.rpc('app_login', {
        p_username: cleanUsername,
        p_password: password
      })

      if (rpcErr) {
        setError(rpcErr.message)
        return { success: false, error: rpcErr.message }
      }

      if (!data || !data.success) {
        const errMsg = data?.error || 'Invalid username or password.'
        setError(errMsg)
        return { success: false, error: errMsg }
      }

      const u = data.user
      const userProf: UserProfile = {
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        role: (u.role as UserRole) || 'staff',
        outlet: u.outlet || 'Main Branch',
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }

      persistProfile(userProf)
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  // 2. Logout
  const logout = async (): Promise<void> => {
    persistProfile(null)
  }

  // 3. Change Own Password
  const changeMyPassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'Not logged in.' }

    const client = getSupabase()
    if (!client) return { success: false, error: 'Database is not configured' }

    try {
      const { data, error: rpcErr } = await client.rpc('app_change_password', {
        p_user_id: profile.id,
        p_new_password: newPassword
      })

      if (rpcErr) return { success: false, error: rpcErr.message }
      if (data && !data.success) return { success: false, error: data.error || 'Failed to update password' }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password'
      return { success: false, error: msg }
    }
  }

  // 4. Admin Create User
  const adminCreateUser = async (
    username: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client) return { success: false, error: 'Database is not configured' }

    try {
      const { data, error: rpcErr } = await client.rpc('app_create_user', {
        p_username: username.trim(),
        p_password: password,
        p_name: name.trim(),
        p_role: 'staff'
      })

      if (rpcErr) return { success: false, error: rpcErr.message }
      if (data && !data.success) return { success: false, error: data.error || 'Failed to create user' }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      return { success: false, error: msg }
    }
  }

  // 5. Admin Change Any User's Password
  const adminChangeUserPassword = async (
    targetUserId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client) return { success: false, error: 'Database is not configured' }

    try {
      const { data, error: rpcErr } = await client.rpc('app_change_password', {
        p_user_id: targetUserId,
        p_new_password: newPassword
      })

      if (rpcErr) return { success: false, error: rpcErr.message }
      if (data && !data.success) return { success: false, error: data.error || 'Failed to update password' }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password'
      return { success: false, error: msg }
    }
  }

  // 6. Admin Delete User
  const adminDeleteUser = async (
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client) return { success: false, error: 'Database is not configured' }

    try {
      const { data, error: rpcErr } = await client.rpc('app_delete_user', {
        p_user_id: targetUserId
      })

      if (rpcErr) return { success: false, error: rpcErr.message }
      if (data && !data.success) return { success: false, error: data.error || 'Failed to delete user' }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user'
      return { success: false, error: msg }
    }
  }

  // 7. Fetch All Users List
  const fetchUsersList = async (): Promise<UserProfile[]> => {
    const client = getSupabase()
    if (!client) return []

    try {
      const { data, error: rpcErr } = await client.rpc('app_list_users')
      if (!rpcErr && data) {
        return data.map((r: any) => ({
          id: r.id,
          username: r.username,
          displayName: r.display_name || r.username,
          role: (r.role as UserRole) || 'staff',
          outlet: r.outlet || 'Main Branch',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }))
      }

      // Fallback direct table select
      const { data: tableData, error: tableErr } = await client
        .from('app_users')
        .select('id, username, display_name, role, outlet, created_at, updated_at')
        .order('role', { ascending: true })
        .order('display_name', { ascending: true })

      if (!tableErr && tableData) {
        return tableData.map((r: any) => ({
          id: r.id,
          username: r.username,
          displayName: r.display_name || r.username,
          role: (r.role as UserRole) || 'staff',
          outlet: r.outlet || 'Main Branch',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }))
      }

      return []
    } catch (err) {
      console.error('Failed to fetch users list:', err)
      return []
    }
  }

  const isAdmin = profile?.role === 'admin'

  return {
    user: profile,
    profile,
    isAdmin,
    isLoading,
    error,
    login,
    logout,
    changeMyPassword,
    adminCreateUser,
    adminChangeUserPassword,
    adminDeleteUser,
    fetchUsersList,
    refreshProfile
  }
}
