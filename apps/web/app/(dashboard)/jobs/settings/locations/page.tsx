// apps/web/app/(dashboard)/jobs/settings/locations/page.tsx
'use client'

import { LocationCombobox } from '@/components/location/location-combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Building, Copy, Edit2, Globe, Home, MapPin, MoreVertical, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'

// Mock data for templates
const mockTemplates = [
  {
    id: '1',
    name: 'San Francisco HQ',
    type: 'onsite',
    location_display: 'San Francisco, CA',
    location_config: {
      type: 'onsite',
      office: {
        name: 'San Francisco, California, United States',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
      },
    },
    is_default: true,
    usage_count: 23,
  },
  {
    id: '2',
    name: 'Remote US',
    type: 'remote',
    location_display: 'Remote (US Only)',
    location_config: {
      type: 'remote',
      restrictions: 'us',
    },
    is_default: false,
    usage_count: 15,
  },
  {
    id: '3',
    name: 'NYC Hybrid',
    type: 'hybrid',
    location_display: 'Hybrid - New York, NY (3 days/week)',
    location_config: {
      type: 'hybrid',
      office: {
        name: 'New York, New York, United States',
        city: 'New York',
        state: 'New York',
        country: 'United States',
      },
      days_in_office: 3,
    },
    is_default: false,
    usage_count: 8,
  },
]

type LocationType = 'onsite' | 'hybrid' | 'remote'

export default function LocationTemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  // Form state for new/edit template
  const [templateName, setTemplateName] = useState('')
  const [locationType, setLocationType] = useState<LocationType>('onsite')
  const [locationData, setLocationData] = useState<any>(null)
  const [hybridDays, setHybridDays] = useState('3')
  const [remoteRestriction, setRemoteRestriction] = useState('anywhere')

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'remote':
        return <Globe className='w-4 h-4' />
      case 'hybrid':
        return <Home className='w-4 h-4' />
      case 'onsite':
        return <Building className='w-4 h-4' />
      default:
        return <MapPin className='w-4 h-4' />
    }
  }

  const getLocationBadgeVariant = (type: string) => {
    switch (type) {
      case 'remote':
        return 'secondary'
      case 'hybrid':
        return 'outline'
      case 'onsite':
        return 'default'
      default:
        return 'default'
    }
  }

  const handleSaveTemplate = () => {
    // Build template data based on type
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      type: locationType,
      location_display: '',
      location_config: { type: locationType },
      is_default: false,
      usage_count: 0,
    }

    // Set display and config based on type
    if (locationType === 'remote') {
      const labels: Record<string, string> = {
        anywhere: 'Remote (Anywhere)',
        us: 'Remote (US Only)',
        us_ca: 'Remote (US & Canada)',
        europe: 'Remote (Europe Only)',
      }
      newTemplate.location_display = labels[remoteRestriction]
      newTemplate.location_config = {
        type: 'remote',
        restrictions: remoteRestriction,
      }
    } else if (locationType === 'hybrid') {
      newTemplate.location_display = `Hybrid - ${locationData?.place_name || 'TBD'} (${hybridDays} days/week)`
      newTemplate.location_config = {
        type: 'hybrid',
        office: {
          name: locationData?.place_name,
          // Extract city, state, country from context
        },
        days_in_office: parseInt(hybridDays),
      }
    } else {
      newTemplate.location_display = locationData?.place_name || 'TBD'
      newTemplate.location_config = {
        type: 'onsite',
        office: {
          name: locationData?.place_name,
          // Extract city, state, country from context
        },
      }
    }

    setTemplates([...templates, newTemplate])
    setDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setTemplateName('')
    setLocationType('onsite')
    setLocationData(null)
    setHybridDays('3')
    setRemoteRestriction('anywhere')
    setEditingTemplate(null)
  }

  const handleSetDefault = (templateId: string) => {
    setTemplates(
      templates.map((t) => ({
        ...t,
        is_default: t.id === templateId,
      }))
    )
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Location Templates</h3>
        <p className='text-sm text-muted-foreground'>Create and manage location templates for job postings</p>
      </div>
      <Separator />

      {/* Company Default Location */}
      <Card>
        <CardHeader>
          <CardTitle>Company Headquarters</CardTitle>
          <CardDescription>Set your primary office location for quick selection</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Primary Office Location</Label>
            <LocationCombobox
              onSelect={(location) => console.log('HQ:', location)}
              placeholder='Search for your headquarters location...'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Switch id='remote-first' />
            <Label htmlFor='remote-first'>We're a remote-first company</Label>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Saved Templates</CardTitle>
              <CardDescription>Quick-select location configurations for job postings</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Location Template' : 'Create Location Template'}</DialogTitle>
                  <DialogDescription>Save a location configuration to reuse across job postings</DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                  {/* Template Name */}
                  <div className='space-y-2'>
                    <Label>Template Name</Label>
                    <Input
                      placeholder='e.g., SF Office, Remote US, NYC Hybrid'
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>

                  {/* Location Type */}
                  <div className='space-y-2'>
                    <Label>Work Location Type</Label>
                    <Select value={locationType} onValueChange={(v) => setLocationType(v as LocationType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='onsite'>
                          <div className='flex items-center gap-2'>
                            <Building className='w-4 h-4' />
                            <span>On-site</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='hybrid'>
                          <div className='flex items-center gap-2'>
                            <Home className='w-4 h-4' />
                            <span>Hybrid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='remote'>
                          <div className='flex items-center gap-2'>
                            <Globe className='w-4 h-4' />
                            <span>Remote</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic fields based on type */}
                  {(locationType === 'onsite' || locationType === 'hybrid') && (
                    <div className='space-y-2'>
                      <Label>Office Location</Label>
                      <LocationCombobox onSelect={setLocationData} placeholder='Search for location...' />
                    </div>
                  )}

                  {locationType === 'hybrid' && (
                    <div className='space-y-2'>
                      <Label>Required Days in Office</Label>
                      <Select value={hybridDays} onValueChange={setHybridDays}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='1'>1 day per week</SelectItem>
                          <SelectItem value='2'>2 days per week</SelectItem>
                          <SelectItem value='3'>3 days per week</SelectItem>
                          <SelectItem value='4'>4 days per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {locationType === 'remote' && (
                    <div className='space-y-2'>
                      <Label>Remote Work Restrictions</Label>
                      <Select value={remoteRestriction} onValueChange={setRemoteRestriction}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='anywhere'>Anywhere in the world</SelectItem>
                          <SelectItem value='us'>United States only</SelectItem>
                          <SelectItem value='us_ca'>US & Canada</SelectItem>
                          <SelectItem value='europe'>Europe only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant='outline' onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {templates.map((template) => (
              <div
                key={template.id}
                className='flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'>
                <div className='flex items-center gap-4'>
                  <div className='p-2 rounded-md bg-muted'>{getLocationIcon(template.type)}</div>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{template.name}</span>
                      {template.is_default && (
                        <Badge variant='secondary' className='gap-1'>
                          <Star className='w-3 h-3' />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <span>{template.location_display}</span>
                      <span>•</span>
                      <Badge variant={getLocationBadgeVariant(template.type)}>{template.type}</Badge>
                      <span>•</span>
                      <span>Used {template.usage_count} times</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {!template.is_default && (
                      <DropdownMenuItem onClick={() => handleSetDefault(template.id)}>
                        <Star className='w-4 h-4 mr-2' />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Edit2 className='w-4 h-4 mr-2' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className='w-4 h-4 mr-2' />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)} className='text-destructive'>
                      <Trash2 className='w-4 h-4 mr-2' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {templates.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <MapPin className='w-12 h-12 mx-auto mb-3 opacity-50' />
                <p>No location templates yet</p>
                <p className='text-sm'>Create your first template to speed up job posting</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
