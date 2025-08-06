-- Create candidate_saved_jobs table for job bookmarking functionality
CREATE TABLE IF NOT EXISTS candidate_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure a candidate can only save a job once
  UNIQUE(candidate_id, job_posting_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_candidate_saved_jobs_candidate_id ON candidate_saved_jobs(candidate_id);
CREATE INDEX idx_candidate_saved_jobs_job_posting_id ON candidate_saved_jobs(job_posting_id);
CREATE INDEX idx_candidate_saved_jobs_saved_at ON candidate_saved_jobs(saved_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE candidate_saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved jobs
CREATE POLICY "Users can view their own saved jobs" ON candidate_saved_jobs
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only insert their own saved jobs
CREATE POLICY "Users can save jobs for themselves" ON candidate_saved_jobs
  FOR INSERT WITH CHECK (
    candidate_id IN (
      SELECT id FROM candidate_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can only delete their own saved jobs
CREATE POLICY "Users can unsave their own jobs" ON candidate_saved_jobs
  FOR DELETE USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own saved jobs
CREATE POLICY "Users can update their own saved jobs" ON candidate_saved_jobs
  FOR UPDATE USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles 
      WHERE id = auth.uid()
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_saved_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_candidate_saved_jobs_updated_at
  BEFORE UPDATE ON candidate_saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_saved_jobs_updated_at();