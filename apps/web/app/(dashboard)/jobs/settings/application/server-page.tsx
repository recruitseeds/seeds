import { getFormTemplates } from '@/lib/form-templates-api'
import ApplicationFormSettingsClient from './client-page'

export default async function ApplicationFormSettingsServer({
  searchParams,
}: {
  searchParams: { template?: string }
}) {
  let initialTemplates = []
  let selectedTemplateId = searchParams.template

  try {
    const response = await getFormTemplates()
    initialTemplates = response.data

    
    if (selectedTemplateId && !initialTemplates.find(t => t.id === selectedTemplateId)) {
      selectedTemplateId = undefined
    }

    
    if (!selectedTemplateId && initialTemplates.length > 0) {
      selectedTemplateId = initialTemplates[0].id
    }
  } catch (error) {
    console.error('Failed to load form templates:', error)
    
  }

  return (
    <ApplicationFormSettingsClient
      initialTemplates={initialTemplates}
      initialSelectedTemplateId={selectedTemplateId}
    />
  )
}