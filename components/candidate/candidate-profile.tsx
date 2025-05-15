'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ApplicationsList } from './applications-list'
import { ContactInfo } from './contact-info'
import { Education } from './education'
import { FileManager } from './file-manager'
import { Skills } from './skills'
import { WorkExperience } from './work-experience'

const validTabs = [
  'applications',
  'experience',
  'education',
  'skills',
  'files',
  'contact',
] as const
type ValidTab = (typeof validTabs)[number]
const DEFAULT_TAB: ValidTab = 'applications'

export function CandidateProfile() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTabParam = searchParams.get('tab')
  const activeTab =
    currentTabParam && validTabs.includes(currentTabParam as ValidTab)
      ? (currentTabParam as ValidTab)
      : DEFAULT_TAB

  const handleTabChange = (value: string) => {
    const newTab = value as ValidTab
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('tab', newTab)
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className=''>
        {validTabs.map((tabValue) => (
          <TabsTrigger key={tabValue} value={tabValue}>
            {tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className='mt-6'>
        <TabsContent value='applications'>
          <ApplicationsList />
        </TabsContent>
        <TabsContent value='experience'>
          <WorkExperience />
        </TabsContent>
        <TabsContent value='education'>
          <Education />
        </TabsContent>
        <TabsContent value='skills'>
          <Skills />
        </TabsContent>
        <TabsContent value='files'>
          <FileManager />
        </TabsContent>
        <TabsContent value='contact'>
          <ContactInfo />
        </TabsContent>
      </div>
    </Tabs>
  )
}
