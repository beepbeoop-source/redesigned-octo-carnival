import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL_KEY = 'attendance_supabase_url'
export const SUPABASE_KEY_KEY = 'attendance_supabase_anon_key'
export const SUPABASE_KEEP_ALIVE_KEY = 'attendance_supabase_keep_alive_enabled'

let cachedClient: SupabaseClient | null = null
let lastConfigUrl = ''
let lastConfigKey = ''

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

  const localUrl = localStorage.getItem(SUPABASE_URL_KEY) || ''
  const localKey = localStorage.getItem(SUPABASE_KEY_KEY) || ''

  const url = (localUrl || envUrl).trim()
  const key = (localKey || envKey).trim()

  return { url, key }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials()
  return Boolean(url && key && url.startsWith('http'))
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials()
  if (!url || !key) return null

  if (cachedClient && lastConfigUrl === url && lastConfigKey === key) {
    return cachedClient
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
    lastConfigUrl = url
    lastConfigKey = key
    return cachedClient
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err)
    return null
  }
}

export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  latencyMs?: number
}> {
  const client = getSupabase()
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing. Please configure credentials.'
    }
  }

  const start = performance.now()
  try {
    // Try pinging or querying keep_alive / staff table
    const { error } = await client.from('keep_alive_pings').select('id').limit(1)

    // Even if the table doesn't exist yet, reaching Supabase returns error code PGRST204 or 42P01
    const duration = Math.round(performance.now() - start)

    if (error && error.code !== '42P01' && error.code !== 'PGRST204') {
      // If table doesn't exist, it's still connected to Supabase
      if (error.message && !error.message.includes('relation') && !error.message.includes('schema')) {
        return {
          success: false,
          message: `Supabase Error: ${error.message}`
        }
      }
    }

    return {
      success: true,
      message: `Connected successfully (${duration}ms latency)`,
      latencyMs: duration
    }
  } catch (err: unknown) {
    const duration = Math.round(performance.now() - start)
    if (err instanceof Error) {
      return {
        success: false,
        message: `Network/Connection Error: ${err.message}`
      }
    }
    return {
      success: false,
      message: `Failed to connect to Supabase (${duration}ms)`
    }
  }
}
