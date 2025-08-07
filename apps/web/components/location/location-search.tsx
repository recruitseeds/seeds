'use client'

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { useEffect, useRef } from 'react'

interface LocationSearchProps {
  onSelect: (location: any) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({ onSelect, placeholder, className }: LocationSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const geocoder = new MapboxGeocoder({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      types: 'place,locality,address',
      placeholder: placeholder || 'Search for a location...',
    })

    geocoder.on('result', (e) => {
      onSelect(e.result)
    })

    containerRef.current.appendChild(geocoder.onAdd())

    return () => {
      geocoder.onRemove()
    }
  }, [onSelect, placeholder])

  return <div ref={containerRef} className={className} />
}
