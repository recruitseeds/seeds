export const sidebarData = {
  navMain: [
    {
      title: 'Main',
      url: '#',
      items: [
        {
          title: 'Home',
          url: '/dashboard',
          isActive: false,
          icon: 'Home',
        },
        {
          title: 'Jobs',
          url: '/dashboard/jobs',
          isActive: false,
          icon: 'Briefcase',
          subItems: [
            {
              title: 'Create',
              url: '/dashboard/jobs/create',
            },
            {
              title: 'Settings',
              url: '/dashboard/jobs/settings',
            },
          ],
        },
        {
          title: 'Templates',
          url: '/dashboard/templates',
          isActive: false,
          icon: 'Clipboard',
          subItems: [
            {
              title: 'Create',
              url: '/dashboard/templates/create',
            },
          ],
        },
        {
          title: 'Drafts',
          url: '/dashboard/drafts',
          isActive: false,
          icon: 'UserRoundPen',
        },
        {
          title: 'Messages',
          url: '/dashboard/messages',
          isActive: false,
          icon: 'MessageCircle',
        },
        {
          title: 'Analytics',
          url: '/dashboard/analytics',
          isActive: false,
          icon: 'ChartPie',
        },
      ],
    },
  ],
}

export type Job = {
  id: string
  title: string
  location: string
  department: 'Engineering' | 'Growth' | 'Design'
  active: boolean
}

export const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    location: 'United States',
    department: 'Engineering',
    active: true,
  },
  {
    id: '2',
    title: 'Backend Engineer',
    location: 'Remote',
    department: 'Engineering',
    active: true,
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    location: 'United States',
    department: 'Engineering',
    active: true,
  },
  {
    id: '4',
    title: 'Growth Marketing Manager',
    location: 'United States',
    department: 'Growth',
    active: true,
  },
  {
    id: '5',
    title: 'Product Marketing Manager',
    location: 'Remote',
    department: 'Growth',
    active: true,
  },
  {
    id: '6',
    title: 'Lead Product Designer',
    location: 'United States',
    department: 'Design',
    active: true,
  },
  {
    id: '7',
    title: 'UI/UX Designer',
    location: 'Remote',
    department: 'Design',
    active: false,
  },
]

export const departments = ['Engineering', 'Growth', 'Design']

import { Candidate } from '@/components/columns'
export const data: Candidate[] = [
  {
    id: '728ed52f',
    name: 'John Doe',
    email: 'john.doe@example.com',
    position: 'Senior Frontend Developer',
    status: 'Phone Screen',
    dateApplied: '2024-01-15',
    lastActivity: '2024-01-20',
    owner: 'Sarah Thompson',
  },
  {
    id: '489e1d42',
    name: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    position: 'Product Manager',
    status: 'Interview',
    dateApplied: '2024-01-10',
    lastActivity: '2024-01-22',
    owner: 'Mike Johnson',
  },
  {
    id: '63ae4591',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    position: 'DevOps Engineer',
    status: 'Screening',
    dateApplied: '2024-01-18',
    lastActivity: '2024-01-19',
    owner: 'Sarah Thompson',
  },
  {
    id: '952cf103',
    name: 'Emily Jones',
    email: 'emily.jones@example.com',
    position: 'UX Designer',
    status: 'Offer',
    dateApplied: '2024-01-05',
    lastActivity: '2024-01-21',
    owner: 'David Wilson',
  },
  {
    id: '842ad14b',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    position: 'Backend Developer',
    status: 'Interview',
    dateApplied: '2024-01-12',
    lastActivity: '2024-01-20',
    owner: 'Mike Johnson',
  },
  {
    id: '321bc976',
    name: 'Lisa Taylor',
    email: 'lisa.taylor@example.com',
    position: 'Data Scientist',
    status: 'Phone Screen',
    dateApplied: '2024-01-17',
    lastActivity: '2024-01-19',
    owner: 'Sarah Thompson',
  },
  {
    id: '567de890',
    name: 'James Anderson',
    email: 'james.anderson@example.com',
    position: 'Frontend Developer',
    status: 'Screening',
    dateApplied: '2024-01-20',
    lastActivity: '2024-01-21',
    owner: 'David Wilson',
  },
  {
    id: '098fe432',
    name: 'Emma White',
    email: 'emma.white@example.com',
    position: 'Product Manager',
    status: 'Interview',
    dateApplied: '2024-01-08',
    lastActivity: '2024-01-22',
    owner: 'Mike Johnson',
  },
  {
    id: '654bc123',
    name: 'Robert Miller',
    email: 'robert.miller@example.com',
    position: 'Full Stack Developer',
    status: 'Screening',
    dateApplied: '2024-01-19',
    lastActivity: '2024-01-20',
    owner: 'Sarah Thompson',
  },
  {
    id: '789gh456',
    name: 'Olivia Clark',
    email: 'olivia.clark@example.com',
    position: 'UI Designer',
    status: 'Phone Screen',
    dateApplied: '2024-01-16',
    lastActivity: '2024-01-21',
    owner: 'David Wilson',
  },
  {
    id: '234ij789',
    name: 'William Martin',
    email: 'william.martin@example.com',
    position: 'DevOps Engineer',
    status: 'Interview',
    dateApplied: '2024-01-11',
    lastActivity: '2024-01-20',
    owner: 'Mike Johnson',
  },
  {
    id: '890kl345',
    name: 'Sophia Davis',
    email: 'sophia.davis@example.com',
    position: 'Backend Developer',
    status: 'Offer',
    dateApplied: '2024-01-07',
    lastActivity: '2024-01-22',
    owner: 'Sarah Thompson',
  },
  {
    id: '456mn901',
    name: 'Daniel Thompson',
    email: 'daniel.thompson@example.com',
    position: 'Data Engineer',
    status: 'Screening',
    dateApplied: '2024-01-18',
    lastActivity: '2024-01-19',
    owner: 'David Wilson',
  },
  {
    id: '123op678',
    name: 'Ava Harris',
    email: 'ava.harris@example.com',
    position: 'Frontend Developer',
    status: 'Phone Screen',
    dateApplied: '2024-01-15',
    lastActivity: '2024-01-21',
    owner: 'Mike Johnson',
  },
  {
    id: '567qr234',
    name: 'Thomas Jackson',
    email: 'thomas.jackson@example.com',
    position: 'Full Stack Developer',
    status: 'Interview',
    dateApplied: '2024-01-13',
    lastActivity: '2024-01-20',
    owner: 'Sarah Thompson',
  },
]
