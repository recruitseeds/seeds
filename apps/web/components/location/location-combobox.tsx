// components/ui/location-combobox.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Loader2, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

interface LocationComboboxProps {
  onSelect: (location: any) => void
  placeholder?: string
  className?: string
}

export function LocationCombobox({ onSelect, placeholder, className }: LocationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce the search query
  const [debouncedQuery] = useDebounce(inputValue, 300)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setLocations([])
      return
    }

    const searchLocations = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedQuery)}.json?` +
            `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
            `types=place,locality,address&` +
            `limit=5`
        )
        const data = await response.json()
        setLocations(data.features || [])
      } catch (error) {
        console.error('Location search error:', error)
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    searchLocations()
  }, [debouncedQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between', className)}>
          <span className='truncate'>{value || placeholder || 'Select location...'}</span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput placeholder='Search city or address...' value={inputValue} onValueChange={setInputValue} />
          {loading && (
            <div className='flex items-center justify-center py-2'>
              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
            </div>
          )}
          {!loading && inputValue.length > 1 && locations.length === 0 && (
            <CommandEmpty>No location found.</CommandEmpty>
          )}
          <CommandGroup>
            {locations.map((location) => (
              <CommandItem
                key={location.id}
                value={location.place_name}
                onSelect={() => {
                  setValue(location.place_name)
                  setOpen(false)
                  onSelect(location)
                }}
                className='cursor-pointer'>
                <Check className={cn('mr-2 h-4 w-4', value === location.place_name ? 'opacity-100' : 'opacity-0')} />
                <MapPin className='mr-2 h-4 w-4 text-muted-foreground' />
                <div className='flex-1'>
                  <div className='font-medium'>{location.text}</div>
                  {location.context && (
                    <div className='text-xs text-muted-foreground'>
                      {location.context
                        .slice(0, 2)
                        .map((c: any) => c.text)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
