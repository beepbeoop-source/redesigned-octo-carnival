-- ==============================================================================
-- Supabase Schema for Restaurant Staff Attendance, Variable Wages & Payroll
-- ==============================================================================

-- 1. Create Staff Table
-- Holds employee master data, designations, status, daily attendance marks,
-- overtime hours/amounts, wage overrides, and salary advances.
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT NOT NULL DEFAULT 'Other',
  outlet TEXT NOT NULL DEFAULT 'Main Branch',
  designation TEXT DEFAULT '-',
  status TEXT NOT NULL DEFAULT 'Working',
  wage NUMERIC DEFAULT 650,
  salary_changes BOOLEAN DEFAULT false,
  attendance JSONB DEFAULT '{}'::jsonb,
  overtime JSONB DEFAULT '{}'::jsonb,
  advances JSONB DEFAULT '{}'::jsonb,
  wage_by_date JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rapid filtering
CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff(dept);
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON staff(outlet);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- 2. Create Store Profile Table
-- Holds restaurant branding, address, contact, branch outlets list, and custom logos.
CREATE TABLE IF NOT EXISTS store_profile (
  id TEXT PRIMARY KEY DEFAULT 'default_store',
  name TEXT NOT NULL DEFAULT 'Hotel Bilal & Restaurant',
  address TEXT,
  phone TEXT,
  outlets JSONB DEFAULT '["Main Branch"]'::jsonb,
  logo TEXT,
  outlet_logos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Keep-Alive & Heartbeat Table
-- Used by the automated background service to ping the database every 5 minutes.
-- This ensures free-tier Supabase projects never go into paused state due to inactivity.
CREATE TABLE IF NOT EXISTS keep_alive_pings (
  id TEXT PRIMARY KEY DEFAULT 'primary_heartbeat',
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  client_info TEXT DEFAULT 'attendance_app',
  ping_count BIGINT DEFAULT 1
);

-- 4. Automatic Timestamp Update Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to staff and store_profile tables
DROP TRIGGER IF EXISTS trg_staff_updated_at ON staff;
CREATE TRIGGER trg_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_store_profile_updated_at ON store_profile;
CREATE TRIGGER trg_store_profile_updated_at
BEFORE UPDATE ON store_profile
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_pings ENABLE ROW LEVEL SECURITY;

-- 6. Direct Client Access Policies (for anon public key)
DROP POLICY IF EXISTS "Public staff select" ON staff;
DROP POLICY IF EXISTS "Public staff insert" ON staff;
DROP POLICY IF EXISTS "Public staff update" ON staff;
DROP POLICY IF EXISTS "Public staff delete" ON staff;

CREATE POLICY "Public staff select" ON staff FOR SELECT USING (true);
CREATE POLICY "Public staff insert" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Public staff update" ON staff FOR UPDATE USING (true);
CREATE POLICY "Public staff delete" ON staff FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public store_profile select" ON store_profile;
DROP POLICY IF EXISTS "Public store_profile insert" ON store_profile;
DROP POLICY IF EXISTS "Public store_profile update" ON store_profile;

CREATE POLICY "Public store_profile select" ON store_profile FOR SELECT USING (true);
CREATE POLICY "Public store_profile insert" ON store_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Public store_profile update" ON store_profile FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public keep_alive select" ON keep_alive_pings;
DROP POLICY IF EXISTS "Public keep_alive insert" ON keep_alive_pings;
DROP POLICY IF EXISTS "Public keep_alive update" ON keep_alive_pings;

CREATE POLICY "Public keep_alive select" ON keep_alive_pings FOR SELECT USING (true);
CREATE POLICY "Public keep_alive insert" ON keep_alive_pings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public keep_alive update" ON keep_alive_pings FOR UPDATE USING (true);

-- 7. Heartbeat Function for Cron / API Triggers
CREATE OR REPLACE FUNCTION ping_heartbeat()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO keep_alive_pings (id, last_ping, client_info, ping_count)
  VALUES ('primary_heartbeat', NOW(), 'cron_heartbeat', 1)
  ON CONFLICT (id) DO UPDATE
  SET last_ping = NOW(),
      ping_count = keep_alive_pings.ping_count + 1;
  RETURN json_build_object('status', 'ok', 'timestamp', NOW());
END;
$$;
