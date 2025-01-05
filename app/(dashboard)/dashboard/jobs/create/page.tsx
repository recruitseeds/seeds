import { NewJobForm } from '@/components/new-job-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full max-w-3xl">
        <Button variant="link" className="mt-10 pl-0" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft />
            Back to job postings
          </Link>
        </Button>

        <h2 className="mb-5 scroll-m-20 text-3xl font-semibold tracking-tight">
          Create new job posting
        </h2>
        <NewJobForm />
        {/* <div className="grid w-full items-center gap-1.5">
          <Editor />
        </div> */}
      </div>
    </div>
  )
}
