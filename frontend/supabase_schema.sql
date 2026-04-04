-- ShieldMile Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  partner_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  zone TEXT NOT NULL,
  base_weekly_earnings NUMERIC DEFAULT 0,
  upi_id TEXT,
  ncb_streak INTEGER DEFAULT 0,
  auth_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  premium_paid NUMERIC DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  cdi_score INTEGER DEFAULT 0,
  payout_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'processing',
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "object already exists" errors
DROP POLICY IF EXISTS "Allow all for anon" ON workers;
DROP POLICY IF EXISTS "Allow all for anon" ON policies;
DROP POLICY IF EXISTS "Allow all for anon" ON claims;
DROP POLICY IF EXISTS "Allow all for anon" ON admins;

-- Allow all operations for anon role (development only)
CREATE POLICY "Allow all for anon" ON workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON admins FOR ALL USING (true) WITH CHECK (true);