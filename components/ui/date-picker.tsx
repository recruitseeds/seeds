'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/poppy'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface DatePickerProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
}

export default function DatePicker({
  selected,
  onSelect,
  disabled,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal bg-transparent after:rounded-[8px]',
            !selected && 'text-muted-foreground'
          )}>
          <CalendarIcon className='mr-2 h-4 w-4' />
          {selected ? format(selected, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0 bg-background border rounded-md z-50'
        align='start'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
