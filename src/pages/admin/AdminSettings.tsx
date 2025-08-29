import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAuthService } from '@/lib/admin-auth';
import { useState, useEffect } from 'react';
import { Settings, Users, Shield, Bell, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await adminAuthService.isCurrentUserAdmin();
    setIsAdmin(adminStatus);
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const user = await adminAuthService.getCurrentUser();
      if (user) {
        const success = await adminAuthService.resetRecruiterPassword(user.email);
        if (success) {
          toast.success('Password reset email sent to your email address');
        } else {
          toast.error('Failed to send reset email');
        }
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-gray-800">
            Manage your admin panel configuration
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Password Reset</h4>
                <p className="text-sm text-gray-800 mb-4">
                  Send a password reset email to your registered email address
                </p>
                <Button 
                  onClick={handlePasswordReset}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Sending...' : 'Reset Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800 mb-4">
                  As an admin, you have access to recruiter management and system configuration.
                </p>
                <div className="text-sm text-primary bg-primary/10 p-3 rounded-lg">
                  ✓ Full system access enabled
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">
                Configure email notifications for new applications and system updates. Coming soon.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">
                Advanced security settings and audit logs. Feature in development.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">
                System-wide settings and configuration options. Coming soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;