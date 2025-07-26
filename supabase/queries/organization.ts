import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../types/db";

type Client = SupabaseClient<Database>;
export type JobPosting = Tables<"job_postings">;

export interface JobPostingWithRelations extends JobPosting {
  hiring_manager_name?: string | null;
  applicant_count?: number;
  location?: string | null; // Add location if not in the schema
}

export async function getJobPostingById(
  supabase: Client,
  jobPostingId: string,
): Promise<{
  data: JobPostingWithRelations | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("job_postings")
    .select(
      `
      *,
      hiring_manager:organization_users!hiring_manager_id(
        user_id
      )
    `,
    )
    .eq("id", jobPostingId)
    .single();

  if (error) {
    console.error(`Error fetching job posting ${jobPostingId}:`, error);
    return { data: null, error };
  }

  // Get hiring manager profile information if available
  let hiring_manager_name = null;
  if (data.hiring_manager?.user_id) {
    const { data: profile } = await supabase.auth.admin.getUserById(
      data.hiring_manager.user_id,
    );
    if (profile.user?.user_metadata?.full_name) {
      hiring_manager_name = profile.user.user_metadata.full_name;
    } else if (profile.user?.email) {
      hiring_manager_name = profile.user.email;
    }
  }

  // Get application count
  const { count: applicant_count } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("job_posting_id", jobPostingId);

  const enrichedData: JobPostingWithRelations = {
    ...data,
    hiring_manager_name,
    applicant_count: applicant_count || 0,
    location: null, // TODO: Add location field to job_postings table or derive from other data
  };

  return { data: enrichedData, error: null };
}

export async function getJobPostingsByOrganization(
  supabase: Client,
  organizationId: string,
  page = 1,
  pageSize = 10,
  status?: string,
): Promise<{
  data: JobPostingWithRelations[] | null;
  error: PostgrestError | null;
  count: number | null;
}> {
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("job_postings")
    .select(
      `
      *,
      hiring_manager:organization_users!hiring_manager_id(
        user_id
      )
    `,
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error(
      `Error fetching job postings for organization ${organizationId}:`,
      error,
    );
    return { data: null, error, count: null };
  }

  if (!data) {
    return { data: null, error: null, count };
  }

  // Enrich data with hiring manager names and application counts
  const enrichedData: JobPostingWithRelations[] = await Promise.all(
    data.map(async (job) => {
      let hiring_manager_name = null;
      if (job.hiring_manager?.user_id) {
        try {
          const { data: profile } = await supabase.auth.admin.getUserById(
            job.hiring_manager.user_id,
          );
          if (profile.user?.user_metadata?.full_name) {
            hiring_manager_name = profile.user.user_metadata.full_name;
          } else if (profile.user?.email) {
            hiring_manager_name = profile.user.email;
          }
        } catch (err) {
          console.warn(
            `Failed to fetch hiring manager profile for job ${job.id}:`,
            err,
          );
        }
      }

      // Get application count for this job
      const { count: applicant_count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("job_posting_id", job.id);

      return {
        ...job,
        hiring_manager_name,
        applicant_count: applicant_count || 0,
        location: null, // TODO: Add location field or derive from other data
      };
    }),
  );

  return { data: enrichedData, error: null, count };
}

export async function getJobPostingsByCreator(
  supabase: Client,
  creatorId: string,
): Promise<{
  data: JobPosting[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("created_by", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `Error fetching job postings for creator ${creatorId}:`,
      error,
    );
  }

  return { data, error };
}

export async function getOrganizationUsers(
  supabase: Client,
  organizationId: string,
): Promise<{
  data: Array<{ id: string; user_id: string; role: string }> | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("organization_users")
    .select("id, user_id, role")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      `Error fetching organization users for organization ${organizationId}:`,
      error,
    );
  }

  return { data, error };
}
