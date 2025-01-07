import { Plus } from '@/components/icons/plus'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-row items-center justify-between">
          <h2 className="mb-5 mt-10 scroll-m-20 text-3xl font-semibold tracking-tight">
            Templates
          </h2>
          <Button size="sm" variant="accent" asChild>
            <Link href="/dashboard/templates/create">
              Create new template
              <Plus />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-10">
          {/* Company Templates */}
          <div>
            <h4 className="mb-2">Company templates</h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Supabase description
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deploy your new project in one-click.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/templates/supabase">
                    View template
                  </Link>
                </Button>
              </li>
            </ul>
          </div>

          {/* Job Role Templates */}
          <div>
            <h4 className="mb-2">Job role templates</h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">Software Engineer</h3>
                  <p className="text-sm text-muted-foreground">
                    Template for the Software Engineer role.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/templates/software-engineer">
                    View template
                  </Link>
                </Button>
              </li>
              <li className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div>
                  <h3 className="text-lg font-semibold">UI/UX Designer</h3>
                  <p className="text-sm text-muted-foreground">
                    Template for the UI/UX Designer role.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/templates/ui-ux-designer">
                    View template
                  </Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
