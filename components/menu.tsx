'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { sidebarData } from '@/data/data'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

export function Menu() {
  return (
    <div className='md:hidden mr-2'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button size='icon' variant='ghost' className='flex items-center'>
            <svg
              className='stroke-foreground'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M3 8H21'
                strokeWidth='1.5'
                strokeLinecap='round'
                stroke='currentColr'
              />
              <path d='M3 16H21' strokeWidth='1.5' strokeLinecap='round' />
            </svg>
          </Button>
        </DrawerTrigger>
        <DrawerContent className='max-h-[60vh]'>
          <DrawerHeader>
            <VisuallyHidden.Root>
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>
                Set your daily activity goal.
              </DrawerDescription>
            </VisuallyHidden.Root>
          </DrawerHeader>
          <ScrollArea className='h-[40vh] overflow-auto'>
            <div className='space-y-2 p-4 flex flex-col'>
              {sidebarData &&
                sidebarData.navMain.map((data) =>
                  data.items.map((d, i) => (
                    <a key={i} href={d.url}>
                      {d.title}
                    </a>
                  ))
                )}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
