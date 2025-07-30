import { EditExperienceDialog } from '@/components/candidate/edit-application-dialog'
import { formatDate } from '@/lib/dates'
import { parseNextSteps } from '@/lib/next-steps'
import type { RouterOutputs } from '@/trpc/routers/_app'
import type { ColumnDef } from '@tanstack/react-table'
import { type ApplicationStatus, getStatusBadge } from './applications-badge'

export type Application = NonNullable<RouterOutputs['candidate']['listApplications']['data']>[number]

export const columns: ColumnDef<Application>[] = [
  {
    id: 'company',
    accessorFn: (row) => row.company_name,
    header: 'Company',
    cell: ({ row }) => {
      const app = row.original
      return (
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center'>
            {app.company_logo_url ? (
              <img
                src={app.company_logo_url || ''}
                alt={`${app.company_name || 'Company'} logo`}
                width={40}
                height={40}
                className='w-full h-full object-contain'
              />
            ) : (
              <span className='text-muted-foreground text-lg font-medium'>
                {app.company_name?.substring(0, 1).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <div className='font-medium'>{app.company_name || 'N/A'}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'job_title',
    header: 'Position',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('job_title') || 'N/A'}</div>,
  },
  {
    accessorKey: 'application_date',
    header: 'Applied Date',
    cell: ({ row }) => (
      <div className='text-sm text-muted-foreground'>{formatDate(row.getValue('application_date'))}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status') as ApplicationStatus),
  },
  {
    id: 'nextStep',
    header: 'Next Step',
    cell: ({ row }) => {
      const app = row.original

      const parsedSteps = parseNextSteps(app.next_steps ?? null)

      if (parsedSteps && parsedSteps.length > 0) {
        const nextIncompleteStep = parsedSteps.find((step) => !step.completed)

        if (nextIncompleteStep) {
          return (
            <div className='bg-muted/50 px-3 py-1.5 rounded text-xs'>
              <span className='font-medium text-foreground'>{nextIncompleteStep.description}:</span>{' '}
              {nextIncompleteStep.date ? formatDate(nextIncompleteStep.date) : 'No date set'}
            </div>
          )
        }

        return null
      }

      if (app.next_step_description && app.next_step_date) {
        return (
          <div className='bg-muted/50 px-3 py-1.5 rounded text-xs'>
            <span className='font-medium text-foreground'>{app.next_step_description}:</span>{' '}
            {formatDate(app.next_step_date)}
          </div>
        )
      }

      return null
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const app = row.original
      return (
        <div className='flex items-center justify-end'>
          <EditExperienceDialog
            application={{
              ...app,
              next_steps: parseNextSteps(app.next_steps ?? null),
            }}
          />
        </div>
      )
    },
  },
]
