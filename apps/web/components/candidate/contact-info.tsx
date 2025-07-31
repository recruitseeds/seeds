import { Card, CardContent } from '../ui/card'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { ContactInfoForm } from './contact-info-form'

interface ContactInfoProps {
  contactData: RouterOutputs['candidate']['getContactInfo'] | null
}

export function ContactInfo({ contactData }: ContactInfoProps) {
  if (!contactData) {
    return (
      <Card>
        <CardContent>
          <p className='text-muted-foreground'>No contact information found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='shadow-none border-none pt-0'>
      <CardContent className='px-0'>
        <ContactInfoForm initialData={contactData} />
      </CardContent>
    </Card>
  )
}
