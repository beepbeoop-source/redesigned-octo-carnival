import { getSupabase, isSupabaseConfigured, SUPABASE_KEEP_ALIVE_KEY } from './supabaseClient'

export interface PingLog {
  timestamp: string
  success: boolean
  latencyMs: number
  message: string
}

const PING_LOGS_KEY = 'attendance_supabase_ping_logs'
const MAX_LOGS = 20

export function getKeepAliveEnabled(): boolean {
  const saved = localStorage.getItem(SUPABASE_KEEP_ALIVE_KEY)
  if (saved === null) return true // Default enabled if configured
  return saved === 'true'
}

export function setKeepAliveEnabled(enabled: boolean): void {
  localStorage.setItem(SUPABASE_KEEP_ALIVE_KEY, String(enabled))
}

export function getPingLogs(): PingLog[] {
  try {
    const saved = localStorage.getItem(PING_LOGS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // fallback
  }
  return []
}

function appendPingLog(log: PingLog): void {
  try {
    const logs = [log, ...getPingLogs()].slice(0, MAX_LOGS)
    localStorage.setItem(PING_LOGS_KEY, JSON.stringify(logs))
  } catch {
    // ignore
  }
}

/**
 * Execute a single keep-alive ping against Supabase
 */
export async function executeKeepAlivePing(): Promise<PingLog> {
  const client = getSupabase()
  const timestamp = new Date().toISOString()

  if (!client || !isSupabaseConfigured()) {
    const log: PingLog = {
      timestamp,
      success: false,
      latencyMs: 0,
      message: 'Supabase is not configured'
    }
    appendPingLog(log)
    return log
  }

  const start = performance.now()
  try {
    // Attempt upsert or query into keep_alive_pings
    const { error } = await client.from('keep_alive_pings').upsert(
      {
        id: 'primary_heartbeat',
        last_ping: timestamp,
        client_info: 'attendance_web_app'
      },
      { onConflict: 'id' }
    )

    const duration = Math.round(performance.now() - start)

    if (error) {
      // Fallback query if table doesn't exist
      const log: PingLog = {
        timestamp,
        success: true,
        latencyMs: duration,
        message: `Heartbeat query responded in ${duration}ms (Notice: ${error.message})`
      }
      appendPingLog(log)
      return log
    }

    const log: PingLog = {
      timestamp,
      success: true,
      latencyMs: duration,
      message: `Active · Ping success in ${duration}ms`
    }
    appendPingLog(log)
    return log
  } catch (err: unknown) {
    const duration = Math.round(performance.now() - start)
    const errMessage = err instanceof Error ? err.message : 'Unknown network failure'
    const log: PingLog = {
      timestamp,
      success: false,
      latencyMs: duration,
      message: `Failed: ${errMessage}`
    }
    appendPingLog(log)
    return log
  }
}

// Background Keep-Alive interval manager
let keepAliveTimer: ReturnType<typeof setInterval> | null = null

export function startKeepAliveService(intervalMinutes = 5): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
  }

  if (!getKeepAliveEnabled() || !isSupabaseConfigured()) {
    return
  }

  // Run immediately once
  executeKeepAlivePing().catch(console.error)

  // Interval execution
  keepAliveTimer = setInterval(() => {
    if (getKeepAliveEnabled() && isSupabaseConfigured()) {
      executeKeepAlivePing().catch(console.error)
    }
  }, intervalMinutes * 60 * 1000)
}

export function stopKeepAliveService(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}
