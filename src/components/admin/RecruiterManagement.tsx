import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminAuthService } from '@/lib/admin-auth';
import CreateRecruiterForm from './CreateRecruiterForm';
import { Admin } from '@/types/career';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Calendar, 
  MoreVertical,
  UserX,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RecruiterManagement = () => {
  const [recruiters, setRecruiters] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<Admin | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      const recruiterList = await adminAuthService.getRecruiters();
      setRecruiters(recruiterList);
    } catch (error) {
      console.error('Error loading recruiters:', error);
      toast.error('Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadRecruiters();
  };

  const handleDeactivateRecruiter = async () => {
    if (!selectedRecruiter) return;

    try {
      const success = await adminAuthService.deactivateRecruiter(selectedRecruiter.id);
      if (success) {
        toast.success('Recruiter account deactivated');
        loadRecruiters();
      } else {
        toast.error('Failed to deactivate recruiter');
      }
    } catch (error) {
      console.error('Error deactivating recruiter:', error);
      toast.error('An error occurred');
    } finally {
      setShowDeactivateDialog(false);
      setSelectedRecruiter(null);
    }
  };

  const handleResetPassword = async (recruiter: Admin) => {
    try {
      const success = await adminAuthService.resetRecruiterPassword(recruiter.email);
      if (success) {
        toast.success('Password reset email sent to ' + recruiter.email);
      } else {
        toast.error('Failed to send reset email');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An error occurred');
    }
  };

  if (showCreateForm) {
    return (
      <CreateRecruiterForm
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recruiter Management</h2>
          <p className="text-gray-800">
            Manage recruiter accounts and permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Recruiter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : recruiters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No recruiters found
            </h3>
            <p className="text-gray-800 mb-4">
              Get started by creating your first recruiter account
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Recruiter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recruiters.map((recruiter) => (
            <Card key={recruiter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {recruiter.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {recruiter.name}
                        </h3>
                        <Badge 
                          variant={recruiter.isActive ? "default" : "secondary"}
                          className={recruiter.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {recruiter.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-800">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {recruiter.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(recruiter.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleResetPassword(recruiter)}
                        className="gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        Reset Password
                      </DropdownMenuItem>
                      {recruiter.isActive && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedRecruiter(recruiter);
                            setShowDeactivateDialog(true);
                          }}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <UserX className="w-4 h-4" />
                          Deactivate Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Deactivate Recruiter Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedRecruiter?.name}'s account? 
              This will prevent them from logging in and accessing the system.
              This action can be reversed by reactivating the account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivateRecruiter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecruiterManagement;