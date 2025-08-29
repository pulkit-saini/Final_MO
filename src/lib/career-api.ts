import { supabase } from './auth';
import { JobPosting, Applicant, DashboardStats } from '@/types/career';

export const careerAPI = {
  // ------------------------------
  // Job Postings
  // ------------------------------
  async getJobPostings(includeHidden = false): Promise<JobPosting[]> {
    try {
      let query = supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeHidden) {
        query = query.eq('is_visible', true).eq('status', 'Active');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching job postings:', error);
        throw error;
      }

      // Get applicant counts separately
      const jobsWithCounts = await Promise.all(
        (data || []).map(async (job: any) => {
          const { count } = await supabase
            .from('applicants')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            id: String(job.id),
            title: job.title,
            department: job.department,
            type: job.type,
            location: job.location,
            experience: job.experience,
            salary: job.salary,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            deadline: job.deadline,
            status: job.status,
            isVisible: job.is_visible,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
            applicantCount: count || 0,
          };
        })
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error fetching job postings:', error);
      return [];
    }
  },

  async getJobPosting(id: string): Promise<JobPosting | null> {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching job posting:', error);
        throw error;
      }

      return {
        id: String(data.id),
        title: data.title,
        department: data.department,
        type: data.type,
        location: data.location,
        experience: data.experience,
        salary: data.salary,
        description: data.description,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
        deadline: data.deadline,
        status: data.status,
        isVisible: data.is_visible,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching job posting:', error);
      return null;
    }
  },

  async createJobPosting(
    job: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>
  ): Promise<JobPosting | null> {
    try {
      console.log('Creating job posting with data:', job);
      
      const { data, error } = await supabase
        .from('job_postings')
        .insert([
          {
            title: job.title,
            department: job.department,
            type: job.type,
            location: job.location,
            experience: job.experience,
            salary: job.salary,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            deadline: job.deadline,
            status: job.status,
            is_visible: job.isVisible,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating job posting:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Job posting created successfully:', data);
      return {
        id: String(data.id),
        title: data.title,
        department: data.department,
        type: data.type,
        location: data.location,
        experience: data.experience,
        salary: data.salary,
        description: data.description,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
        deadline: data.deadline,
        status: data.status,
        isVisible: data.is_visible,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating job posting:', error);
      return null;
    }
  },

  async updateJobPosting(id: string, updates: Partial<JobPosting>): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are being updated
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.experience !== undefined) updateData.experience = updates.experience;
      if (updates.salary !== undefined) updateData.salary = updates.salary;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.responsibilities !== undefined) updateData.responsibilities = updates.responsibilities;
      if (updates.requirements !== undefined) updateData.requirements = updates.requirements;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.isVisible !== undefined) updateData.is_visible = updates.isVisible;

      const { error } = await supabase
        .from('job_postings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating job posting:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error updating job posting:', error);
      return false;
    }
  },

  async deleteJobPosting(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('job_postings').delete().eq('id', id);
      if (error) {
        console.error('Error deleting job posting:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error deleting job posting:', error);
      return false;
    }
  },

  // ------------------------------
  // Applicants
  // ------------------------------
  async getApplicants(jobId?: string): Promise<Applicant[]> {
    try {
      let query = supabase
        .from('applicants')
        .select(`
          *,
          job_postings!inner (
            id,
            title
          )
        `)
        .order('applied_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching applicants:', error);
        throw error;
      }

      return (data ?? []).map((applicant: any) => ({
        id: String(applicant.id),
        jobId: String(applicant.job_id),
        name: applicant.name || '',
        email: applicant.email || '',
        phone: applicant.phone || '',
        resumeUrl: applicant.resume_url || '',
        coverLetter: applicant.cover_letter || '',
        status: applicant.status || 'Applied',
        notes: applicant.notes || '',
        appliedAt: applicant.applied_at,
        updatedAt: applicant.updated_at,
        jobTitle: applicant.job_postings?.title || '',
      }));
    } catch (error) {
      console.error('Error fetching applicants:', error);
      return [];
    }
  },

  async updateApplicantStatus(
    id: string,
    status: Applicant['status'],
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('applicants')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating applicant status:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error updating applicant status:', error);
      return false;
    }
  },

  async submitApplication(application: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl: string;
    coverLetter?: string;
  }): Promise<boolean> {
    try {
      console.log('Submitting application:', application);
      
      const { error } = await supabase.from('applicants').insert([
        {
          job_id: application.jobId,
          name: application.name,
          email: application.email,
          phone: application.phone || null,
          resume_url: application.resumeUrl,
          cover_letter: application.coverLetter || null,
          status: 'Applied',
        },
      ]);

      if (error) {
        console.error('Error submitting application:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('Application submitted successfully');
      return true;
    } catch (error) {
      console.error('Error submitting application:', error);
      return false;
    }
  },

  // ------------------------------
  // Dashboard Stats
  // ------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [jobsResult, totalApplicantsResult, pendingApplicantsResult, recentApplicantsResult] =
        await Promise.all([
          supabase.from('job_postings').select('status'),
          supabase.from('applicants').select('*', { count: 'exact', head: true }),
          supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('status', 'Applied'),
          supabase
            .from('applicants')
            .select(`
              *,
              job_postings(title)
            `)
            .order('applied_at', { ascending: false })
            .limit(5),
        ]);

      const jobs = jobsResult.data ?? [];
      const totalApplicants = totalApplicantsResult.count ?? 0;
      const pendingApplicants = pendingApplicantsResult.count ?? 0;
      const recentApplicants = recentApplicantsResult.data ?? [];

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j: any) => j.status === 'Active').length,
        totalApplicants,
        pendingApplications: pendingApplicants,
        recentApplications: recentApplicants.map((applicant: any) => ({
          id: String(applicant.id),
          jobId: String(applicant.job_id),
          name: applicant.name || '',
          email: applicant.email || '',
          phone: applicant.phone || '',
          resumeUrl: applicant.resume_url || '',
          coverLetter: applicant.cover_letter || '',
          status: applicant.status || 'Applied',
          notes: applicant.notes || '',
          appliedAt: applicant.applied_at,
          updatedAt: applicant.updated_at,
          jobTitle: applicant.job_postings?.title || '',
        })),
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalApplicants: 0,
        pendingApplications: 0,
        recentApplications: [],
      };
    }
  },

  // ------------------------------
  // File Upload
  // ------------------------------
  async uploadResume(file: File): Promise<string | null> {
    try {
      console.log('Starting resume upload:', file.name, file.size, file.type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      console.log('Upload path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('career-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error details:', uploadError.message);
        throw uploadError;
      }

      console.log('File uploaded successfully');
      const { data } = supabase.storage.from('career-files').getPublicUrl(filePath);
      console.log('Public URL generated:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading resume:', error);
      return null;
    }
  },
};