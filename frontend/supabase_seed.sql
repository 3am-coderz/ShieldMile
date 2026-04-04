-- ShieldMile Full Seed Data
-- Run this in Supabase SQL Editor AFTER running supabase_schema.sql

-- ============================================================
-- ADMINS
-- ============================================================
INSERT INTO admins (username, password_hash, full_name, role) VALUES
  ('admin',       'admin123',   'ShieldMile Admin',       'superadmin'),
  ('ops_manager', 'ops2024',    'Operations Manager',     'admin'),
  ('fraud_lead',  'fraud2024',  'Fraud Investigation Lead','admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- WORKERS
-- ============================================================
INSERT INTO workers (name, phone, partner_id, platform, zone, base_weekly_earnings, upi_id, ncb_streak, auth_hash) VALUES
  ('Ramesh Kumar',     '9876543210', 'ZPT-49291', 'Zomato',   'T. Nagar',   5200, 'ramesh@okicici',   3, 'pass123'),
  ('Suresh Babu',      '9123456780', 'BLK-38821', 'Blinkit',  'Velachery',  4800, 'suresh@ybl',       1, 'pass123'),
  ('Anitha Devi',      '9988776655', 'SWG-72910', 'Swiggy',   'Adyar',      6100, 'anitha@paytm',     5, 'pass123'),
  ('Karthik Raj',      '9871234560', 'ZPT-55621', 'Zomato',   'Anna Nagar', 3900, 'karthik@okaxis',   0, 'pass123'),
  ('Priya Lakshmi',    '9765432100', 'UBR-19823', 'Uber',     'OMR',        7200, 'priya@upi',        2, 'pass123'),
  ('Mohammed Ashraf',  '9654321098', 'BLK-29103', 'Blinkit',  'Adyar',      4400, 'ashraf@okicici',   4, 'pass123'),
  ('Divya Menon',      '9543210987', 'DUN-48201', 'Dunzo',    'Velachery',  5500, 'divya@ybl',        0, 'pass123'),
  ('Vijay Anand',      '9432109876', 'SWG-33410', 'Swiggy',   'T. Nagar',   6700, 'vijay@paytm',      6, 'pass123'),
  ('Lakshmi Pradeep',  '9321098765', 'ZPT-11023', 'Zomato',   'OMR',        4100, 'lakshmi@ybl',      2, 'pass123'),
  ('Arun Selvam',      '9210987654', 'UBR-56712', 'Uber',     'Anna Nagar', 8200, 'arun@okicici',     7, 'pass123'),
  ('Meena Sundaram',   '9109876543', 'SWG-84210', 'Swiggy',   'Velachery',  5900, 'meena@paytm',      1, 'pass123'),
  ('Ravi Chandran',    '9098765432', 'BLK-63920', 'Blinkit',  'T. Nagar',   4600, 'ravi@ybl',         3, 'pass123')
ON CONFLICT (partner_id) DO NOTHING;

-- ============================================================
-- POLICIES
-- ============================================================
INSERT INTO policies (worker_id, tier, premium_paid, start_date, end_date, status)
SELECT id, 'Standard', 149, CURRENT_DATE - 15, CURRENT_DATE + 15, 'active' FROM workers WHERE partner_id = 'ZPT-49291' ON CONFLICT DO NOTHING;
INSERT INTO policies (worker_id, tier, premium_paid, start_date, end_date, status)
SELECT id, 'Premium',  249, CURRENT_DATE - 10, CURRENT_DATE + 20, 'active' FROM workers WHERE partner_id = 'BLK-38821' ON CONFLICT DO NOTHING;
INSERT INTO policies (worker_id, tier, premium_paid, start_date, end_date, status)
SELECT id, 'Standard', 149, CURRENT_DATE - 5,  CURRENT_DATE + 25, 'active' FROM workers WHERE partner_id = 'SWG-72910' ON CONFLICT DO NOTHING;
INSERT INTO policies (worker_id, tier, premium_paid, start_date, end_date, status)
SELECT id, 'Basic',     99, CURRENT_DATE - 20, CURRENT_DATE + 10, 'active' FROM workers WHERE partner_id = 'ZPT-55621' ON CONFLICT DO NOTHING;

-- ============================================================
-- CLAIMS
-- ============================================================
INSERT INTO claims (worker_id, trigger_type, cdi_score, payout_amount, status)
SELECT id, 'Heavy Rain', 76, 320, 'approved' FROM workers WHERE partner_id = 'ZPT-49291' ON CONFLICT DO NOTHING;
INSERT INTO claims (worker_id, trigger_type, cdi_score, payout_amount, status)
SELECT id, 'Heavy Rain', 82, 400, 'approved' FROM workers WHERE partner_id = 'BLK-38821' ON CONFLICT DO NOTHING;
INSERT INTO claims (worker_id, trigger_type, cdi_score, payout_amount, status)
SELECT id, 'Heat Wave',  71, 160, 'processing' FROM workers WHERE partner_id = 'ZPT-55621' ON CONFLICT DO NOTHING;
INSERT INTO claims (worker_id, trigger_type, cdi_score, payout_amount, status)
SELECT id, 'Flood',      95, 600, 'flagged' FROM workers WHERE partner_id = 'SWG-72910' ON CONFLICT DO NOTHING;
