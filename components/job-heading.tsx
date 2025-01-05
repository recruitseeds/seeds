'use client'

import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export function JobHeading() {
  const router = useRouter()

  return (
    <header>
      <div className='flex h-16 px-8 items-center border-b'>
        <Button
          variant='link'
          onClick={() => {
            router.back()
          }}>
          <ArrowLeft />
          Back to jobs
        </Button>
      </div>
    </header>
  )
}

const ArrowLeft = () => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    className='stroke-foreground'
    xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M10 5L3 11.9999M3 11.9999L10 18.9999M3 11.9999H21'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)
