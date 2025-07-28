import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../types/db";

type Client = SupabaseClient<Database>;

export type CreateJobPostingParams = TablesInsert<"job_postings">;
export type UpdateJobPostingParams = TablesUpdate<"job_postings"> & {
  id: string;
};
export type JobPosting = Tables<"job_postings">;

export async function createJobPosting(
  supabase: Client,
  params: CreateJobPostingParams,
): Promise<JobPosting> {
  if (!params.organization_id) {
    throw new Error("company_id is required to create a job posting.");
  }
  if (!params.title) {
    throw new Error("Job title is required.");
  }
  if (!params.job_type) {
    throw new Error("Job type is required.");
  }
  if (!params.created_by) {
    throw new Error("created_by is required.");
  }

  const { data: insertedData, error } = await supabase
    .from("job_postings")
    .insert(params)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create job posting: ${error.message}`);
  }

  if (!insertedData) {
    throw new Error(
      "Failed to create job posting: No data returned after insert.",
    );
  }

  return insertedData;
}

export async function updateJobPosting(
  supabase: Client,
  params: UpdateJobPostingParams,
): Promise<JobPosting> {
  const { id, ...updatePayload } = params;

  for (const key of Object.keys(updatePayload)) {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    const { data: existingData, error: fetchError } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingData) {
      throw new Error(`Job posting with ID ${id} not found.`);
    }
    return existingData;
  }

  const { data: updatedData, error } = await supabase
    .from("job_postings")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(`Job posting with ID ${id} not found.`);
    }
    throw new Error(`Failed to update job posting: ${error.message}`);
  }

  if (!updatedData) {
    throw new Error(`Job posting with ID ${id} not found after update.`);
  }

  return updatedData;
}

export async function duplicateJobPosting(
  supabase: Client,
  jobPostingId: string,
): Promise<JobPosting> {
  const { data: existingJob, error: fetchError } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", jobPostingId)
    .single();

  if (fetchError || !existingJob) {
    throw new Error(`Job posting with ID ${jobPostingId} not found.`);
  }

  const duplicateParams: CreateJobPostingParams = {
    title: `${existingJob.title} (Copy)`,
    job_type: existingJob.job_type,
    content: existingJob.content,
    department: existingJob.department,
    experience_level: existingJob.experience_level,
    hiring_manager_id: existingJob.hiring_manager_id,
    salary_min: existingJob.salary_min,
    salary_max: existingJob.salary_max,
    salary_type: existingJob.salary_type,
    organization_id: existingJob.organization_id,
    created_by: existingJob.created_by,
    pipeline_id: existingJob.pipeline_id,
    // Always duplicate as a draft
    status: "draft",
  };

  return await createJobPosting(supabase, duplicateParams);
}

export async function deleteJobPosting(
  supabase: Client,
  jobPostingId: string,
): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase
    .from("job_postings")
    .delete()
    .eq("id", jobPostingId);

  if (error) {
    return { success: false, error };
  }
  return { success: true };
}
