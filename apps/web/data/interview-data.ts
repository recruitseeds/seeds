export type Interview = {
  id: string
  type:
    | 'Phone Screen'
    | 'Technical'
    | 'Behavioral'
    | 'Final Round'
    | 'Take Home'
  candidate: string
  date: string
  role: string
  candidateEmail?: string
  status?: 'scheduled' | 'completed' | 'canceled' | 'no-show'
}

export const interviews: Interview[] = [
  {
    id: 'int-001',
    type: 'Phone Screen',
    candidate: 'Sarah Johnson',
    date: '2025-03-22T10:00:00',
    role: 'Interviewer',
    candidateEmail: 'sarah.johnson@example.com',
    status: 'scheduled',
  },
  {
    id: 'int-002',
    type: 'Technical',
    candidate: 'Michael Chen',
    date: '2025-03-20T14:30:00',
    role: 'Interviewer',
    candidateEmail: 'mchen@techmail.com',
    status: 'completed',
  },
  {
    id: 'int-003',
    type: 'Behavioral',
    candidate: 'Jessica Rivera',
    date: '2025-03-19T11:00:00',
    role: 'Interviewer',
    candidateEmail: 'j.rivera@example.org',
    status: 'completed',
  },
  {
    id: 'int-004',
    type: 'Final Round',
    candidate: 'David Kim',
    date: '2025-03-25T15:00:00',
    role: 'Interviewer',
    candidateEmail: 'david.kim@gmail.com',
    status: 'scheduled',
  },
  {
    id: 'int-005',
    type: 'Take Home',
    candidate: 'Emily Wilson',
    date: '2025-03-18T00:00:00',
    role: 'Interviewer',
    candidateEmail: 'ewilson@example.net',
    status: 'completed',
  },
  {
    id: 'int-006',
    type: 'Phone Screen',
    candidate: 'Robert Taylor',
    date: '2025-03-24T09:00:00',
    role: 'Interviewer',
    candidateEmail: 'rtaylor@company.co',
    status: 'scheduled',
  },
  {
    id: 'int-007',
    type: 'Technical',
    candidate: 'Amanda Lopez',
    date: '2025-03-21T13:00:00',
    role: 'Interviewer',
    candidateEmail: 'alopez@techstart.io',
    status: 'scheduled',
  },
  {
    id: 'int-008',
    type: 'Technical',
    candidate: 'James Wilson',
    date: '2025-03-17T10:30:00',
    role: 'Interviewer',
    candidateEmail: 'jwilson@example.com',
    status: 'canceled',
  },
  {
    id: 'int-009',
    type: 'Behavioral',
    candidate: 'Sophia Martinez',
    date: '2025-03-26T14:00:00',
    role: 'Interviewer',
    candidateEmail: 'smartinez@company.org',
    status: 'scheduled',
  },
  {
    id: 'int-010',
    type: 'Final Round',
    candidate: 'Daniel Brown',
    date: '2025-03-16T15:30:00',
    role: 'Interviewer',
    candidateEmail: 'dbrown@example.net',
    status: 'no-show',
  },
  {
    id: 'int-011',
    type: 'Take Home',
    candidate: 'Olivia Garcia',
    date: '2025-03-23T00:00:00',
    role: 'Interviewer',
    candidateEmail: 'ogarcia@techcorp.dev',
    status: 'scheduled',
  },
  {
    id: 'int-012',
    type: 'Phone Screen',
    candidate: 'Ethan Jackson',
    date: '2025-03-15T11:30:00',
    role: 'Interviewer',
    candidateEmail: 'ejackson@example.com',
    status: 'completed',
  },
]
