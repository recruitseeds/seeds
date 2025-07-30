import { BriefcaseIcon, CodeIcon, PaletteIcon } from 'lucide-react'

export type JobTemplate = {
  id: string
  title: string
  department: string
  icon: React.ComponentType<{ className?: string }>
}

export const jobTemplates: JobTemplate[] = [
  {
    id: '1',
    title: 'Software Engineer',
    department: 'Engineering',
    icon: CodeIcon,
  },
  {
    id: '2',
    title: 'Product Manager',
    department: 'Product',
    icon: BriefcaseIcon,
  },
  {
    id: '3',
    title: 'UX Designer',
    department: 'Design',
    icon: PaletteIcon,
  },
]
