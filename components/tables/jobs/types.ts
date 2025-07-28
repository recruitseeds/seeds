export interface JobPost {
  id: string;
  title: string;
  company?: string;
  department?: string | null;
  job_type?: string | null;
  experience_level?: string | null;
  status: string;
  salary?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string | null;
  location?: string | null;
  created_at: string;
  updated_at?: string | null;
  hiring_manager_id?: string | null;
  hiring_manager_name?: string | null;
  hiring_manager?: {
    user_id: string;
  } | null;
  applicant_count?: number;
  applicantCount?: number;
  organization_id?: string;
  content?: any;
  published_at?: string | null;
}
