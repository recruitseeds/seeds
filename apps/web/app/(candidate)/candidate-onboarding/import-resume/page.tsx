// src/app/(candidate)/import-resume/page.tsx
import { getCandidateDefaultResumeAction } from '@/actions/get-candidate-default-resume-action' // Import the action
import { PreOnboardingOptions } from '@/components/candidate/onboarding-options'
import type { CandidateUploadedFileMetadata } from '@/supabase/mutations' // Import the type

export default async function ImportResumePage() {
  // Make the function async
  // Call the server action
  const resumeActionResult = await getCandidateDefaultResumeAction() // Pass empty object if action expects one

  let existingResume: CandidateUploadedFileMetadata | null = null

  // Process the action result (same logic as in files/page.tsx)
  if (!resumeActionResult) {
    console.error(
      '[ImportResumePage] Action result is null or undefined unexpectedly.'
    )
  } else if (resumeActionResult.serverError) {
    console.error(
      '[ImportResumePage] Server error fetching default resume via action:',
      resumeActionResult.serverError
    )
  } else if (resumeActionResult.data) {
    const actionHandlerResult = resumeActionResult.data // Access the nested data

    if (actionHandlerResult.success) {
      if (actionHandlerResult.data) {
        const resumeFile = actionHandlerResult.data
        // Map to the type expected by the component prop
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
          '[ImportResumePage] Successfully fetched existing resume via action:',
          existingResume.id
        )
      } else {
        console.log(
          '[ImportResumePage] No existing default resume found (action was successful, but no data returned).'
        )
      }
    } else {
      console.error(
        '[ImportResumePage] Action failed to fetch default resume:',
        actionHandlerResult.error
      )
    }
  } else {
    console.error(
      '[ImportResumePage] Unexpected structure in action result (no data and no server error):',
      resumeActionResult
    )
  }

  return (
    <main>
      {/* Pass the fetched data as a prop */}
      <PreOnboardingOptions existingResume={existingResume} />
    </main>
  )
}
