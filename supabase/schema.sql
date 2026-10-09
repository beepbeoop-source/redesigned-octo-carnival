-- ==============================================================================
-- SAFE SUPABASE SCHEMA INITIALIZATION & UPDATE SCRIPT
-- NON-DESTRUCTIVE: Preserves all existing tables and data (NO DROP TABLES).
-- Run this in Supabase SQL Editor to set up or update your database schema safely.
-- ==============================================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. DEDICATED APP USERS TABLE (Authentication & Roles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Staff Member',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  outlet TEXT NOT NULL DEFAULT 'Main Branch',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- ==============================================================================
-- 2. STAFF MASTER & RECORD TABLES
-- ==============================================================================

-- 1. Staff Master Table (Physical Restaurant Employees)
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT NOT NULL DEFAULT 'Other',
  outlet TEXT NOT NULL DEFAULT 'Main Branch',
  designation TEXT DEFAULT '-',
  status TEXT NOT NULL DEFAULT 'Working',
  wage NUMERIC DEFAULT 650,
  salary_changes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff(dept);
CREATE INDEX IF NOT EXISTS idx_staff_outlet ON staff(outlet);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- 2. Daily Attendance Table (1 row per employee per date)
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mark TEXT NOT NULL CHECK (mark IN ('P', 'H', 'A', '')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_attendance_staff_date UNIQUE (staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- 3. Overtime / Over-Duty Table
CREATE TABLE IF NOT EXISTS overtime (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_overtime_staff_date UNIQUE (staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_overtime_staff_date ON overtime(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_overtime_date ON overtime(date);

-- 4. Advances Table (Disbursed Cash by Date)
CREATE TABLE IF NOT EXISTS advances (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_advances_staff_date UNIQUE (staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_advances_staff_date ON advances(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_advances_date ON advances(date);

-- 5. Daily Wages Table (Date-Specific Daily Wage Overrides)
CREATE TABLE IF NOT EXISTS daily_wages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_daily_wages_staff_date UNIQUE (staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_wages_staff_date ON daily_wages(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_wages_date ON daily_wages(date);

-- 6. Store Profile Table (Restaurant Branding, Outlets & Logos)
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

-- 7. Keep-Alive & Heartbeat Table
CREATE TABLE IF NOT EXISTS keep_alive_pings (
  id TEXT PRIMARY KEY DEFAULT 'primary_heartbeat',
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  client_info TEXT DEFAULT 'attendance_app',
  ping_count BIGINT DEFAULT 1
);

-- ==============================================================================
-- 3. AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON public.app_users;
CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_staff_updated_at ON staff;
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_overtime_updated_at ON overtime;
CREATE TRIGGER trg_overtime_updated_at BEFORE UPDATE ON overtime FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_advances_updated_at ON advances;
CREATE TRIGGER trg_advances_updated_at BEFORE UPDATE ON advances FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_daily_wages_updated_at ON daily_wages;
CREATE TRIGGER trg_daily_wages_updated_at BEFORE UPDATE ON daily_wages FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_store_profile_updated_at ON store_profile;
CREATE TRIGGER trg_store_profile_updated_at BEFORE UPDATE ON store_profile FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_pings ENABLE ROW LEVEL SECURITY;

-- App Users Policies
DROP POLICY IF EXISTS "Public app_users select safe" ON public.app_users;
CREATE POLICY "Public app_users select safe" ON public.app_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public app_users insert" ON public.app_users;
CREATE POLICY "Public app_users insert" ON public.app_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public app_users update" ON public.app_users;
CREATE POLICY "Public app_users update" ON public.app_users FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public app_users delete" ON public.app_users;
CREATE POLICY "Public app_users delete" ON public.app_users FOR DELETE USING (true);

-- Application Data Policies
DROP POLICY IF EXISTS "Public staff all" ON staff;
CREATE POLICY "Public staff all" ON staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public attendance all" ON attendance;
CREATE POLICY "Public attendance all" ON attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public overtime all" ON overtime;
CREATE POLICY "Public overtime all" ON overtime FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public advances all" ON advances;
CREATE POLICY "Public advances all" ON advances FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public daily_wages all" ON daily_wages;
CREATE POLICY "Public daily_wages all" ON daily_wages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public store_profile all" ON store_profile;
CREATE POLICY "Public store_profile all" ON store_profile FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public keep_alive all" ON keep_alive_pings;
CREATE POLICY "Public keep_alive all" ON keep_alive_pings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. AUTHENTICATION & USER MANAGEMENT RPC FUNCTIONS
-- ==============================================================================

-- 1. App Login (Verify Username & Password)
CREATE OR REPLACE FUNCTION public.app_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  clean_uname TEXT;
BEGIN
  clean_uname := LOWER(TRIM(p_username));
  
  IF clean_uname = '' OR p_password = '' THEN
    RETURN json_build_object('success', false, 'error', 'Username and password are required.');
  END IF;

  SELECT id, username, password_hash, display_name, role, outlet, created_at, updated_at
  INTO v_user
  FROM public.app_users
  WHERE LOWER(username) = clean_uname;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
  END IF;

  -- Check password hash using pgcrypto crypt
  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password.');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'displayName', v_user.display_name,
      'role', v_user.role,
      'outlet', v_user.outlet,
      'createdAt', v_user.created_at,
      'updatedAt', v_user.updated_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create User (Hashed Password)
CREATE OR REPLACE FUNCTION public.app_create_user(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'staff',
  p_outlet TEXT DEFAULT 'Main Branch'
)
RETURNS JSON AS $$
DECLARE
  v_id UUID;
  clean_uname TEXT;
  clean_name TEXT;
  clean_role TEXT;
  clean_outlet TEXT;
  hashed_pw TEXT;
BEGIN
  clean_uname := LOWER(TRIM(p_username));
  clean_name := TRIM(p_name);
  clean_role := LOWER(TRIM(p_role));
  clean_outlet := TRIM(p_outlet);

  IF clean_uname = '' THEN
    RETURN json_build_object('success', false, 'error', 'Username cannot be empty.');
  END IF;

  IF LENGTH(p_password) < 4 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 4 characters.');
  END IF;

  IF clean_role NOT IN ('admin', 'staff') THEN
    clean_role := 'staff';
  END IF;

  IF clean_name = '' THEN
    clean_name := clean_uname;
  END IF;

  IF clean_outlet = '' THEN
    clean_outlet := 'Main Branch';
  END IF;

  hashed_pw := crypt(p_password, gen_salt('bf', 8));

  INSERT INTO public.app_users (username, password_hash, display_name, role, outlet)
  VALUES (clean_uname, hashed_pw, clean_name, clean_role, clean_outlet)
  ON CONFLICT (username) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      outlet = EXCLUDED.outlet,
      updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_id,
      'username', clean_uname,
      'displayName', clean_name,
      'role', clean_role,
      'outlet', clean_outlet
    ),
    'message', 'User provisioned successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Change User Password
CREATE OR REPLACE FUNCTION public.app_change_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  hashed_pw TEXT;
BEGIN
  IF LENGTH(p_new_password) < 4 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 4 characters.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found.');
  END IF;

  hashed_pw := crypt(p_new_password, gen_salt('bf', 8));

  UPDATE public.app_users
  SET password_hash = hashed_pw,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete User
CREATE OR REPLACE FUNCTION public.app_delete_user(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_role TEXT;
  admin_count INT;
BEGIN
  SELECT role INTO v_role FROM public.app_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found.');
  END IF;

  IF v_role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.app_users WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RETURN json_build_object('success', false, 'error', 'Cannot delete the only admin user.');
    END IF;
  END IF;

  DELETE FROM public.app_users WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. List All Users (Safe - No password hashes returned)
CREATE OR REPLACE FUNCTION public.app_list_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  role TEXT,
  outlet TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.display_name,
    u.role,
    u.outlet,
    u.created_at,
    u.updated_at
  FROM public.app_users u
  ORDER BY (u.role = 'admin') DESC, u.display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Heartbeat Function for Keep-Alive
CREATE OR REPLACE FUNCTION ping_heartbeat()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO keep_alive_pings (id, last_ping, client_info, ping_count)
  VALUES ('primary_heartbeat', NOW(), 'app_heartbeat', 1)
  ON CONFLICT (id) DO UPDATE
  SET last_ping = NOW(),
      ping_count = keep_alive_pings.ping_count + 1;
  RETURN json_build_object('status', 'ok', 'timestamp', NOW());
END;
$$;

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET FOR ASSETS & LOGOS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access store-assets" ON storage.objects;
CREATE POLICY "Public Access store-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Public Upload store-assets" ON storage.objects;
CREATE POLICY "Public Upload store-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Public Update store-assets" ON storage.objects;
CREATE POLICY "Public Update store-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Public Delete store-assets" ON storage.objects;
CREATE POLICY "Public Delete store-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'store-assets');

-- ==============================================================================
-- 7. INITIAL ADMIN CREATION EXAMPLE (Run in Supabase SQL Editor if needed)
-- ==============================================================================
-- SELECT public.app_create_user('admin', 'admin123456', 'Super Administrator', 'admin', 'All Branches');
