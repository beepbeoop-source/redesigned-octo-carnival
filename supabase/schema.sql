-- ==============================================================================
-- SAFE & SECURE SUPABASE SCHEMA: SUPABASE NATIVE AUTH + STRICT RLS POLICIES
-- ==============================================================================
-- This schema secures all business and staff data with Row Level Security (RLS).
-- Only authenticated users can access attendance and payroll records.
-- Heartbeat / Keep-alive table & function remain public so UptimeRobot pings work.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. USER PROFILES TABLE (Linked to Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Staff Member',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  outlet TEXT NOT NULL DEFAULT 'Main Branch',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Legacy compatibility table view/table if needed
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL DEFAULT 'Staff Member',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  outlet TEXT NOT NULL DEFAULT 'Main Branch',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 7. Keep-Alive & Heartbeat Table (Always Public for Uptime Monitoring)
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

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

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

-- Automatically create / sync public.user_profiles whenever an auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_name TEXT;
  v_role TEXT;
  v_outlet TEXT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', v_username);
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'staff');
  v_outlet := COALESCE(NEW.raw_user_meta_data->>'outlet', 'Main Branch');

  INSERT INTO public.user_profiles (id, username, display_name, role, outlet)
  VALUES (NEW.id, LOWER(v_username), v_name, v_role, v_outlet)
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      outlet = EXCLUDED.outlet,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 4. STRICT ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_pings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. User Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public app_users select safe" ON public.app_users;
DROP POLICY IF EXISTS "Public app_users insert" ON public.app_users;
DROP POLICY IF EXISTS "Public app_users update" ON public.app_users;
DROP POLICY IF EXISTS "Public app_users delete" ON public.app_users;

DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users view profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- B. Business Data Policies (Locked to Authenticated Users)
-- ------------------------------------------------------------------------------
-- Staff Master
DROP POLICY IF EXISTS "Public staff all" ON staff;
DROP POLICY IF EXISTS "Authenticated staff all" ON staff;
CREATE POLICY "Authenticated staff all"
  ON staff FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Attendance Records
DROP POLICY IF EXISTS "Public attendance all" ON attendance;
DROP POLICY IF EXISTS "Authenticated attendance all" ON attendance;
CREATE POLICY "Authenticated attendance all"
  ON attendance FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Overtime Records
DROP POLICY IF EXISTS "Public overtime all" ON overtime;
DROP POLICY IF EXISTS "Authenticated overtime all" ON overtime;
CREATE POLICY "Authenticated overtime all"
  ON overtime FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Cash Advances
DROP POLICY IF EXISTS "Public advances all" ON advances;
DROP POLICY IF EXISTS "Authenticated advances all" ON advances;
CREATE POLICY "Authenticated advances all"
  ON advances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Daily Wage Overrides
DROP POLICY IF EXISTS "Public daily_wages all" ON daily_wages;
DROP POLICY IF EXISTS "Authenticated daily_wages all" ON daily_wages;
CREATE POLICY "Authenticated daily_wages all"
  ON daily_wages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Store Profile & Settings
DROP POLICY IF EXISTS "Public store_profile all" ON store_profile;
DROP POLICY IF EXISTS "Public read store_profile" ON store_profile;
DROP POLICY IF EXISTS "Authenticated write store_profile" ON store_profile;

-- Public can read store branding for login view
CREATE POLICY "Public read store_profile"
  ON store_profile FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can update store branding
CREATE POLICY "Authenticated write store_profile"
  ON store_profile FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- C. KEEP-ALIVE & HEARTBEAT (OPEN TO ANON & UPTIMEROBOT)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public keep_alive all" ON keep_alive_pings;
CREATE POLICY "Public keep_alive all"
  ON keep_alive_pings FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 5. SECURE RPC FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- 1. Heartbeat Function for Keep-Alive (Callable by UptimeRobot anonymously)
CREATE OR REPLACE FUNCTION ping_heartbeat()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO keep_alive_pings (id, last_ping, client_info, ping_count)
  VALUES ('primary_heartbeat', NOW(), 'uptime_robot_heartbeat', 1)
  ON CONFLICT (id) DO UPDATE
  SET last_ping = NOW(),
      ping_count = keep_alive_pings.ping_count + 1;
  RETURN json_build_object('status', 'ok', 'timestamp', NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION ping_heartbeat() TO anon, authenticated;

-- 2. Admin Create User Account in Supabase Auth
CREATE OR REPLACE FUNCTION public.admin_create_app_user(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'staff',
  p_outlet TEXT DEFAULT 'Main Branch'
)
RETURNS JSON AS $$
DECLARE
  v_caller_role TEXT;
  v_email TEXT;
  v_user_id UUID;
  clean_uname TEXT;
  clean_name TEXT;
  clean_role TEXT;
  clean_outlet TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized. Only administrators can create users.');
  END IF;

  clean_uname := LOWER(TRIM(p_username));
  clean_name := TRIM(p_name);
  clean_role := LOWER(TRIM(p_role));
  clean_outlet := TRIM(p_outlet);

  IF clean_uname = '' THEN
    RETURN json_build_object('success', false, 'error', 'Username cannot be empty.');
  END IF;

  IF LENGTH(p_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  IF clean_role NOT IN ('admin', 'staff') THEN
    clean_role := 'staff';
  END IF;

  IF clean_name = '' THEN
    clean_name := clean_uname;
  END IF;

  v_email := clean_uname || '@hotelbilal.app';

  -- Check if user already exists
  SELECT id INTO v_user_id FROM public.user_profiles WHERE username = clean_uname;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'A user with this username already exists.');
  END IF;

  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('username', clean_uname, 'display_name', clean_name, 'role', clean_role, 'outlet', clean_outlet)::jsonb,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user_id,
      'username', clean_uname,
      'displayName', clean_name,
      'role', clean_role,
      'outlet', clean_outlet
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_app_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Admin Reset Any User's Password
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Only admins can reset passwords.');
  END IF;

  IF LENGTH(p_new_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Password reset successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;

-- 4. Admin Delete User Account
CREATE OR REPLACE FUNCTION public.admin_delete_app_user(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_caller_role TEXT;
  v_target_role TEXT;
  admin_count INT;
BEGIN
  SELECT role INTO v_caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete your own active administrator account.');
  END IF;

  SELECT role INTO v_target_role FROM public.user_profiles WHERE id = p_user_id;
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.user_profiles WHERE role = 'admin';
    IF admin_count <= 1 THEN
      RETURN json_build_object('success', false, 'error', 'Cannot delete the only administrator.');
    END IF;
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
  DELETE FROM public.user_profiles WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_app_user(UUID) TO authenticated;

-- 5. List All Users (Safe)
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
    p.id,
    p.username,
    p.display_name,
    p.role,
    p.outlet,
    p.created_at,
    p.updated_at
  FROM public.user_profiles p
  ORDER BY (p.role = 'admin') DESC, p.display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.app_list_users() TO authenticated;

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
DROP POLICY IF EXISTS "Authenticated Upload store-assets" ON storage.objects;
CREATE POLICY "Authenticated Upload store-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Public Update store-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update store-assets" ON storage.objects;
CREATE POLICY "Authenticated Update store-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Public Delete store-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete store-assets" ON storage.objects;
CREATE POLICY "Authenticated Delete store-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-assets');

-- ==============================================================================
-- 7. INITIAL ADMIN CREATION HELPER FUNCTION
-- ==============================================================================
-- Run this once in the Supabase SQL Editor if you need to create your initial admin account:
--
-- CREATE OR REPLACE FUNCTION public.seed_admin_account(
--   p_username TEXT,
--   p_password TEXT,
--   p_name TEXT
-- )
-- RETURNS JSON AS $$
-- DECLARE
--   v_email TEXT;
--   v_user_id UUID;
-- BEGIN
--   v_email := LOWER(TRIM(p_username)) || '@hotelbilal.app';
--   INSERT INTO auth.users (
--     instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
--     raw_app_meta_data, raw_user_meta_data, created_at, updated_at
--   )
--   VALUES (
--     '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
--     v_email, crypt(p_password, gen_salt('bf')), NOW(),
--     '{"provider":"email","providers":["email"]}'::jsonb,
--     json_build_object('username', LOWER(TRIM(p_username)), 'display_name', TRIM(p_name), 'role', 'admin', 'outlet', 'All Branches')::jsonb,
--     NOW(), NOW()
--   )
--   RETURNING id INTO v_user_id;
--   RETURN json_build_object('success', true, 'id', v_user_id);
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- Example execution:
-- SELECT public.seed_admin_account('admin', 'admin123456', 'Super Administrator');
