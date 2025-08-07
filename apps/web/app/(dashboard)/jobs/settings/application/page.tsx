'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  CheckSquare,
  FileText,
  FileUp,
  GripVertical,
  Hash,
  Link,
  List,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Type,
} from 'lucide-react'
import { useState } from 'react'

const defaultFields = [
  {
    id: '1',
    name: 'Resume',
    type: 'file',
    required: true,
    order: 1,
    icon: FileUp,
    accepted_formats: ['.pdf', '.docx'],
  },
  {
    id: '2',
    name: 'Cover Letter',
    type: 'file',
    required: false,
    order: 2,
    icon: FileText,
  },
  {
    id: '3',
    name: 'Full Name',
    type: 'text',
    required: true,
    order: 3,
    icon: Type,
  },
  {
    id: '4',
    name: 'Email',
    type: 'email',
    required: true,
    order: 4,
    icon: Mail,
  },
  {
    id: '5',
    name: 'Phone Number',
    type: 'tel',
    required: true,
    order: 5,
    icon: Phone,
  },
  {
    id: '6',
    name: 'LinkedIn URL',
    type: 'url',
    required: false,
    order: 6,
    icon: Link,
    placeholder: 'https://linkedin.com/in/...',
  },
  {
    id: '7',
    name: 'Years of Experience',
    type: 'number',
    required: false,
    order: 7,
    icon: Hash,
  },
]

const fieldTypeOptions = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'tel', label: 'Phone', icon: Phone },
  { value: 'url', label: 'URL', icon: Link },
  { value: 'file', label: 'File Upload', icon: FileUp },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'textarea', label: 'Long Text', icon: FileText },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
]

export default function ApplicationFormSettingsPage() {
  const [fields, setFields] = useState(defaultFields)
  const [editingField, setEditingField] = useState<any>(null)
  const [addFieldDialog, setAddFieldDialog] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypeOptions.find((f) => f.value === type)
    return fieldType?.icon || Type
  }

  const handleToggleRequired = (fieldId: string) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f)))
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
  }

  const handleAddField = () => {
    const newField = {
      id: Date.now().toString(),
      name: newFieldName,
      type: newFieldType,
      required: newFieldRequired,
      order: fields.length + 1,
      icon: getFieldIcon(newFieldType),
    }
    setFields([...fields, newField])
    setAddFieldDialog(false)
    setNewFieldName('')
    setNewFieldType('text')
    setNewFieldRequired(false)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Application Form Templates</h3>
        <p className='text-sm text-muted-foreground'>Create and customize application forms for different job types</p>
      </div>
      <Separator />

      <div className='grid grid-cols-12 gap-6'>
        {/* Left Sidebar - Field Management */}
        <div className='col-span-4 space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Form Fields</CardTitle>
              <CardDescription>Manage fields in your application form</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {fields.map((field) => {
                const Icon = field.icon || getFieldIcon(field.type)
                return (
                  <div
                    key={field.id}
                    className='flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors'>
                    <GripVertical className='w-4 h-4 text-muted-foreground cursor-move' />
                    <Icon className='w-4 h-4 text-muted-foreground' />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>{field.name}</span>
                        {field.required && (
                          <Badge variant='secondary' className='text-xs'>
                            Required
                          </Badge>
                        )}
                      </div>
                      <span className='text-xs text-muted-foreground capitalize'>{field.type}</span>
                    </div>
                    <Checkbox checked={field.required} onCheckedChange={() => handleToggleRequired(field.id)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                          <MoreVertical className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => setEditingField(field)}>Edit Field</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteField(field.id)} className='text-destructive'>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}

              <Dialog open={addFieldDialog} onOpenChange={setAddFieldDialog}>
                <Button variant='outline' className='w-full mt-4' onClick={() => setAddFieldDialog(true)}>
                  <Plus className='w-4 h-4 mr-2' />
                  Add New Field
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                    <DialogDescription>Add a custom field to your application form</DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label>Field Name</Label>
                      <Input
                        placeholder='e.g., Portfolio URL'
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Field Type</Label>
                      <Select value={newFieldType} onValueChange={setNewFieldType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className='flex items-center gap-2'>
                                <type.icon className='w-4 h-4' />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch id='required' checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
                      <Label htmlFor='required'>Make this field required</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setAddFieldDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddField}>Add Field</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Template Name</Label>
                <Input defaultValue='Default Application Form' />
              </div>
              <div className='space-y-2'>
                <Label>Description</Label>
                <Textarea
                  placeholder='Describe when to use this form template...'
                  defaultValue='Standard application form for all positions'
                />
              </div>
              <div className='space-y-2'>
                <Label>Category</Label>
                <Select defaultValue='general'>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='general'>General</SelectItem>
                    <SelectItem value='engineering'>Engineering</SelectItem>
                    <SelectItem value='sales'>Sales</SelectItem>
                    <SelectItem value='marketing'>Marketing</SelectItem>
                    <SelectItem value='design'>Design</SelectItem>
                    <SelectItem value='operations'>Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Form Preview */}
        <div className='col-span-8'>
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>This is how candidates will see your application form</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='rounded-lg border p-6 bg-muted/50'>
                  <h3 className='text-lg font-semibold mb-1'>Software Engineer</h3>
                  <p className='text-sm text-muted-foreground mb-6'>
                    Please fill out the form below to apply for this position
                  </p>

                  <div className='space-y-4'>
                    {fields.map((field) => (
                      <div key={field.id} className='space-y-2'>
                        <Label>
                          {field.name}
                          {field.required && <span className='text-destructive ml-1'>*</span>}
                        </Label>

                        {field.type === 'text' && <Input placeholder={`Enter your ${field.name.toLowerCase()}`} />}

                        {field.type === 'email' && <Input type='email' placeholder='email@example.com' />}

                        {field.type === 'tel' && <Input type='tel' placeholder='+1 (555) 000-0000' />}

                        {field.type === 'url' && (
                          <Input type='url' placeholder={field.placeholder || 'https://example.com'} />
                        )}

                        {field.type === 'number' && <Input type='number' placeholder='0' />}

                        {field.type === 'date' && <Input type='date' />}

                        {field.type === 'file' && (
                          <div className='border-2 border-dashed rounded-lg p-4 text-center'>
                            <FileUp className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                            <p className='text-sm text-muted-foreground'>Click to upload or drag and drop</p>
                            {field.accepted_formats && (
                              <p className='text-xs text-muted-foreground mt-1'>{field.accepted_formats.join(', ')}</p>
                            )}
                          </div>
                        )}

                        {field.type === 'textarea' && (
                          <Textarea placeholder={`Enter your ${field.name.toLowerCase()}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className='mt-6 flex gap-3'>
                    <Button className='flex-1'>Submit Application</Button>
                    <Button variant='outline'>Save Draft</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
