import type { RouterOutputs } from '@/trpc/routers/_app'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { Badge } from '../ui/badge'

export type ApplicationStatus =
  | 'applied'
  | 'in-review'
  | 'interview'
  | 'rejected'
  | 'offer'

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'in-review', label: 'In Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
] as const

export interface ApplicationsListProps {
  initialApplicationsData?: RouterOutputs['candidate']['listApplications']
}

export const getStatusBadge = (status: ApplicationStatus | null) => {
  switch (status) {
    case 'applied':
      return (
        <Badge variant='outline' className='flex items-center gap-1'>
          <Clock className='h-3 w-3' /> Applied
        </Badge>
      )
    case 'in-review':
      return (
        <Badge variant='warning' className='flex items-center gap-1'>
          <AlertCircle className='size-3' /> In Review
        </Badge>
      )
    case 'interview':
      return (
        <Badge variant='info' className='flex items-center gap-1'>
          <Calendar className='size-3' /> Interview
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='size-3' /> Rejected
        </Badge>
      )
    case 'offer':
      return (
        <Badge variant='success' className='flex items-center gap-1'>
          <CheckCircle2 className='size-3' /> Offer
        </Badge>
      )
    default:
      return <Badge variant='secondary'>{status || 'Unknown'}</Badge>
  }
}
