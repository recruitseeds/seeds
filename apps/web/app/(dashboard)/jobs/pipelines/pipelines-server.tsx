import { createClient } from '@/supabase/client/server'
import { PipelineListingClient } from './pipelines-client'

async function getPipelines() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's organization
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgUser) return []

  // Fetch pipelines
  const { data: pipelines, error } = await supabase
    .from('hiring_pipelines')
    .select(`
      *,
      pipeline_steps(
        id,
        name,
        step_order,
        description,
        duration_days
      )
    `)
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pipelines:', error)
    return []
  }

  return pipelines || []
}

export default async function PipelinesServer() {
  const pipelines = await getPipelines()
  
  return <PipelineListingClient initialPipelines={pipelines} />
}