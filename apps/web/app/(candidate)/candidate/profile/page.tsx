import { CandidateProfile } from '@/components/candidate/candidate-profile'
import { HydrateClient, getServerTRPCCaller } from '@/trpc/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Candidate Profile | Seeds',
}

type ApplicationStatus = 'applied' | 'in-review' | 'interview' | 'rejected' | 'offer'

interface CandidateProfilePageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    tab?: string
    search?: string
    status?: string
  }>
}

export default async function CandidateProfilePage({ searchParams }: CandidateProfilePageProps) {
  const params = await searchParams

  const page = params?.page ? Number.parseInt(params.page, 10) : 1
  const pageSize = params?.pageSize ? Number.parseInt(params.pageSize, 10) : 10
  const search = params?.search || undefined
  const statusParam = params?.status

  let status: ApplicationStatus | undefined
  if (statusParam && ['applied', 'in-review', 'interview', 'rejected', 'offer'].includes(statusParam)) {
    status = statusParam as ApplicationStatus
  }

  const caller = await getServerTRPCCaller()

  const [applicationsData, workExperiencesData, educationData, skillsData, contactData, filesData] = await Promise.all([
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
    caller.candidate.listFiles(),
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
