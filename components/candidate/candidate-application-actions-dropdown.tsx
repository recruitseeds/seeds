'use client'

import { Button } from '@/components/ui/button'
import { SheetDropdownMenu } from '@/components/ui/sheet'
import { FileTextIcon, PlusIcon, UploadCloudIcon } from 'lucide-react'
import { CreateCandidateApplicationForm } from './create-candidate-application-form'
import { ImportCandidateApplicationsContent } from './import-candidate-applications-form'

interface CandidateApplicationActionsDropdownProps {
  onActionComplete?: () => void
}

export function CandidateApplicationActionsDropdown({ onActionComplete }: CandidateApplicationActionsDropdownProps) {
  return (
    <SheetDropdownMenu
      align='end'
      trigger={
        <Button size='sm' className='rounded-[5px]'>
          <PlusIcon className='size-4 mr-1' /> Add Application
        </Button>
      }
      items={[
        {
          type: 'item',
          label: 'Insert Application',
          leftSlot: <FileTextIcon className='mr-2 size-4' />,
          sheet: {
            sheetContent: ({ closeSheet }) => (
              <CreateCandidateApplicationForm onApplicationCreated={onActionComplete} onClose={closeSheet} />
            ),
            width: 'sm:max-w-2xl',
            onClose: () => console.log('Sheet closed'),
          },
        },
        {
          type: 'item',
          label: 'Import from File',
          leftSlot: <UploadCloudIcon className='mr-2 size-4' />,
          sheet: {
            sheetContent: ({ closeSheet }) => (
              <ImportCandidateApplicationsContent onApplicationsImported={onActionComplete} onClose={closeSheet} />
            ),
            width: 'sm:max-w-2xl',
          },
        },
      ]}
    />
  )
}
