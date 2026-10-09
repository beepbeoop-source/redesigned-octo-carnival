import { useState, useEffect, useCallback } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { UserProfile, UserRole } from '../types/attendance'

const SESSION_STORAGE_KEY = 'hotel_bilal_active_user'

function resolveAuthEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase()
  if (clean.includes('@')) {
    return clean
  }
  return `${clean}@hotelbilal.app`
}

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

  // Map Supabase Auth user & profile row into UserProfile object
  const buildProfileFromUser = useCallback(async (userId: string, authUserMeta?: any): Promise<UserProfile | null> => {
    const client = getSupabase()
    if (!client) return null

    try {
      const { data, error: fetchErr } = await client
        .from('user_profiles')
        .select('id, username, display_name, role, outlet, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (!fetchErr && data) {
        return {
          id: data.id,
          username: data.username,
          displayName: data.display_name || data.username,
          role: (data.role as UserRole) || 'staff',
          outlet: data.outlet || 'Main Branch',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      }

      // Fallback to auth metadata if user_profiles table is still populating
      const meta = authUserMeta || {}
      return {
        id: userId,
        username: meta.username || 'staff',
        displayName: meta.display_name || meta.name || 'Staff User',
        role: (meta.role as UserRole) || 'staff',
        outlet: meta.outlet || 'Main Branch',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (err) {
      console.warn('Profile resolution note:', err)
      return null
    }
  }, [])

  // Verify / Refresh current session against Supabase Auth
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const client = getSupabase()
    if (!client || !isSupabaseConfigured()) {
      setIsLoading(false)
      return profile
    }

    try {
      const { data: { session }, error: sessionErr } = await client.auth.getSession()
      if (sessionErr || !session || !session.user) {
        persistProfile(null)
        setIsLoading(false)
        return null
      }

      const userProf = await buildProfileFromUser(session.user.id, session.user.user_metadata)
      if (userProf) {
        persistProfile(userProf)
        setIsLoading(false)
        return userProf
      }
    } catch (err) {
      console.warn('Failed to revalidate Supabase session:', err)
    } finally {
      setIsLoading(false)
    }

    return profile
  }, [buildProfileFromUser, persistProfile, profile])

  // Setup Supabase Auth listener
  useEffect(() => {
    const client = getSupabase()
    if (!client || !isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    refreshProfile()

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProf = await buildProfileFromUser(session.user.id, session.user.user_metadata)
        if (userProf) persistProfile(userProf)
      } else if (event === 'SIGNED_OUT') {
        persistProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 1. Login with Username or Email & Password via Supabase Auth
  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client || !isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Database connection is not configured. Please check Supabase credentials.'
      }
    }

    setError(null)
    const email = resolveAuthEmail(usernameOrEmail)

    try {
      const { data, error: authErr } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (authErr) {
        // Human friendly error messages
        let msg = authErr.message
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Invalid email or password. Please try again.'
        }
        setError(msg)
        return { success: false, error: msg }
      }

      if (data?.user) {
        const userProf = await buildProfileFromUser(data.user.id, data.user.user_metadata)
        if (userProf) {
          persistProfile(userProf)
        }
        return { success: true }
      }

      return { success: false, error: 'Authentication failed.' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  // 2. Logout
  const logout = async (): Promise<void> => {
    const client = getSupabase()
    if (client) {
      try {
        await client.auth.signOut()
      } catch (err) {
        console.warn('Sign out warning:', err)
      }
    }
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
      const { error: updateErr } = await client.auth.updateUser({
        password: newPassword
      })

      if (updateErr) {
        return { success: false, error: updateErr.message }
      }

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
    name: string,
    role: UserRole = 'staff',
    outlet: string = 'Main Branch'
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase()
    if (!client) return { success: false, error: 'Database is not configured' }

    try {
      const { data, error: rpcErr } = await client.rpc('admin_create_app_user', {
        p_username: username.trim(),
        p_password: password,
        p_name: name.trim(),
        p_role: role,
        p_outlet: outlet
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
      const { data, error: rpcErr } = await client.rpc('admin_reset_user_password', {
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
      const { data, error: rpcErr } = await client.rpc('admin_delete_app_user', {
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
      if (!rpcErr && data && Array.isArray(data)) {
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

      // Direct user_profiles query
      const { data: tableData, error: tableErr } = await client
        .from('user_profiles')
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
