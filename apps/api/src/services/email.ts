import { Resend } from 'resend'
import { ConfigService } from './config.js'
import type { Logger } from './logger.js'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlTemplate: string
  textTemplate?: string
  requiredVariables: string[]
}

export interface EmailData {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

export interface CandidateApplicationEmailData {
  candidateName: string
  candidateEmail: string
  jobTitle: string
  companyName: string
  applicationId: string
  portalUrl?: string
  companyLogo?: string
  contactEmail?: string
}

export class EmailService {
  private resend: Resend
  private logger: Logger
  private defaultFromEmail: string
  private templates: Map<string, EmailTemplate> = new Map()

  constructor(logger: Logger) {
    const config = ConfigService.getInstance().getConfig()
    this.resend = new Resend(config.resendApiKey)
    this.logger = logger
    this.defaultFromEmail = config.defaultFromEmail || 'noreply@recruitseed.com'

    this.loadEmailTemplates()
  }

  private loadEmailTemplates(): void {
    const applicationReceivedTemplate: EmailTemplate = {
      id: 'application-received',
      name: 'Application Received Confirmation',
      subject: 'Application received for {{jobTitle}} at {{companyName}}',
      htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Application Received</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 200px; height: auto; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            .cta-button { 
              display: inline-block; 
              background: #007cba; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            {{#if companyLogo}}
            <div class="header">
              <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
            </div>
            {{/if}}
            
            <div class="content">
              <h2>Thank you for your application!</h2>
              
              <p>Hi {{candidateName}},</p>
              
              <p>We've received your application for the <strong>{{jobTitle}}</strong> position at {{companyName}}. Thank you for your interest in joining our team!</p>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our hiring team will review your application</li>
                <li>We'll contact qualified candidates within 5-7 business days</li>
                <li>You'll receive updates via email as your application progresses</li>
              </ul>
              
              {{#if portalUrl}}
              <p>You can track your application status anytime:</p>
              <a href="{{portalUrl}}" class="cta-button">View Application Status</a>
              {{/if}}
              
              <p>If you have any questions, feel free to reach out to {{#if contactEmail}}{{contactEmail}}{{else}}our team{{/if}}.</p>
              
              <p>Best regards,<br>
              The {{companyName}} Hiring Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message regarding your job application (ID: {{applicationId}}).</p>
              <p>Please do not reply to this email. For questions, contact {{#if contactEmail}}{{contactEmail}}{{else}}the hiring team{{/if}}.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textTemplate: `
        Thank you for your application!
        
        Hi {{candidateName}},
        
        We've received your application for the {{jobTitle}} position at {{companyName}}. Thank you for your interest in joining our team!
        
        What happens next?
        - Our hiring team will review your application
        - We'll contact qualified candidates within 5-7 business days
        - You'll receive updates via email as your application progresses
        
        {{#if portalUrl}}
        You can track your application status at: {{portalUrl}}
        {{/if}}
        
        If you have any questions, feel free to reach out to {{#if contactEmail}}{{contactEmail}}{{else}}our team{{/if}}.
        
        Best regards,
        The {{companyName}} Hiring Team
        
        ---
        This is an automated message regarding your job application (ID: {{applicationId}}).
        Please do not reply to this email.
      `,
      requiredVariables: ['candidateName', 'jobTitle', 'companyName', 'applicationId'],
    }

    const candidateRejectionTemplate: EmailTemplate = {
      id: 'candidate-rejection',
      name: 'Candidate Rejection',
      subject: 'Update on your application for {{jobTitle}} at {{companyName}}',
      htmlTemplate: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Application Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>Thank you for your interest in {{companyName}}</h2>
              
              <p>Hi {{candidateName}},</p>
              
              <p>Thank you for taking the time to apply for the <strong>{{jobTitle}}</strong> position at {{companyName}}. We appreciate your interest in joining our team.</p>
              
              <p>After careful consideration, we have decided to move forward with other candidates who more closely match our current requirements for this role.</p>
              
              <p>This decision was not easy, as we received many qualified applications. While this particular opportunity may not be the right fit, we encourage you to apply for future positions that align with your skills and experience.</p>
              
              <p>We wish you the best of luck in your job search and future career endeavors.</p>
              
              <p>Best regards,<br>
              The {{companyName}} Hiring Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message regarding your job application (ID: {{applicationId}}).</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textTemplate: `
        Thank you for your interest in {{companyName}}
        
        Hi {{candidateName}},
        
        Thank you for taking the time to apply for the {{jobTitle}} position at {{companyName}}. We appreciate your interest in joining our team.
        
        After careful consideration, we have decided to move forward with other candidates who more closely match our current requirements for this role.
        
        This decision was not easy, as we received many qualified applications. While this particular opportunity may not be the right fit, we encourage you to apply for future positions that align with your skills and experience.
        
        We wish you the best of luck in your job search and future career endeavors.
        
        Best regards,
        The {{companyName}} Hiring Team
        
        ---
        This is an automated message regarding your job application (ID: {{applicationId}}).
        Please do not reply to this email.
      `,
      requiredVariables: ['candidateName', 'jobTitle', 'companyName', 'applicationId'],
    }

    this.templates.set('application-received', applicationReceivedTemplate)
    this.templates.set('candidate-rejection', candidateRejectionTemplate)
  }

  private renderTemplate(template: string, data: Record<string, unknown>): string {
    let rendered = template

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value || ''))
    }

    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, variable, content) => {
      return data[variable] ? content : ''
    })

    rendered = rendered.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
      (_, variable, ifContent, elseContent) => {
        return data[variable] ? ifContent : elseContent
      }
    )

    return rendered.trim()
  }

  async sendEmail(
    emailData: EmailData,
    metadata?: {
      correlationId?: string
      candidateId?: string
      companyId?: string
    }
  ): Promise<string> {
    try {
      this.logger.info('Sending email', {
        to: emailData.to,
        subject: emailData.subject,
        tags: emailData.tags,
        correlationId: metadata?.correlationId,
        candidateId: metadata?.candidateId,
        companyId: metadata?.companyId,
      })

      const result = await this.resend.emails.send({
        from: emailData.from || this.defaultFromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        tags: emailData.tags,
        headers: emailData.headers,
      })

      if (result.error) {
        this.logger.error('Email sending failed', result.error, {
          to: emailData.to,
          subject: emailData.subject,
          correlationId: metadata?.correlationId,
        })
        throw new Error(`Email sending failed: ${result.error.message}`)
      }

      this.logger.info('Email sent successfully', {
        emailId: result.data?.id,
        to: emailData.to,
        subject: emailData.subject,
        correlationId: metadata?.correlationId,
        candidateId: metadata?.candidateId,
        companyId: metadata?.companyId,
      })

      return result.data?.id || 'unknown'
    } catch (error) {
      this.logger.error('Unexpected error sending email', error, {
        to: emailData.to,
        subject: emailData.subject,
        correlationId: metadata?.correlationId,
      })
      throw error
    }
  }

  async sendTemplatedEmail(
    templateId: string,
    templateData: Record<string, unknown>,
    to: string,
    metadata?: {
      correlationId?: string
      candidateId?: string
      companyId?: string
    }
  ): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Email template not found: ${templateId}`)
    }

    for (const requiredVar of template.requiredVariables) {
      if (!templateData[requiredVar]) {
        throw new Error(`Missing required template variable: ${requiredVar}`)
      }
    }

    const subject = this.renderTemplate(template.subject, templateData)
    const html = this.renderTemplate(template.htmlTemplate, templateData)
    const text = template.textTemplate ? this.renderTemplate(template.textTemplate, templateData) : undefined

    const emailData: EmailData = {
      to,
      subject,
      html,
      text,
      tags: [
        { name: 'template', value: templateId },
        { name: 'candidate_id', value: metadata?.candidateId || '' },
        { name: 'company_id', value: metadata?.companyId || '' },
      ],
    }

    return this.sendEmail(emailData, metadata)
  }

  async sendApplicationReceivedEmail(
    data: CandidateApplicationEmailData,
    metadata?: { correlationId?: string }
  ): Promise<string> {
    this.logger.info('Sending application received email', {
      candidateEmail: data.candidateEmail,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      applicationId: data.applicationId,
      correlationId: metadata?.correlationId,
    })

    return this.sendTemplatedEmail(
      'application-received',
      {
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        applicationId: data.applicationId,
        portalUrl: data.portalUrl,
        companyLogo: data.companyLogo,
        contactEmail: data.contactEmail,
      },
      data.candidateEmail,
      {
        correlationId: metadata?.correlationId,
        candidateId: data.applicationId,
        companyId: data.companyName.toLowerCase().replace(/\s+/g, '-'),
      }
    )
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId)
  }

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }
}
