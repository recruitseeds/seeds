import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface InvitationEmailProps {
  inviterName: string
  organizationName: string
  role: string
  acceptUrl: string
  expiresAt: string
  organizationLogo?: string
}

export const InvitationEmail = ({
  inviterName = 'John Doe',
  organizationName = 'Acme Corp',
  role = 'recruiter',
  acceptUrl = 'https://example.com/accept',
  expiresAt = '7 days',
  organizationLogo,
}: InvitationEmailProps) => {
  const roleDisplayName = role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <Html>
      <Head />
      <Preview>
        You've been invited to join {organizationName} as a {roleDisplayName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            {organizationLogo ? (
              <Img
                src={organizationLogo}
                width="60"
                height="60"
                alt={organizationName}
                style={logo}
              />
            ) : (
              <div style={logoPlaceholder}>
                {organizationName.charAt(0).toUpperCase()}
              </div>
            )}
          </Section>

          <Heading style={h1}>
            You're invited to join {organizationName}
          </Heading>

          <Text style={text}>
            Hi there! <strong>{inviterName}</strong> has invited you to join{' '}
            <strong>{organizationName}</strong> as a <strong>{roleDisplayName}</strong>.
          </Text>

          <Text style={text}>
            Join their team to collaborate on hiring the best talent and
            streamlining your recruitment process.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={acceptUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={links}>
            <Link style={link} href={acceptUrl}>
              Or copy and paste this URL into your browser: {acceptUrl}
            </Link>
          </Text>

          <Text style={footer}>
            This invitation will expire in {expiresAt}. If you did not expect
            this invitation, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            <Link style={footerLink} href="https://seeds-ats.com">
              Seeds ATS
            </Link>{' '}
            - Making hiring faster and better for startups
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logoSection = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '32px',
}

const logo = {
  borderRadius: '8px',
}

const logoPlaceholder = {
  width: '60px',
  height: '60px',
  borderRadius: '8px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#374151',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const links = {
  textAlign: 'center' as const,
  fontSize: '14px',
  color: '#898989',
}

const link = {
  color: '#898989',
  textDecoration: 'underline',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
}

const footerLink = {
  color: '#898989',
  textDecoration: 'underline',
}

export default InvitationEmail
