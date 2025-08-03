-- Add candidate_email column to job_applications table
-- This allows us to track applicant emails for both internal and external API applications

ALTER TABLE job_applications
ADD COLUMN candidate_email TEXT;

-- Add index for email lookups
CREATE INDEX idx_job_applications_candidate_email ON job_applications(candidate_email);

-- Update the comment on the column
COMMENT ON COLUMN job_applications.candidate_email IS 'Email address of the candidate for notifications and communications';