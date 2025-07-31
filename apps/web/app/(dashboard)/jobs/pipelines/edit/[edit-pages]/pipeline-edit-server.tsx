import { createClient } from '@seeds/supabase/client/server'
import { PipelineEditor } from './pipeline-editor'

async function getPipelineWithSteps(pipelineId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's organization
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgUser) return null

  // Fetch pipeline with steps
  const { data: pipeline, error } = await supabase
    .from('hiring_pipelines')
    .select(`
      *,
      pipeline_steps(
        id,
        name,
        step_order,
        description,
        duration_days,
        task_owner_id,
        automation_config,
        permissions,
        task_owner:organization_users!task_owner_id(
          id,
          name,
          email
        )
      )
    `)
    .eq('id', pipelineId)
    .eq('organization_id', orgUser.organization_id)
    .single()

  if (error) {
    console.error('Error fetching pipeline:', error)
    return null
  }

  return pipeline
}

async function getOrganizationUsers() {
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

  // Fetch organization users
  const { data: users, error } = await supabase
    .from('organization_users')
    .select('id, name, email')
    .eq('organization_id', orgUser.organization_id)

  if (error) {
    console.error('Error fetching organization users:', error)
    return []
  }

  return users || []
}

interface PipelineEditServerProps {
  pipelineId: string
}

export default async function PipelineEditServer({ pipelineId }: PipelineEditServerProps) {
  const [pipeline, organizationUsers] = await Promise.all([
    getPipelineWithSteps(pipelineId),
    getOrganizationUsers()
  ])

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Pipeline not found</h2>
          <p className="text-muted-foreground">The pipeline you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <PipelineEditor 
      pipelineId={pipelineId} 
      initialPipeline={pipeline}
      initialOrganizationUsers={organizationUsers}
    />
  )
}