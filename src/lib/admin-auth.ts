import { createClient } from '@supabase/supabase-js';
import { Admin } from '@/types/career';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Admin client with service role for user management
export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, import.meta.env.VITE_SUPABASE_ANON_KEY);

export interface CreateRecruiterData {
  email: string;
  password: string;
  name: string;
}

export const adminAuthService = {
  // Admin login (separate from recruiter login)
  async adminSignIn(email: string, password: string): Promise<Admin | null> {
    try {
      console.log('Admin sign in attempt for:', email);
      
      // Get admin user from database
      const { data: profile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('role', 'admin') // Only allow admin role
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      if (!profile) {
        console.log('No admin profile found for email:', email);
        return null;
      }

      // Check password (simplified for demo - in production use proper hashing)
      const isValidPassword = password === profile.password_hash;
      
      if (!isValidPassword) {
        console.log('Invalid password for admin:', email);
        return null;
      }

      console.log('Admin authentication successful for:', email);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || 'Admin User',
        role: profile.role,
        createdAt: profile.created_at,
      };
    } catch (error) {
      console.error('Admin sign in error:', error);
      return null;
    }
  },

  // Recruiter login (separate from admin login)
  async recruiterSignIn(email: string, password: string): Promise<Admin | null> {
    try {
      console.log('Recruiter sign in attempt for:', email);
      
      // Get recruiter user from database
      const { data: profile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('role', 'recruiter') // Only allow recruiter role
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      if (!profile) {
        console.log('No recruiter profile found for email:', email);
        return null;
      }

      // Check password
      const isValidPassword = password === profile.password_hash;
      
      if (!isValidPassword) {
        console.log('Invalid password for recruiter:', email);
        return null;
      }

      console.log('Recruiter authentication successful for:', email);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || 'Recruiter',
        role: profile.role,
        createdAt: profile.created_at,
      };
    } catch (error) {
      console.error('Recruiter sign in error:', error);
      return null;
    }
  },

  // Create recruiter account (admin only)
  async createRecruiter(data: CreateRecruiterData): Promise<boolean> {
    try {
      console.log('Creating recruiter account:', data.email);

      // First, create the auth user using Supabase Admin API
      const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Skip email confirmation
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return false;
      }

      console.log('Auth user created:', authUser.user.id);

      // Then create the profile in admin_users table
      const { error: profileError } = await supabase
        .from('admin_users')
        .insert([
          {
            id: authUser.user.id,
            email: data.email,
            password_hash: data.password, // In production, hash this
            name: data.name,
            role: 'recruiter',
            is_active: true,
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Clean up auth user if profile creation fails
        await adminSupabase.auth.admin.deleteUser(authUser.user.id);
        return false;
      }

      console.log('Recruiter created successfully');
      return true;
    } catch (error) {
      console.error('Error creating recruiter:', error);
      return false;
    }
  },

  // Get all recruiters (admin only)
  async getRecruiters(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'recruiter')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recruiters:', error);
        return [];
      }

      return (data || []).map((recruiter: any) => ({
        id: recruiter.id,
        email: recruiter.email,
        name: recruiter.name || 'Recruiter',
        role: recruiter.role,
        createdAt: recruiter.created_at,
        isActive: recruiter.is_active,
      }));
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      return [];
    }
  },

  // Deactivate recruiter (admin only)
  async deactivateRecruiter(recruiterId: string): Promise<boolean> {
    try {
      console.log('Deactivating recruiter:', recruiterId);

      // Deactivate in database
      const { error: dbError } = await supabase
        .from('admin_users')
        .update({ is_active: false })
        .eq('id', recruiterId)
        .eq('role', 'recruiter');

      if (dbError) {
        console.error('Error deactivating recruiter in database:', dbError);
        return false;
      }

      // Optionally, you can also delete the auth user
      // const { error: authError } = await adminSupabase.auth.admin.deleteUser(recruiterId);
      // if (authError) {
      //   console.error('Error deleting auth user:', authError);
      // }

      console.log('Recruiter deactivated successfully');
      return true;
    } catch (error) {
      console.error('Error deactivating recruiter:', error);
      return false;
    }
  },

  // Reset recruiter password (admin only)
  async resetRecruiterPassword(email: string): Promise<boolean> {
    try {
      console.log('Resetting password for:', email);

      const { error } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (error) {
        console.error('Error generating reset link:', error);
        return false;
      }

      console.log('Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  },

  // Check if current user is admin
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const stored = localStorage.getItem('admin_user');
      if (!stored) return false;

      const user = JSON.parse(stored);
      return user.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Get current user with role verification
  async getCurrentUser(): Promise<Admin | null> {
    try {
      const stored = localStorage.getItem('admin_user');
      if (!stored) return null;

      const user = JSON.parse(stored);
      
      // Verify user still exists and is active
      const { data: profile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !profile) {
        localStorage.removeItem('admin_user');
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || 'User',
        role: profile.role,
        createdAt: profile.created_at,
        isActive: profile.is_active,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    localStorage.removeItem('admin_user');
  },
};