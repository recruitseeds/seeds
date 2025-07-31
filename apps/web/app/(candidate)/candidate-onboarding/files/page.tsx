import { getCandidateDefaultResumeAction } from '@/actions/get-candidate-default-resume-action'
import { OnboardingFilesForm } from '@/components/candidate/onboarding-files-form'
import type { CandidateUploadedFileMetadata } from '@seeds/supabase/mutations'

export default async function CandidateFilesUploadPage() {
  const resumeActionResult = await getCandidateDefaultResumeAction()

  let existingResume: CandidateUploadedFileMetadata | null = null

  if (!resumeActionResult) {
    console.error('[Page] Action result is null or undefined unexpectedly.')
  } else if (resumeActionResult.serverError) {
    console.error(
      '[Page] Server error fetching default resume via action:',
      resumeActionResult.serverError
    )
  } else if (resumeActionResult.data) {
    const actionHandlerResult = resumeActionResult.data

    if (actionHandlerResult.success) {
      if (actionHandlerResult.data) {
        const resumeFile = actionHandlerResult.data
        existingResume = {
          id: resumeFile.id,
          candidate_id: resumeFile.candidate_id,
          file_name: resumeFile.file_name,
          file_type: resumeFile.file_type,
          mime_type: resumeFile.mime_type,
          size_bytes: resumeFile.size_bytes,
          storage_path: resumeFile.storage_path,
          is_default_resume: resumeFile.is_default_resume,
          parsed_resume_data: resumeFile.parsed_resume_data,
        }
        console.log(
          '[Page] Successfully fetched existing resume via action:',
          existingResume.id
        )
      } else {
        console.log(
          '[Page] No existing default resume found (action was successful, but no data returned).'
        )
      }
    } else {
      console.error(
        '[Page] Action failed to fetch default resume:',
        actionHandlerResult.error
      )
    }
  } else {
    console.error(
      '[Page] Unexpected structure in action result (no data and no server error, though result object exists):',
      resumeActionResult
    )
  }

  return (
    <div className='container mx-auto py-8'>
      <OnboardingFilesForm initialResume={existingResume} />
    </div>
  )
}
