import { redirect } from 'next/navigation'

interface CompanyJobPageProps {
  params: Promise<{
    companySlug: string
    jobId: string
  }>
}

export default async function CompanyJobPage({ params }: CompanyJobPageProps) {
  const { companySlug, jobId } = await params
  
  // Redirect to the main job page structure
  redirect(`/${companySlug}/${jobId}`)
}