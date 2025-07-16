'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { JobTableHeader } from './data-table-header'

const data = [...Array(10)].map((_, i) => ({ id: i.toString() }))

export function JobTableLoading() {
  return (
    <div className='w-full'>
      <div className='overflow-x-auto md:border-l md:border-r border-border'>
        <Table>
          <JobTableHeader />
          <TableBody className='border-l-0 border-r-0 border-t-0 border-b-0'>
            {data?.map((row) => (
              <TableRow key={row.id} className='h-[45px]'>
                <TableCell className='w-[40px] min-w-[40px] sticky left-0 bg-background z-20'>
                  <Skeleton className='h-4 w-4' />
                </TableCell>
                <TableCell className='w-[280px] min-w-[280px] sticky left-[40px] bg-background z-20'>
                  <div className='space-y-1'>
                    <Skeleton className='h-4 w-[70%]' />
                    <Skeleton className='h-3 w-[50%]' />
                  </div>
                </TableCell>
                <TableCell className='w-[140px]'>
                  <Skeleton className='h-3.5 w-[60%]' />
                </TableCell>
                <TableCell className='w-[120px]'>
                  <Skeleton className='h-5 w-[80%] rounded-full' />
                </TableCell>
                <TableCell className='w-[140px]'>
                  <Skeleton className='h-5 w-[70%] rounded-full' />
                </TableCell>
                <TableCell className='w-[120px]'>
                  <Skeleton className='h-5 w-[80%] rounded-full' />
                </TableCell>
                <TableCell className='w-[180px]'>
                  <div className='flex items-center space-x-2'>
                    <Skeleton className='h-6 w-6 rounded-full' />
                    <Skeleton className='h-3.5 w-[60%]' />
                  </div>
                </TableCell>
                <TableCell className='w-[140px]'>
                  <Skeleton className='h-3.5 w-[70%]' />
                </TableCell>
                <TableCell className='w-[120px]'>
                  <Skeleton className='h-3.5 w-[50%]' />
                </TableCell>
                <TableCell className='w-[100px] sticky right-0 bg-background z-30'>
                  <Skeleton className='h-4 w-4 mx-auto' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
