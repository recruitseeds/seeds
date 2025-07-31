'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import type { RouterOutputs } from '@/trpc/routers/_app'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ApplicationsList } from './applications-list'
import { ContactInfo } from './contact-info'
import { Education } from './education'
import { FileManager } from './file-manager'
import { Skills } from './skills'
import { WorkExperience } from './work-experience'

const validTabs = ['applications', 'experience', 'education', 'skills', 'files', 'contact'] as const
type ValidTab = (typeof validTabs)[number]
const DEFAULT_TAB: ValidTab = 'applications'

const tabLabels: Record<ValidTab, string> = {
  applications: 'Applications',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  files: 'Files',
  contact: 'Contact',
}

interface CandidateProfilePropsWithData {
  initialApplicationsData: RouterOutputs['candidate']['listApplications']
  workExperiencesData: RouterOutputs['candidate']['listWorkExperiences']
  educationData: RouterOutputs['candidate']['listEducation']
  skillsData: RouterOutputs['candidate']['listSkills']
  contactData: RouterOutputs['candidate']['getContactInfo'] | null
  filesData: RouterOutputs['candidate']['listFiles']
}

type CandidateProfilePropsWithoutData = object

type CandidateProfileProps = CandidateProfilePropsWithData | CandidateProfilePropsWithoutData

function hasData(props: CandidateProfileProps): props is CandidateProfilePropsWithData {
  return 'initialApplicationsData' in props
}

export function CandidateProfile(props: CandidateProfileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTabParam = searchParams.get('tab')
  const activeTab =
    currentTabParam && validTabs.includes(currentTabParam as ValidTab) ? (currentTabParam as ValidTab) : DEFAULT_TAB

  const handleTabChange = (value: string) => {
    const newTab = value as ValidTab
    const current = new URLSearchParams(Array.from(searchParams.entries()))

    current.set('tab', newTab)

    current.delete('page')
    current.delete('pageSize')
    current.delete('search')
    current.delete('status')

    if (newTab !== 'files' && current.has('section')) {
      current.delete('section')
    }

    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
  }
  const tabContent = (
    <>
      <TabsContent value='applications' className='mt-0'>
        <ApplicationsList {...(hasData(props) ? { initialApplicationsData: props.initialApplicationsData } : {})} />
      </TabsContent>
      <TabsContent value='experience' className='mt-0'>
        <WorkExperience {...(hasData(props) ? { initialExperiencesData: props.workExperiencesData } : {})} />
      </TabsContent>
      <TabsContent value='education' className='mt-0'>
        <Education {...(hasData(props) ? { initialEducationData: props.educationData } : {})} />
      </TabsContent>
      <TabsContent value='skills' className='mt-0'>
        <Skills {...(hasData(props) ? { initialSkillsData: props.skillsData } : {})} />
      </TabsContent>
      <TabsContent value='files' className='mt-0'>
        {/* 2. Pass the initialFilesData prop to the FileManager */}
        <FileManager {...(hasData(props) ? { initialFilesData: props.filesData } : {})} />
      </TabsContent>
      <TabsContent value='contact' className='mt-0'>
        <ContactInfo {...(hasData(props) ? { contactData: props.contactData } : { contactData: null })} />
      </TabsContent>
    </>
  )

  return (
    <div>
      <div className='sm:hidden mb-6'>
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {validTabs.map((tabValue) => (
              <SelectItem key={tabValue} value={tabValue}>
                {tabLabels[tabValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={activeTab} className='mt-6'>
          {tabContent}
        </Tabs>
      </div>

      <div className='hidden sm:block'>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {validTabs.map((tabValue) => (
              <TabsTrigger key={tabValue} value={tabValue}>
                {tabLabels[tabValue]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className='mt-6'>{tabContent}</div>
        </Tabs>
      </div>
    </div>
  )
}
