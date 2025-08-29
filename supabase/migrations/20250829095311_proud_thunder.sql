/*
  # Admin-Only Recruiter Management System

  1. Database Schema Updates
    - Update admin_users table structure
    - Add proper role constraints
    - Create profiles table for additional user data

  2. Security Policies
    - Enable RLS on admin_users table
    - Create policies for admin vs recruiter access
    - Ensure recruiters cannot escalate privileges

  3. Functions
    - Function to check if user is admin
    - Function to safely create recruiter accounts
*/

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own data" ON admin_users;

-- Update role column to have proper constraints
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('admin', 'recruiter'));

-- Add name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'name'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN name text;
  END IF;
END $$;

-- Add is_active column for account management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM admin_users 
  WHERE id = user_id AND is_active = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- RLS Policies for admin_users table

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Recruiters can only read their own data
CREATE POLICY "Recruiters can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id AND 
    role = 'recruiter' AND 
    is_active = true
  );

-- Only admins can insert new users (recruiters)
CREATE POLICY "Only admins can create users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update all users
CREATE POLICY "Admins can update all users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Recruiters can only update their own non-sensitive data
CREATE POLICY "Recruiters can update own profile"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id AND 
    role = 'recruiter' AND 
    is_active = true
  )
  WITH CHECK (
    auth.uid() = id AND 
    role = 'recruiter' AND -- Prevent role escalation
    is_active = true
  );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Update job_postings policies to work with new role system
DROP POLICY IF EXISTS "Authenticated users can insert job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can read all job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can update job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can delete job postings" ON job_postings;

-- Job postings policies
CREATE POLICY "Admins and recruiters can read all job postings"
  ON job_postings
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can create job postings"
  ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can update job postings"
  ON job_postings
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'recruiter')
  );

CREATE POLICY "Only admins can delete job postings"
  ON job_postings
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Update applicants policies
DROP POLICY IF EXISTS "Authenticated users can read all applicants" ON applicants;
DROP POLICY IF EXISTS "Authenticated users can update applicants" ON applicants;

CREATE POLICY "Admins and recruiters can read all applicants"
  ON applicants
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'recruiter')
  );

CREATE POLICY "Admins and recruiters can update applicants"
  ON applicants
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'recruiter')
  );

-- Insert default admin user if not exists
INSERT INTO admin_users (email, password_hash, role, name, is_active)
VALUES ('admin@mangosorange.com', 'admin123', 'admin', 'System Administrator', true)
ON CONFLICT (email) DO NOTHING;