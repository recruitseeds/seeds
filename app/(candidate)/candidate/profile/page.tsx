import { CandidateProfile } from '@/components/candidate/candidate-profile'
import { HydrateClient, getServerTRPCCaller } from '@/trpc/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Candidate Profile | Seeds',
}

type ApplicationStatus = 'applied' | 'in-review' | 'interview' | 'rejected' | 'offer'

interface CandidateProfilePageProps {
  searchParams: {
    page?: string
    pageSize?: string
    tab?: string
    search?: string
    status?: string
  }
}

export default async function CandidateProfilePage({ searchParams }: CandidateProfilePageProps) {
  const page = searchParams?.page ? Number.parseInt(searchParams.page, 10) : 1
  const pageSize = searchParams?.pageSize ? Number.parseInt(searchParams.pageSize, 10) : 10
  const search = searchParams?.search || undefined
  const statusParam = searchParams?.status

  let status: ApplicationStatus | undefined
  if (statusParam && ['applied', 'in-review', 'interview', 'rejected', 'offer'].includes(statusParam)) {
    status = statusParam as ApplicationStatus
  }

  const caller = await getServerTRPCCaller()

  const [
    applicationsData,
    workExperiencesData,
    educationData,
    skillsData,
    contactData,
    filesData, // <-- Add this
  ] = await Promise.all([
    caller.candidate.listApplications({
      page: page > 0 ? page : 1,
      pageSize: pageSize > 0 ? pageSize : 10,
      search: search,
      status: status,
    }),
    caller.candidate.listWorkExperiences(),
    caller.candidate.listEducation(),
    caller.candidate.listSkills(),
    caller.candidate.getContactInfo().catch(() => null),
    caller.candidate.listFiles(), // <-- Add this fetch
  ])

  return (
    <HydrateClient>
      <CandidateProfile
        initialApplicationsData={applicationsData}
        workExperiencesData={workExperiencesData}
        educationData={educationData}
        skillsData={skillsData}
        contactData={contactData}
        filesData={filesData}
      />
    </HydrateClient>
  )
}
