# Admin-Only Recruiter Management System

## Overview
This implementation creates a secure, admin-controlled recruiter management system where:
- **No public signup** - Only admins can create recruiter accounts
- **Role-based access control** - Admins have full access, recruiters have limited access
- **Secure authentication** - Separate login flows for admins and recruiters

## Key Features

### 1. Authentication Flow
- **Admin Login**: `/admin/login` - Only for users with `admin` role
- **Recruiter Login**: `/login` - Only for users with `recruiter` role
- **No Public Signup** - Signup functionality completely removed

### 2. Admin Capabilities
- Create new recruiter accounts via Supabase Admin API
- View and manage all recruiter accounts
- Deactivate recruiter accounts
- Reset recruiter passwords via email
- Full access to all system features

### 3. Recruiter Limitations
- Cannot create other accounts
- Cannot access admin-only features
- Cannot modify their own role
- Limited to job and applicant management

### 4. Database Security
- **Row Level Security (RLS)** enabled on all tables
- **Role-based policies** ensure data isolation
- **Function-based checks** for admin verification
- **Constraint checks** prevent role escalation

## File Structure

```
src/
├── lib/
│   ├── admin-auth.ts          # Admin authentication & user management
│   └── auth.ts                # Backward compatibility wrapper
├── components/admin/
│   ├── AdminProtectedRoute.tsx # Route protection with role checks
│   ├── CreateRecruiterForm.tsx # Form for creating recruiters
│   ├── RecruiterManagement.tsx # Recruiter management interface
│   └── AdminLayout.tsx         # Updated with role-based navigation
├── pages/
│   ├── RecruiterLogin.tsx      # Separate recruiter login page
│   └── admin/
│       ├── AdminLogin.tsx      # Admin-only login (simplified)
│       ├── AdminDashboard.tsx  # Updated with admin controls
│       └── AdminRecruiterManagement.tsx # Recruiter management page
└── types/
    └── career.ts              # Updated with role types
```

## Security Implementation

### Database Policies
```sql
-- Only admins can create users
CREATE POLICY "Only admins can create users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Recruiters can only read their own data
CREATE POLICY "Recruiters can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND role = 'recruiter' AND is_active = true);
```

### Role Verification Functions
```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage Guide

### For System Administrators:
1. **Login**: Use `/admin/login` with admin credentials
2. **Create Recruiters**: Navigate to "Manage Recruiters" → "Add Recruiter"
3. **Manage Accounts**: View, deactivate, or reset passwords for recruiters
4. **Monitor System**: Access all features and data

### For Recruiters:
1. **Login**: Use `/login` with provided credentials
2. **Limited Access**: Can manage jobs and applicants only
3. **No User Management**: Cannot create or modify accounts
4. **Password Reset**: Contact admin or use self-service reset

## Security Best Practices Implemented

1. **Principle of Least Privilege**: Recruiters only get necessary permissions
2. **Defense in Depth**: Multiple layers of security (RLS, functions, client-side checks)
3. **Audit Trail**: All actions logged and traceable
4. **Secure Defaults**: Accounts created as inactive until explicitly activated
5. **Role Immutability**: Users cannot escalate their own privileges

## Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Default Admin Account
- **Email**: admin@mangosorange.com
- **Password**: admin123
- **Role**: admin

**Important**: Change the default password immediately in production!

## Next Steps
1. Run the migration to set up the database schema
2. Update environment variables with service role key
3. Test the admin login and recruiter creation flow
4. Customize the UI and add additional admin features as needed