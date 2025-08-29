import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuthService } from '@/lib/admin-auth';
import { Admin } from '@/types/career';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // If true, only admins can access
}

const AdminProtectedRoute = ({ children, requireAdmin = false }: AdminProtectedRouteProps) => {
  const [user, setUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await adminAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // No user logged in - redirect to appropriate login
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    // User is not admin but admin access required
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;