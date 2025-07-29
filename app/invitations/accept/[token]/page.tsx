import { InvitationAcceptanceForm } from '@/components/invitations/invitation-acceptance-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getServerTRPCCaller } from '@/trpc/server'
import { redirect } from 'next/navigation'

interface InvitationAcceptPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function InvitationAcceptPage({ params }: InvitationAcceptPageProps) {
  const { token } = await params

  try {
    // Validate the invitation token on the server
    const caller = await getServerTRPCCaller()
    const invitation = await caller.invitation.getInvitationByToken({ token })

    if (!invitation) {
      redirect('/invitation-invalid')
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Join {invitation.organization_name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You've been invited by {invitation.inviter_name} to join as a{' '}
              {invitation.role.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Complete Your Registration</CardTitle>
              <CardDescription>
                Create your account to accept this invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationAcceptanceForm
                token={token}
                invitation={invitation}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading invitation:', error)
    redirect('/invitation-invalid')
  }
}
