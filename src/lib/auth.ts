import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Admin } from '@/types/career';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {
  async signIn(email: string, password: string): Promise<Admin | null> {
    try {
      console.log('Attempting sign in for:', email);
      
      // Get admin user from database
      const { data: profile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      if (!profile) {
        console.log('No profile found for email:', email);
        return null;
      }

      console.log('Found profile:', { id: profile.id, email: profile.email, role: profile.role });

      // For the default admin user, check if it's the plain text password
      // The migration stores 'admin123' as plain text for the default user
      let isValidPassword = false;
      
      
      if (profile.email === 'admin@mangosorange.com' && password === 'admin123') {
        // Default admin user with plain text password
        isValidPassword = true;
        console.log('Default admin login successful');
      } else {
        // For other users, use bcrypt comparison
        try {
          isValidPassword = await bcrypt.compare(password, profile.password_hash);
          console.log('Bcrypt comparison result:', isValidPassword);
        } catch (error) {
          // If bcrypt fails, try plain text comparison as fallback
          isValidPassword = password === profile.password_hash;
          console.log('Plain text comparison result:', isValidPassword);
        }
      }
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return null;
      }

      console.log('Authentication successful for:', email);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || 'Admin User',
        role: profile.role,
        createdAt: profile.created_at,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return null;
    }
  },

  async signUp(email: string, password: string, role: 'Admin' | 'Recruiter' = 'Recruiter'): Promise<Admin | null> {
    try {
      // Create admin profile directly in database
      const password_hash = await bcrypt.hash(password, 10);
      console.log(password);
      console.log(password_hash);
      const { data: profile, error } = await supabase
        .from('admin_users')
        .insert([
          {
            email,
            password_hash, // In production, hash this properly
            role,
            // name: email.split('@')[0], // Use email prefix as default name
          }
        ])
        .select('id, email, role')
        .single();

      if (error) throw error;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || 'User',
        role: profile.role,
        createdAt: profile.created_at,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return null;
    }
  },

  async signOut(): Promise<void> {
    // Clear any stored session data
    localStorage.removeItem('admin_user');
  },

  async getCurrentUser(): Promise<Admin | null> {
    try {
      // Check for stored session
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async resetPassword(email: string): Promise<boolean> {
    try {
      // For now, just return true as if email was sent
      // In production, implement proper password reset
      console.log('Password reset requested for:', email);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  },
};