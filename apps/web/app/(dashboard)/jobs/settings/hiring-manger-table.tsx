'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { X } from 'lucide-react'
import * as React from 'react'

type Person = {
  id: string
  name: string
  role: string
  defaultManager: boolean
  currentCandidates: number
}

const availableNames: Person[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Developer',
    defaultManager: true,
    currentCandidates: 6,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Designer',
    defaultManager: false,
    currentCandidates: 1,
  },
  {
    id: '3',
    name: 'Michael Brown',
    role: 'Project Manager',
    defaultManager: false,
    currentCandidates: 0,
  },
  {
    id: '4',
    name: 'Emily Davis',
    role: 'Marketing',
    defaultManager: false,
    currentCandidates: 0,
  },
  {
    id: '5',
    name: 'David Wilson',
    role: 'Sales',
    defaultManager: false,
    currentCandidates: 0,
  },
  {
    id: '6',
    name: 'Jennifer Lee',
    role: 'HR',
    defaultManager: false,
    currentCandidates: 2,
  },
  {
    id: '7',
    name: 'Robert Taylor',
    role: 'Customer Support',
    defaultManager: false,
    currentCandidates: 1,
  },
]

export function HiringManagerTable() {
  const [selectedNames, setSelectedNames] = React.useState<Person[]>([])

  const toggleName = (person: Person) => {
    if (selectedNames.some((item) => item.id === person.id)) {
      setSelectedNames(selectedNames.filter((item) => item.id !== person.id))
    } else {
      setSelectedNames([...selectedNames, person])
    }
  }

  const isSelected = (id: string) => {
    return selectedNames.some((item) => item.id === id)
  }

  const removeName = (id: string) => {
    setSelectedNames(selectedNames.filter((item) => item.id !== id))
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium'>Hiring Manager(s)</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='secondary'>Add names</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56'>
            <DropdownMenuLabel>Available Names</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableNames.map((person) => (
              <DropdownMenuCheckboxItem
                key={person.id}
                checked={isSelected(person.id)}
                onCheckedChange={() => toggleName(person)}>
                {person.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableCaption>List of the hiring manager names.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Default Manager</TableHead>
            <TableHead>Active Candidates</TableHead>
            <TableHead className='w-[100px]'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedNames.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className='text-center text-muted-foreground'>
                No names selected. Use the dropdown to add names.
              </TableCell>
            </TableRow>
          ) : (
            selectedNames.map((person) => (
              <TableRow key={person.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center space-x-2'>
                    <Avatar>
                      <AvatarImage
                        src={`https://picsum.photos/200?random=${person.id}`}
                        alt={person.name}
                      />
                      <AvatarFallback>
                        {person.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{person.name}</span>
                  </div>
                </TableCell>
                <TableCell>{person.role}</TableCell>
                <TableCell>{person.defaultManager ? 'Yes' : 'No'}</TableCell>
                <TableCell>{person.currentCandidates}</TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeName(person.id)}
                    className='h-8 w-8 p-0'>
                    <span className='sr-only'>Remove</span>
                    <X className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
