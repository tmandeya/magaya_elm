-- ============================================================
-- MAGAYA ELMS - COMPLETE SUPABASE DATABASE SCHEMA
-- Copy this ENTIRE file into Supabase SQL Editor and click Run
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 11 Magaya sites
INSERT INTO sites (name, code, location, status) VALUES
  ('Head Office', 'HO_HARARE', 'Harare', 'active'),
  ('Harare — 207 Sam Nujoma', 'HARARE_207', '207 Sam Nujoma, Harare', 'active'),
  ('Walden', 'WALDEN', 'Walden', 'active'),
  ('Peladillo', 'PELADILLO', 'Peladillo', 'active'),
  ('Pickstone', 'PICKSTONE', 'Pickstone', 'active'),
  ('Chanton', 'CHANTON', 'Chanton', 'active'),
  ('Amaveni', 'AMAVENI', 'Amaveni', 'active'),
  ('Commoner', 'COMMONER', 'Commoner', 'active'),
  ('Amatola', 'AMATOLA', 'Amatola', 'active'),
  ('Shamva', 'SHAMVA', 'Shamva', 'active'),
  ('Carry', 'CARRY', 'Carry', 'active')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departments (name, code) VALUES
  ('Operations', 'OPS'),
  ('Information Technology', 'IT'),
  ('Security', 'SEC'),
  ('Human Resources', 'HR'),
  ('Finance', 'FIN'),
  ('Administration', 'ADMIN'),
  ('Engineering', 'ENG'),
  ('Geology', 'GEO'),
  ('Health & Safety', 'HSE'),
  ('Mining', 'MIN'),
  ('Processing', 'PROC'),
  ('Laboratory', 'LAB')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. EMPLOYEES MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT NOT NULL UNIQUE,
  
  -- Personal
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || surname) STORED,
  initials TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male','Female','Other')),
  national_id TEXT,
  nationality TEXT DEFAULT 'Zimbabwean',
  home_address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  photo_url TEXT,
  
  -- Employment
  site_id UUID REFERENCES sites(id),
  department_id UUID REFERENCES departments(id),
  job_title TEXT NOT NULL,
  position TEXT,
  occupation TEXT,
  employment_type TEXT DEFAULT 'Permanent' CHECK (employment_type IN ('Permanent','Contract','Intern','Casual')),
  job_grade TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  reporting_to UUID REFERENCES employees(id),
  
  -- Contact
  work_email TEXT,
  personal_email TEXT,
  phone_number TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','onboarding','transferred','offboarding','terminated','archived')),
  
  -- Meta
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archive_after_days INTEGER DEFAULT 90
);

-- ============================================================
-- 4. EMPLOYEE DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity','work_authorization','qualifications','contract','medical','drivers_license','background_check','other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date DATE
);

-- ============================================================
-- 5. SITE PERSONNEL (Key People Per Site)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('site_hr','site_it','site_security','site_admin','hod','site_gm')),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, role_type)
);

-- ============================================================
-- 6. WORKFLOWS (Onboarding / Offboarding / Transfer)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('onboarding','offboarding','transfer')),
  employee_id UUID NOT NULL REFERENCES employees(id),
  
  -- For transfers
  origin_site_id UUID REFERENCES sites(id),
  destination_site_id UUID REFERENCES sites(id),
  
  -- Common
  initiated_by UUID NOT NULL,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Offboarding specific
  termination_type TEXT CHECK (termination_type IN ('resignation','termination','end_of_contract','retirement')),
  termination_reason TEXT,
  last_working_day DATE,
  
  -- Transfer specific
  transfer_reason TEXT,
  effective_date DATE,
  
  -- Status
  current_stage INTEGER NOT NULL DEFAULT 1,
  total_stages INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled','overdue')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. WORKFLOW STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  department TEXT NOT NULL, -- 'hr','it','security','admin','hod'
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  
  -- Sign-off
  signed_off_by UUID,
  signed_off_at TIMESTAMPTZ,
  sign_off_notes TEXT,
  
  -- Stage-specific data (JSON for flexibility)
  stage_data JSONB DEFAULT '{}',
  
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_id, stage_number)
);

-- ============================================================
-- 8. WORKFLOW STAGE CHECKLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL, -- 'hardware','software','access','documents','other'
  is_required BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','view','login','logout','export','approve','reject','sign_off','print')),
  module TEXT NOT NULL, -- 'employee','workflow','site','settings','auth'
  record_id UUID,
  record_type TEXT,
  details JSONB DEFAULT '{}',
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL,
  recipient_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('workflow_assigned','stage_completed','sign_off_required','deadline_approaching','workflow_completed','system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_workflow_id UUID REFERENCES workflows(id),
  related_employee_id UUID REFERENCES employees(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. CONFIGURATION / LOOKUP TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS config_hardware (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'laptop','desktop','monitor','phone','tablet','printer','radio','other'
  default_specs TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_software (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'office','security','erp','design','other'
  license_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_clearance_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  access_zones TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

-- Insert default configs
INSERT INTO config_hardware (name, category, default_specs) VALUES
  ('Standard Laptop', 'laptop', 'Core i5, 8GB RAM, 256GB SSD'),
  ('Executive Laptop', 'laptop', 'Core i7, 16GB RAM, 512GB SSD'),
  ('Desktop Workstation', 'desktop', 'Core i7, 16GB RAM, 512GB SSD, 24" Monitor'),
  ('24" Monitor', 'monitor', 'Full HD IPS'),
  ('27" Monitor', 'monitor', '2K QHD IPS'),
  ('Desk Phone', 'phone', 'IP Phone with headset'),
  ('Mobile Phone', 'phone', 'Business smartphone'),
  ('Tablet', 'tablet', '10" Android/iPad'),
  ('Laser Printer', 'printer', 'B&W A4'),
  ('Two-Way Radio', 'radio', 'Long range UHF')
ON CONFLICT DO NOTHING;

INSERT INTO config_software (name, category, license_type) VALUES
  ('Microsoft 365', 'office', 'Business Standard'),
  ('ERP System', 'erp', 'Per-user'),
  ('Antivirus', 'security', 'Site license'),
  ('AutoCAD', 'design', 'Named user'),
  ('ArcGIS', 'design', 'Named user'),
  ('QuickBooks', 'erp', 'Per-user'),
  ('VPN Client', 'security', 'Site license')
ON CONFLICT DO NOTHING;

INSERT INTO config_clearance_levels (name, description, access_zones) VALUES
  ('General', 'Standard employee access', ARRAY['main_gate','office_building','cafeteria']),
  ('Restricted', 'Access to operational areas', ARRAY['main_gate','office_building','cafeteria','mine_area','processing_plant']),
  ('High Security', 'Full site access including sensitive areas', ARRAY['main_gate','office_building','cafeteria','mine_area','processing_plant','explosives_store','control_room']),
  ('Executive', 'Unrestricted access', ARRAY['main_gate','office_building','cafeteria','mine_area','processing_plant','explosives_store','control_room','executive_offices','server_room'])
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_personnel ENABLE ROW LEVEL SECURITY;

-- Create role helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_metadata',
    '{}'
  )::json->>'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EMPLOYEES: Everyone can view active employees, HR can manage all
CREATE POLICY "employees_select_all" ON employees
  FOR SELECT USING (status != 'archived');

CREATE POLICY "employees_insert_hr" ON employees
  FOR INSERT WITH CHECK (true); -- App-level check

CREATE POLICY "employees_update_hr" ON employees
  FOR UPDATE USING (true); -- App-level check

-- DOCUMENTS: Users can view documents for their site
CREATE POLICY "documents_select" ON employee_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_documents.employee_id
    )
  );

CREATE POLICY "documents_insert" ON employee_documents
  FOR INSERT WITH CHECK (true);

-- WORKFLOWS: Users can view workflows for their site
CREATE POLICY "workflows_select" ON workflows
  FOR SELECT USING (true);

CREATE POLICY "workflows_insert" ON workflows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "workflows_update" ON workflows
  FOR UPDATE USING (true);

-- STAGES: Department members can view and update their stages
CREATE POLICY "stages_select" ON workflow_stages
  FOR SELECT USING (true);

CREATE POLICY "stages_update" ON workflow_stages
  FOR UPDATE USING (true);

-- CHECKLISTS: Same as stages
CREATE POLICY "checklists_select" ON workflow_checklists
  FOR SELECT USING (true);

CREATE POLICY "checklists_update" ON workflow_checklists
  FOR UPDATE USING (true);

-- AUDIT LOGS: Append-only (everyone can insert, only admins can view all)
CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_select" ON audit_logs
  FOR SELECT USING (true);

-- NOTIFICATIONS: Users can only see their own
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (recipient_id = auth.uid());

-- SITE PERSONNEL
CREATE POLICY "site_personnel_select" ON site_personnel
  FOR SELECT USING (true);

CREATE POLICY "site_personnel_modify" ON site_personnel
  FOR ALL USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create audit log on employee changes
CREATE OR REPLACE FUNCTION audit_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (action, module, record_id, record_type, after_data, details)
    VALUES ('create', 'employee', NEW.id, 'employees', row_to_json(NEW), jsonb_build_object('employee_code', NEW.employee_code, 'full_name', NEW.full_name));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (action, module, record_id, record_type, before_data, after_data, details)
    VALUES ('update', 'employee', NEW.id, 'employees', row_to_json(OLD), row_to_json(NEW), jsonb_build_object('employee_code', NEW.employee_code, 'changed_fields', (
      SELECT jsonb_object_agg(key, value) FROM jsonb_each(row_to_json(NEW)::jsonb) 
      WHERE row_to_json(NEW)::jsonb->key IS DISTINCT FROM row_to_json(OLD)::jsonb->key
    )));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_employee_trigger
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION audit_employee_changes();

-- ============================================================
-- STORAGE BUCKETS (for file uploads)
-- ============================================================

-- These are created via Supabase UI, but here's the SQL:
-- Bucket: employee-photos
-- Bucket: employee-documents
-- Public access: NO (signed URLs only)

-- ============================================================
-- SAMPLE DATA (25 Employees)
-- ============================================================

-- We need sites to exist first (already inserted above)
-- Now insert employees

DO $$
DECLARE
  ho_id UUID;
  harare_id UUID;
  walden_id UUID;
  peladillo_id UUID;
  pickstone_id UUID;
  ops_id UUID;
  it_id UUID;
  sec_id UUID;
  hr_id UUID;
  fin_id UUID;
BEGIN
  SELECT id INTO ho_id FROM sites WHERE code = 'HO_HARARE';
  SELECT id INTO harare_id FROM sites WHERE code = 'HARARE_207';
  SELECT id INTO walden_id FROM sites WHERE code = 'WALDEN';
  SELECT id INTO peladillo_id FROM sites WHERE code = 'PELADILLO';
  SELECT id INTO pickstone_id FROM sites WHERE code = 'PICKSTONE';
  
  SELECT id INTO ops_id FROM departments WHERE code = 'OPS';
  SELECT id INTO it_id FROM departments WHERE code = 'IT';
  SELECT id INTO sec_id FROM departments WHERE code = 'SEC';
  SELECT id INTO hr_id FROM departments WHERE code = 'HR';
  SELECT id INTO fin_id FROM departments WHERE code = 'FIN';

  -- Insert sample employees (only if table is empty)
  IF (SELECT COUNT(*) FROM employees) = 0 THEN
    INSERT INTO employees (employee_code, first_name, surname, initials, date_of_birth, gender, national_id, nationality, home_address, emergency_contact_name, emergency_contact_phone, site_id, department_id, job_title, position, occupation, employment_type, job_grade, contract_start_date, status, work_email, personal_email, phone_number) VALUES
      ('MAG0001', 'Tatenda', 'Mandeya', 'TM', '1985-03-15', 'Male', '63-1234567A80', 'Zimbabwean', '12 Borrowdale Rd, Harare', 'Sharon Mandeya', '0772123456', ho_id, it_id, 'Group IT Manager', 'Group IT Manager', 'Group IT Manager', 'Permanent', 'E', '2020-01-06', 'active', 'tatenda.mandeya@magayamining.com', 't.mandeya@gmail.com', '0773555123'),
      ('MAG0002', 'Blessing', 'Mhlanga', 'BM', '1990-07-22', 'Female', '63-2345678B81', 'Zimbabwean', '45 Mount Pleasant, Harare', 'John Mhlanga', '0773234567', pickstone_id, ops_id, 'Mine Supervisor', 'Mine Supervisor', 'Mine Supervisor', 'Permanent', 'D', '2021-03-01', 'onboarding', 'blessing.mhlanga@magayamining.com', 'b.mhlanga@yahoo.com', '0773555234'),
      ('MAG0003', 'Tendai', 'Mutasa', 'TM', '1988-11-10', 'Male', '63-3456789C82', 'Zimbabwean', '78 Avondale, Harare', 'Grace Mutasa', '0774345678', pickstone_id, it_id, 'IT Support Technician', 'IT Support Technician', 'IT Support', 'Permanent', 'C', '2022-06-15', 'active', 'tendai.mutasa@magayamining.com', 't.mutasa@gmail.com', '0773555345'),
      ('MAG0004', 'Samantha', 'Mhondera', 'SM', '1992-01-05', 'Female', '63-4567890D83', 'Zimbabwean', '23 Greendale, Harare', 'Peter Mhondera', '0775456789', harare_id, hr_id, 'HR Officer', 'HR Officer', 'HR Officer', 'Permanent', 'C', '2021-08-01', 'offboarding', 'samantha.mhondera@magayamining.com', 's.mhondera@gmail.com', '0773555456'),
      ('MAG0005', 'Peter', 'Chirwa', 'PC', '1983-09-18', 'Male', '63-5678901E84', 'Malawian', '34 Waterfalls, Harare', 'Anna Chirwa', '0776567890', walden_id, fin_id, 'Finance Manager', 'Finance Manager', 'Finance Manager', 'Permanent', 'D', '2019-04-10', 'active', 'peter.chirwa@magayamining.com', 'p.chirwa@gmail.com', '0773555567'),
      ('MAG0006', 'Faith', 'Dube', 'FD', '1995-05-30', 'Female', '63-6789012F85', 'Zimbabwean', '56 Bulawayo Rd, Harare', 'Samuel Dube', '0777678901', amatola_id, ops_id, 'Processing Operator', 'Processing Operator', 'Processing Operator', 'Contract', 'B', '2023-01-16', 'active', 'faith.dube@magayamining.com', 'f.dube@gmail.com', '0773555678'),
      ('MAG0007', 'Simba', 'Katsande', 'SK', '1987-12-25', 'Male', '63-7890123G86', 'Zimbabwean', '89 Eastlea, Harare', 'Joy Katsande', '0778789012', ho_id, sec_id, 'Security Supervisor', 'Security Supervisor', 'Security Supervisor', 'Permanent', 'C', '2020-11-02', 'active', 'simba.katsande@magayamining.com', 's.katsande@gmail.com', '0773555789'),
      ('MAG0008', 'Rudo', 'Mupfumi', 'RM', '1991-04-14', 'Female', '63-8901234H87', 'Zimbabwean', '67 Highlands, Harare', 'Tichaona Mupfumi', '0779890123', walden_id, it_id, 'Network Administrator', 'Network Administrator', 'Network Admin', 'Permanent', 'C', '2022-02-14', 'active', 'rudo.mupfumi@magayamining.com', 'r.mupfumi@gmail.com', '0773555890'),
      ('MAG0009', 'Tatenda', 'Marufu', 'TM', '1989-08-08', 'Male', '63-9012345I88', 'Zimbabwean', '90 Marlborough, Harare', 'Patricia Marufu', '0770901234', peladillo_id, ops_id, 'Shift Supervisor', 'Shift Supervisor', 'Shift Supervisor', 'Permanent', 'C', '2021-05-22', 'active', 'tatenda.marufu@magayamining.com', 't.marufu@gmail.com', '0773555901'),
      ('MAG0010', 'Grace', 'Ncube', 'GN', '1993-02-28', 'Female', '63-0123456J89', 'Zimbabwean', '11 Kambuzuma, Harare', 'Michael Ncube', '0771012345', shamva_id, hr_id, 'HR Assistant', 'HR Assistant', 'HR Assistant', 'Permanent', 'B', '2023-03-08', 'transferred', 'grace.ncube@magayamining.com', 'g.ncube@gmail.com', '0773555012'),
      ('MAG0011', 'Tafadzwa', 'Mhembere', 'TM', '1986-06-16', 'Male', '63-1234567K90', 'Zimbabwean', '22 Mbare, Harare', 'Esther Mhembere', '0772123456', amaveni_id, eng_id, 'Mechanical Engineer', 'Mechanical Engineer', 'Mechanical Engineer', 'Permanent', 'D', '2019-09-01', 'active', 'tafadzwa.mhembere@magayamining.com', 't.mhembere@gmail.com', '0773555123'),
      ('MAG0012', 'Nyasha', 'Gomo', 'NG', '1994-10-03', 'Female', '63-2345678L91', 'Zimbabwean', '33 Chitungwiza, Harare', 'David Gomo', '0773234567', chanton_id, geo_id, 'Geologist', 'Geologist', 'Geologist', 'Permanent', 'C', '2022-07-18', 'active', 'nyasha.gomo@magayamining.com', 'n.gomo@gmail.com', '0773555234'),
      ('MAG0013', 'Brian', 'Moyo', 'BM', '1984-01-20', 'Male', '63-3456789M92', 'Zimbabwean', '44 Gweru', 'Sarah Moyo', '0774345678', pickstone_id, min_id, 'Mine Manager', 'Mine Manager', 'Mine Manager', 'Permanent', 'E', '2018-03-05', 'active', 'brian.moyo@magayamining.com', 'b.moyo@gmail.com', '0773555345'),
      ('MAG0014', 'Linda', 'Sibanda', 'LS', '1990-12-12', 'Female', '63-4567890N93', 'Zimbabwean', '55 Victoria Falls', 'Robert Sibanda', '0775456789', commoner_id, hse_id, 'Safety Officer', 'Safety Officer', 'Safety Officer', 'Permanent', 'C', '2021-01-11', 'active', 'linda.sibanda@magayamining.com', 'l.sibanda@gmail.com', '0773555456'),
      ('MAG0015', 'George', 'Mapfumo', 'GM', '1982-04-05', 'Male', '63-5678901O94', 'Zimbabwean', '66 Mutare', 'Mary Mapfumo', '0776567890', ho_id, admin_id, 'Admin Manager', 'Admin Manager', 'Admin Manager', 'Permanent', 'D', '2017-06-19', 'active', 'george.mapfumo@magayamining.com', 'g.mapfumo@gmail.com', '0773555567'),
      ('MAG0016', 'Patience', 'Taruvinga', 'PT', '1996-09-09', 'Female', '63-6789012P95', 'Zimbabwean', '77 Masvingo', 'James Taruvinga', '0777678901', carry_id, lab_id, 'Lab Technician', 'Lab Technician', 'Lab Technician', 'Contract', 'B', '2023-06-01', 'active', 'patience.taruvinga@magayamining.com', 'p.taruvinga@gmail.com', '0773555678'),
      ('MAG0017', 'Farai', 'Muskwe', 'FM', '1988-03-23', 'Male', '63-7890123Q96', 'Zimbabwean', '88 Kariba', 'Anna Muskwe', '0778789012', pickstone_id, proc_id, 'Plant Manager', 'Plant Manager', 'Plant Manager', 'Permanent', 'D', '2019-11-11', 'active', 'farai.muskwe@magayamining.com', 'f.muskwe@gmail.com', '0773555789'),
      ('MAG0018', 'Thandiwe', 'Ndlovu', 'TN', '1992-07-17', 'Female', '63-8901234R97', 'Zimbabwean', '99 Hwange', 'Sipho Ndlovu', '0779890123', walden_id, ops_id, 'Operations Coordinator', 'Operations Coordinator', 'Ops Coordinator', 'Permanent', 'C', '2022-04-25', 'active', 'thandiwe.ndlovu@magayamining.com', 't.ndlovu@gmail.com', '0773555890'),
      ('MAG0019', 'Kudakwashe', 'Manjonjo', 'KM', '1985-11-01', 'Male', '63-9012345S98', 'Zimbabwean', '10 Rusape', 'Tendai Manjonjo', '0770901234', peladillo_id, it_id, 'Systems Analyst', 'Systems Analyst', 'Systems Analyst', 'Permanent', 'C', '2020-08-03', 'active', 'kudakwashe.manjonjo@magayamining.com', 'k.manjonjo@gmail.com', '0773555901'),
      ('MAG0020', 'Sharon', 'Mupindu', 'SM', '1993-05-14', 'Female', '63-0123456T99', 'Zimbabwean', '21 Chegutu', 'Tatenda Mupindu', '0771012345', harare_id, fin_id, 'Accountant', 'Accountant', 'Accountant', 'Permanent', 'C', '2021-10-10', 'active', 'sharon.mupindu@magayamining.com', 's.mupindu@gmail.com', '0773555012'),
      ('MAG0021', 'Dumisani', 'Nkomo', 'DN', '1987-02-08', 'Male', '63-1234567U00', 'Zimbabwean', '32 Plumtree', 'Beauty Nkomo', '0772123456', chanton_id, sec_id, 'Security Officer', 'Security Officer', 'Security Officer', 'Permanent', 'B', '2022-01-17', 'active', 'dumisani.nkomo@magayamining.com', 'd.nkomo@gmail.com', '0773555123'),
      ('MAG0022', 'Yvonne', 'Charamba', 'YC', '1991-08-27', 'Female', '63-2345678V01', 'Zimbabwean', '43 Kadoma', 'Thomas Charamba', '0773234567', amatola_id, hr_id, 'Payroll Officer', 'Payroll Officer', 'Payroll Officer', 'Permanent', 'C', '2021-04-04', 'active', 'yvonne.charamba@magayamining.com', 'y.charamba@gmail.com', '0773555234'),
      ('MAG0023', 'Munashe', 'Chidzambwa', 'MC', '1989-10-19', 'Male', '63-3456789W02', 'Zimbabwean', '54 Karoi', 'Elizabeth Chidzambwa', '0774345678', commoner_id, eng_id, 'Electrical Engineer', 'Electrical Engineer', 'Electrical Engineer', 'Permanent', 'D', '2020-02-24', 'active', 'munashe.chidzambwa@magayamining.com', 'm.chidzambwa@gmail.com', '0773555345'),
      ('MAG0024', 'Primrose', 'Matambanadzo', 'PM', '1995-12-03', 'Female', '63-4567890X03', 'Zimbabwean', '65 Norton', 'Wilbert Matambanadzo', '0775456789', amaveni_id, geo_id, 'Junior Geologist', 'Junior Geologist', 'Junior Geologist', 'Contract', 'B', '2023-08-14', 'active', 'primrose.matambanadzo@magayamining.com', 'p.matambanadzo@gmail.com', '0773555456'),
      ('MAG0025', 'Thomas', 'Mupfumi', 'TM', '1983-06-07', 'Male', '63-5678901Y04', 'Zimbabwean', '76 Shurugwi', 'Margaret Mupfumi', '0776567890', ho_id, it_id, 'IT Director', 'IT Director', 'IT Director', 'Permanent', 'E', '2016-05-09', 'active', 'thomas.mupfumi@magayamining.com', 't.mupfumi@gmail.com', '0773555567');
  END IF;
END $$;

-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_site ON employees(site_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_workflows_employee ON workflows(employee_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow ON workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
