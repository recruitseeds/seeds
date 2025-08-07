'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { Info, InfoIcon } from 'lucide-react'
import Link from 'next/link'

export default function JobSettingsPage() {
  return (
    <TooltipProvider>
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-medium'>General Settings</h3>
          <p className='text-sm text-muted-foreground'>Configure default settings for all job postings</p>
        </div>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Default Job Configuration</CardTitle>
            <CardDescription>These settings will be applied to new job postings by default</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <div className='flex items-center gap-1'>
                  <Label>Auto-publish jobs</Label>
                  <Tooltip title='When enabled, jobs will be visible to candidates immediately after creation. Disable to save as Staged first (recommended).'>
                    <Info className='h-4 w-4 text-muted-foreground cursor-pointer' />
                  </Tooltip>
                </div>
                <p className='text-sm text-muted-foreground'>Automatically publish jobs when created</p>
              </div>
              <Switch />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Require resume</Label>
                <p className='text-sm text-muted-foreground'>Make resume upload mandatory for applications</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='space-y-2'>
              <Label>Default application deadline</Label>
              <Select defaultValue='30'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='7'>7 days</SelectItem>
                  <SelectItem value='14'>14 days</SelectItem>
                  <SelectItem value='30'>30 days</SelectItem>
                  <SelectItem value='60'>60 days</SelectItem>
                  <SelectItem value='90'>90 days</SelectItem>
                  <SelectItem value='none'>No deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Default department</Label>
              <Select defaultValue='no-default'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='no-default'>No default</SelectItem>
                  <SelectItem value='engineering'>Engineering</SelectItem>
                  <SelectItem value='design'>Design</SelectItem>
                  <SelectItem value='product'>Product</SelectItem>
                  <SelectItem value='marketing'>Marketing</SelectItem>
                  <SelectItem value='sales'>Sales</SelectItem>
                  <SelectItem value='operations'>Operations</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Requirements</CardTitle>
            <CardDescription>Set default requirements for job applications</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Require cover letter</Label>
                <p className='text-sm text-muted-foreground'>Ask candidates to submit a cover letter</p>
              </div>
              <Switch />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Require LinkedIn profile</Label>
                <p className='text-sm text-muted-foreground'>Make LinkedIn URL mandatory</p>
              </div>
              <Switch />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Require portfolio/GitHub</Label>
                <p className='text-sm text-muted-foreground'>For technical or creative roles</p>
              </div>
              <Switch />
            </div>

            <div className='space-y-2'>
              <Label>Maximum applications per job</Label>
              <Select defaultValue='unlimited'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unlimited'>Unlimited</SelectItem>
                  <SelectItem value='50'>50 applications</SelectItem>
                  <SelectItem value='100'>100 applications</SelectItem>
                  <SelectItem value='200'>200 applications</SelectItem>
                  <SelectItem value='500'>500 applications</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>Auto-close job after reaching limit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-rejection Settings</CardTitle>
            <CardDescription>Configure automatic candidate filtering</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <InfoIcon className='h-4 w-4' />
              <AlertDescription>
                Auto-rejection uses AI to parse resumes and score candidates against job requirements. Candidates below
                your threshold are automatically rejected after a delay period.
                <Link href='/docs/auto-rejection' className='underline ml-1 font-medium'>
                  Learn how scoring works →
                </Link>
              </AlertDescription>
            </Alert>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Enable auto-rejection</Label>
                <p className='text-sm text-muted-foreground'>Automatically reject candidates below threshold score</p>
              </div>
              <Switch />
            </div>

            <div className='space-y-2'>
              <Label>Minimum score threshold</Label>
              <div className='flex items-center gap-2'>
                <Input type='number' defaultValue='30' className='w-20' />
                <span className='text-sm text-muted-foreground'>out of 100</span>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Rejection email delay</Label>
              <Select defaultValue='72'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='24'>24 hours</SelectItem>
                  <SelectItem value='48'>48 hours</SelectItem>
                  <SelectItem value='72'>72 hours (3 days)</SelectItem>
                  <SelectItem value='168'>1 week</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>Time to wait before sending rejection email</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI & Automation</CardTitle>
            <CardDescription>Configure AI-powered features and automation</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Auto-parse resumes</Label>
                <p className='text-sm text-muted-foreground'>Automatically extract and structure resume data</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Auto-score candidates</Label>
                <p className='text-sm text-muted-foreground'>Score candidates against job requirements</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Extract hidden links</Label>
                <p className='text-sm text-muted-foreground'>Find GitHub/portfolio URLs in resume text</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='space-y-2'>
              <Label>Scoring weight distribution</Label>
              <div className='space-y-3 p-3 bg-muted rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Skills match</span>
                  <div className='flex items-center gap-1'>
                    <Input type='number' defaultValue='50' className='w-16' />
                    <span className='text-sm text-muted-foreground'>%</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Experience</span>
                  <div className='flex items-center gap-1'>
                    <Input type='number' defaultValue='30' className='w-16' />
                    <span className='text-sm text-muted-foreground'>%</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Education</span>
                  <div className='flex items-center gap-1'>
                    <Input type='number' defaultValue='20' className='w-16' />
                    <span className='text-sm text-muted-foreground'>%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email & Communication</CardTitle>
            <CardDescription>Configure automated email settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Send application confirmations</Label>
                <p className='text-sm text-muted-foreground'>Email candidates when they apply</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Send status updates</Label>
                <p className='text-sm text-muted-foreground'>Notify candidates of application status changes</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className='space-y-2'>
              <Label>Reply-to email address</Label>
              <Input type='email' placeholder='jobs@yourcompany.com' />
              <p className='text-sm text-muted-foreground'>Where candidate replies should go</p>
            </div>

            <div className='space-y-2'>
              <Label>Email signature name</Label>
              <Input placeholder='The Hiring Team' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance & Data</CardTitle>
            <CardDescription>Privacy and compliance settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Data retention period</Label>
              <Select defaultValue='365'>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='90'>90 days</SelectItem>
                  <SelectItem value='180'>180 days</SelectItem>
                  <SelectItem value='365'>1 year</SelectItem>
                  <SelectItem value='730'>2 years</SelectItem>
                  <SelectItem value='unlimited'>Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-sm text-muted-foreground'>Auto-delete candidate data after this period</p>
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>EEOC data collection</Label>
                <p className='text-sm text-muted-foreground'>Collect optional demographic information</p>
              </div>
              <Switch />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>GDPR consent notice</Label>
                <p className='text-sm text-muted-foreground'>Show GDPR notice to EU candidates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button>Save Changes</Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
