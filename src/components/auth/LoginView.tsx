import React, { useState } from 'react'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  LogIn,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StoreProfile } from '@/types/attendance'

interface LoginViewProps {
  storeProfile: StoreProfile
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
}

export const LoginView: React.FC<LoginViewProps> = ({
  storeProfile,
  onLogin
}) => {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)

    try {
      const res = await onLogin(username.trim(), password)
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid username or password. Please try again.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30 dark:bg-background antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      <div className="w-full max-w-md space-y-4">
        {/* Restaurant Header & Logo */}
        <div className="flex flex-col items-center text-center space-y-2 mb-2">
          {storeProfile.logo ? (
            <img
              src={storeProfile.logo}
              alt="Restaurant Logo"
              className="w-16 h-16 object-contain rounded-2xl p-1 bg-card border border-border shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {storeProfile.name || 'Hotel Bilal & Restaurant'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Staff Portal • Attendance & Payroll System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 shadow-md bg-card">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-base font-bold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Staff Sign In</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your assigned username and password to access the portal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="auth-username" className="text-xs font-semibold">
                  Username <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or cashier1"
                    className="h-9.5 pl-9 bg-background text-sm"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password" className="text-xs font-semibold">
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Min. 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9.5 pl-9 pr-9 bg-background text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-all"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Offline indicator */}
        <p className="text-[11px] text-center text-muted-foreground">
          Protected by Supabase Enterprise Authentication & RLS Security
        </p>
      </div>
    </div>
  )
}
