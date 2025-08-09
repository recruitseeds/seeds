-- Create table for storing form submission data
CREATE TABLE IF NOT EXISTS application_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  form_template_id UUID REFERENCES application_form_templates(id),
  form_data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_application_id)
);

-- Create table for tracking candidate pipeline status
CREATE TABLE IF NOT EXISTS candidate_pipeline_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  pipeline_template_id UUID REFERENCES pipeline_templates(id),
  current_stage_id TEXT NOT NULL,
  current_stage_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'rejected')),
  entered_stage_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  stage_history JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, job_posting_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_application ON application_form_submissions(job_application_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON application_form_submissions(form_template_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_candidate ON candidate_pipeline_status(candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_job ON candidate_pipeline_status(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_template ON candidate_pipeline_status(pipeline_template_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_stage ON candidate_pipeline_status(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_status ON candidate_pipeline_status(status);

-- Add RLS policies
ALTER TABLE application_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_pipeline_status ENABLE ROW LEVEL SECURITY;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for candidate_pipeline_status
CREATE TRIGGER update_candidate_pipeline_status_updated_at
  BEFORE UPDATE ON candidate_pipeline_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to track stage history
CREATE OR REPLACE FUNCTION track_pipeline_stage_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage_id != NEW.current_stage_id THEN
    NEW.stage_history = NEW.stage_history || jsonb_build_object(
      'stage_id', OLD.current_stage_id,
      'stage_name', OLD.current_stage_name,
      'entered_at', OLD.entered_stage_at,
      'left_at', CURRENT_TIMESTAMP,
      'duration_hours', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - OLD.entered_stage_at)) / 3600
    );
    NEW.entered_stage_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tracking stage history
CREATE TRIGGER track_pipeline_stage_changes
  BEFORE UPDATE ON candidate_pipeline_status
  FOR EACH ROW
  WHEN (OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id)
  EXECUTE FUNCTION track_pipeline_stage_history();