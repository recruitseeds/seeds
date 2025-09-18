'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Dialog as AriaDialog,
  DialogContent as AriaDialogContent,
  DialogDescription as AriaDialogDescription,
  DialogFooter as AriaDialogFooter,
  DialogHeader as AriaDialogHeader,
  DialogTitle as AriaDialogTitle,
} from '@/components/ui/dialog-react-aria'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/components/ui/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createFormTemplate,
  deleteFormTemplate,
  FormTemplateApiError,
  generateFieldId,
  getDefaultFieldConfig,
  getFormTemplates,
  updateFormTemplate,
  validateFormTemplate,
  type FieldType,
  type FormField,
  type FormTemplate,
} from '@/lib/form-templates-api'
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  Columns,
  Edit3,
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
  Save,
  Settings,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  { value: 'radio', label: 'Radio Group', icon: CheckSquare },
]

const groupColors = [
  {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200 dark:border-pink-800',
  },
  {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800',
  },
  {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
  },
  {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
]

interface ApplicationFormSettingsClientProps {
  initialTemplates: FormTemplate[]
  initialSelectedTemplateId?: string
}

export default function ApplicationFormSettingsClient({
  initialTemplates,
  initialSelectedTemplateId,
}: ApplicationFormSettingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [templates, setTemplates] = useState<FormTemplate[]>(initialTemplates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    () => {
      if (initialSelectedTemplateId) {
        return initialTemplates.find(t => t.id === initialSelectedTemplateId) || null
      }
      return initialTemplates.length > 0 ? initialTemplates[0] : null
    }
  )

  const [editFieldDialog, setEditFieldDialog] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [addFieldDialog, setAddFieldDialog] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<FieldType>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  
  const [showTemplateSettingsDialog, setShowTemplateSettingsDialog] =
    useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateCategory, setTemplateCategory] = useState('general')
  const [isDefaultTemplate, setIsDefaultTemplate] = useState(false)
  const [saving, setSaving] = useState(false)

  
  const [showPreview, setShowPreview] = useState(false)

  const updateSelectedTemplateWithUrl = (template: FormTemplate | null) => {
    setSelectedTemplate(template)
    if (template?.id) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('template', template.id)
      router.replace(`?${params.toString()}`)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('template')
      router.replace(`?${params.toString()}`)
    }
  }

  const refreshTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getFormTemplates()
      setTemplates(response.data)
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setError(err.message)
      } else {
        setError('Failed to load form templates')
      }
    } finally {
      setLoading(false)
    }
  }

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypeOptions.find((f) => f.value === type)
    return fieldType?.icon || Type
  }

  const getCurrentFields = () => {
    return selectedTemplate?.fields || []
  }

  const updateSelectedTemplate = (updates: Partial<FormTemplate>) => {
    if (!selectedTemplate) return

    const updatedTemplate = { ...selectedTemplate, ...updates }
    setSelectedTemplate(updatedTemplate)
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplate.id ? updatedTemplate : t))
    )
  }

  const handleToggleRequired = (fieldId: string) => {
    if (!selectedTemplate) return

    const updatedFields = selectedTemplate.fields.map((f) =>
      f.id === fieldId ? { ...f, required: !f.required } : f
    )
    updateSelectedTemplate({ fields: updatedFields })
  }

  const handleToggleGroupWithNext = (fieldId: string) => {
    if (!selectedTemplate) return

    const updatedFields = selectedTemplate.fields.map((f) =>
      f.id === fieldId ? { ...f, groupWithNext: !f.groupWithNext } : f
    )
    updateSelectedTemplate({ fields: updatedFields })
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTemplate) return

    const updatedFields = selectedTemplate.fields
      .filter((f) => f.id !== fieldId)
      .map((field, index) => ({ ...field, order: index + 1 }))

    updateSelectedTemplate({ fields: updatedFields })
  }

  const handleAddField = () => {
    if (!selectedTemplate) return

    const newField: FormField = {
      id: generateFieldId(),
      name: newFieldName,
      type: newFieldType,
      required: newFieldRequired,
      order: selectedTemplate.fields.length + 1,
      ...getDefaultFieldConfig(newFieldType),
    }

    updateSelectedTemplate({ fields: [...selectedTemplate.fields, newField] })
    setAddFieldDialog(false)
    setNewFieldName('')
    setNewFieldType('text')
    setNewFieldRequired(false)
  }

  const handleOpenSaveDialog = () => {
    if (!selectedTemplate) return

    setTemplateName(selectedTemplate.name)
    setTemplateDescription(selectedTemplate.description || '')
    setTemplateCategory(selectedTemplate.category || 'general')
    setIsDefaultTemplate(selectedTemplate.is_default || false)
    setShowTemplateSettingsDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    const templateToSave = {
      ...selectedTemplate,
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      is_default: isDefaultTemplate,
    }

    const validationErrors = validateFormTemplate(templateToSave)
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (selectedTemplate.id) {
        
        const { id, created_at, updated_at, ...updateData } = templateToSave
        await updateFormTemplate(selectedTemplate.id, updateData)
      } else {
        
        const { id, created_at, updated_at, ...createData } = templateToSave
        const response = await createFormTemplate(createData)
        setSelectedTemplate(response.data)
        setTemplates((prev) => [...prev, response.data])
      }

      
      const refreshResponse = await getFormTemplates()
      setTemplates(refreshResponse.data)
      
      
      if (selectedTemplate?.id) {
        const refreshedTemplate = refreshResponse.data.find(t => t.id === selectedTemplate.id)
        if (refreshedTemplate) {
          setSelectedTemplate(refreshedTemplate)
        }
      }
      
      setShowTemplateSettingsDialog(false)
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setError(err.message)
      } else {
        setError('Failed to save template')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteFormTemplate(templateId)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))

      
      if (selectedTemplate?.id === templateId) {
        const remaining = templates.filter((t) => t.id !== templateId)
        updateSelectedTemplateWithUrl(
          remaining.length > 0 ? remaining[0] : null
        )
      }
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setError(err.message)
      } else {
        setError('Failed to delete template')
      }
    }
  }

  const handleCreateNewTemplate = () => {
    const newTemplate: FormTemplate = {
      name: 'New Template',
      description: '',
      category: 'general',
      is_default: false,
      fields: [
        {
          id: generateFieldId(),
          name: 'Full Name',
          type: 'text',
          required: true,
          order: 1,
          placeholder: 'Enter your full name',
        },
        {
          id: generateFieldId(),
          name: 'Email Address',
          type: 'email',
          required: true,
          order: 2,
          placeholder: 'your@email.com',
        },
        {
          id: generateFieldId(),
          name: 'Phone Number',
          type: 'tel',
          required: true,
          order: 3,
          placeholder: '+1 (555) 000-0000',
        },
        {
          id: generateFieldId(),
          name: 'Resume',
          type: 'file',
          required: true,
          order: 4,
          helpText: 'PDF or DOCX format (max 10MB)',
        },
        {
          id: generateFieldId(),
          name: 'Cover Letter',
          type: 'file',
          required: false,
          order: 5,
          helpText: 'Optional - PDF or DOCX format',
        },
        {
          id: generateFieldId(),
          name: 'LinkedIn Profile',
          type: 'url',
          required: false,
          order: 6,
          placeholder: 'https://example.com'
        },
      ],
    }
    updateSelectedTemplateWithUrl(newTemplate)
  }

  const handleEditField = (field: FormField) => {
    setEditingField(field)
    setEditFieldDialog(true)
  }

  const handleUpdateField = () => {
    if (!editingField || !selectedTemplate) return

    const updatedFields = selectedTemplate.fields.map((f) =>
      f.id === editingField.id ? editingField : f
    )
    updateSelectedTemplate({ fields: updatedFields })

    
    setEditingField(null)
    setEditFieldDialog(false)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnd = () => {
    
    setDraggedIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (
      draggedIndex === null ||
      draggedIndex === dropIndex ||
      !selectedTemplate
    ) {
      setDraggedIndex(null)
      return
    }

    const fields = [...selectedTemplate.fields]
    const draggedField = fields[draggedIndex]

    
    fields.splice(draggedIndex, 1)

    
    fields.splice(dropIndex, 0, draggedField)

    
    const reorderedFields = fields.map((field, index) => ({
      ...field,
      order: index + 1,
      
      groupWithNext: field.id === draggedField.id ? false : field.groupWithNext
    }))

    updateSelectedTemplate({ fields: reorderedFields })
    setDraggedIndex(null)
  }

  
  const getFieldGroupInfo = (fieldIndex: number) => {
    const fields = getCurrentFields()
    let groupIndex = -1
    let currentGroupNumber = -1

    
    let groupCounter = 0
    const fieldGroupMapping: number[] = []

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const prevField = i > 0 ? fields[i - 1] : null

      if (field.groupWithNext) {
        
        if (!prevField?.groupWithNext) {
          
          fieldGroupMapping[i] = groupCounter
          groupCounter++
        } else {
          
          fieldGroupMapping[i] = fieldGroupMapping[i - 1]
        }
      } else if (prevField?.groupWithNext) {
        
        fieldGroupMapping[i] = fieldGroupMapping[i - 1]
      } else {
        
        fieldGroupMapping[i] = -1
      }
    }

    
    currentGroupNumber = fieldGroupMapping[fieldIndex] ?? -1
    const isGrouped = currentGroupNumber >= 0

    if (isGrouped) {
      groupIndex = currentGroupNumber % groupColors.length
    }

    return { isGrouped, groupIndex }
  }

  
  const getFieldGroups = () => {
    const fields = getCurrentFields()
    const groups: FormField[][] = []
    let currentGroup: FormField[] = []

    fields.forEach((field, index) => {
      currentGroup.push(field)

      if (!field.groupWithNext || index === fields.length - 1) {
        groups.push(currentGroup)
        currentGroup = []
      }
    })

    return groups
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='ml-2 text-gray-600'>Loading templates...</span>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='mb-6'>
        <h3 className='text-lg font-medium'>Application Form Templates</h3>
        <p className='text-sm text-muted-foreground'>
          Create and customize application forms for different job types
        </p>
      </div>

      {/* Template Controls */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-6'>
        <div className='flex flex-col sm:flex-row gap-2 sm:flex-1'>
          {/* Template Selector Dropdown */}
          <Select
            value={selectedTemplate?.id || 'new'}
            onValueChange={(value) => {
              if (value === 'new') {
                handleCreateNewTemplate()
              } else {
                const template = templates.find((t) => t.id === value)
                if (template) updateSelectedTemplateWithUrl(template)
              }
            }}>
            <SelectTrigger className='w-full sm:w-[250px] h-7'>
              <SelectValue placeholder='Select a template' />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id!}>
                  <div className='flex items-center gap-2'>
                    <span>{template.name}</span>
                    {template.is_default && (
                      <Badge variant='secondary' className='text-xs'>
                        Default
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              <Separator className='my-1' />
              <SelectItem value='new'>
                <div className='flex items-center gap-2'>
                  <Plus className='w-4 h-4' />
                  <span>Create New Template</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className='flex gap-2'>
            {selectedTemplate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='icon' className='h-7 w-7'>
                    <MoreVertical className='w-3.5 h-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {selectedTemplate.id && (
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => handleDeleteTemplate(selectedTemplate.id!)}>
                      <Trash2 className='w-4 h-4 mr-2' />
                      Delete Template
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button onClick={handleOpenSaveDialog} disabled={!selectedTemplate}>
              <Save className='w-4 h-4 md:mr-2' />
              <span className='hidden md:inline'>Save Template</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex'>
            <AlertCircle className='w-5 h-5 text-red-600 mr-2 flex-shrink-0' />
            <div className='text-red-600 text-sm'>{error}</div>
            <button
              onClick={() => setError(null)}
              className='ml-auto text-red-600 hover:text-red-800'>
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {selectedTemplate ? (
        <div className='flex flex-col xl:grid xl:grid-cols-12 gap-6'>
          {/* Left Side - Form Fields (Full width on mobile, 5 cols on desktop) */}
          <div className='lg:col-span-5 space-y-4'>
            <Card className='border-none m-0 p-0'>
              <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Settings className='w-5 h-5' />
                  Form Fields
                </CardTitle>
                <CardDescription>
                  Drag to reorder, click to edit field properties
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {getCurrentFields().length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <FileText className='w-12 h-12 mx-auto mb-3 opacity-50' />
                    <p className='text-sm'>No fields yet</p>
                    <p className='text-xs mt-1'>
                      Add your first field to get started
                    </p>
                  </div>
                ) : (
                  getCurrentFields().map((field, index) => {
                    const Icon = getFieldIcon(field.type)
                    const { isGrouped, groupIndex } = getFieldGroupInfo(index)
                    const groupColor =
                      groupIndex >= 0 ? groupColors[groupIndex] : null
                    
                    const canStartGroup = index < getCurrentFields().length - 1 && !field.groupWithNext && !isGrouped
                    const canUngroup = isGrouped && field.groupWithNext 
                    const showGroupButton = canStartGroup || canUngroup

                    return (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          draggedIndex === index && 'opacity-50',
                          
                          isGrouped && groupColor
                            ? `${groupColor.bg} ${groupColor.border}`
                            : 'bg-card border-border'
                        )}>
                        <GripVertical className='w-4 h-4 text-muted-foreground cursor-move' />
                        <Icon className='w-4 h-4 text-muted-foreground' />

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium truncate'>
                              {field.name}
                            </span>
                            {field.required && (
                              <span className='text-red-500 text-sm'>*</span>
                            )}
                          </div>
                          <span className='text-xs text-muted-foreground capitalize'>
                            {field.type}
                          </span>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={() =>
                              handleToggleRequired(field.id)
                            }
                            title='Required field'
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'>
                                <MoreVertical className='w-3.5 h-3.5' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='space-y-1'>
                              {showGroupButton && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleToggleGroupWithNext(field.id)
                                  }>
                                  <Columns className='w-4 h-4 mr-2' />
                                  {canUngroup
                                    ? 'Ungroup fields'
                                    : 'Group with next'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleEditField(field)}>
                                <Edit3 className='w-4 h-4 mr-2' />
                                Edit Field
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteField(field.id)}
                                className='text-destructive'
                                variant='destructive'>
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })
                )}

                <Button
                  variant='outline'
                  className='w-full mt-4'
                  onClick={() => setAddFieldDialog(true)}>
                  <Plus className='w-4 h-4 mr-2' />
                  Add New Field
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Form Preview (Full width on mobile, 7 cols on desktop) */}
          <div className='lg:col-span-7'>
            <Card className='border-none p-0 m-0'>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
                <CardDescription>
                  This is how candidates will see your application form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='rounded-lg border p-6 bg-muted/50'>
                  <h3 className='text-lg font-semibold mb-1'>
                    Job Application
                  </h3>
                  <p className='text-sm text-muted-foreground mb-6'>
                    Please fill out the form below to apply for this position
                  </p>

                  <div className='space-y-4'>
                    {getFieldGroups().map((group, groupIndex) => (
                      <div
                        key={groupIndex}
                        className={cn(
                          'grid gap-4',
                          group.length > 1 && group[0].groupWithNext
                            ? 'md:grid-cols-2'
                            : 'grid-cols-1'
                        )}>
                        {group.map((field) => (
                          <div key={field.id} className='space-y-2'>
                            <Label>
                              {field.name}
                              {field.required && (
                                <span className='text-destructive ml-1'>*</span>
                              )}
                            </Label>

                            {field.type === 'text' && (
                              <Input
                                placeholder={
                                  field.placeholder ||
                                  `Enter your ${field.name.toLowerCase()}`
                                }
                              />
                            )}

                            {field.type === 'email' && (
                              <Input
                                type='email'
                                placeholder={
                                  field.placeholder || 'email@example.com'
                                }
                              />
                            )}

                            {field.type === 'tel' && (
                              <Input
                                type='tel'
                                placeholder={
                                  field.placeholder || '+1 (555) 000-0000'
                                }
                              />
                            )}

                            {field.type === 'url' && (
                              <Input
                                type='url'
                                placeholder={
                                  field.placeholder || 'https://example.com'//example.com'
                                }
                              />
                            )}

                            {field.type === 'number' && (
                              <Input
                                type='number'
                                placeholder={field.placeholder || '0'}
                              />
                            )}

                            {field.type === 'date' && <DatePicker selected={undefined} onSelect={() => {}} placeholder={field.placeholder || 'Select date'} />}

                            {field.type === 'file' && (
                              <div className='border-2 border-dashed rounded-lg p-4 text-center'>
                                <FileUp className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                                <p className='text-sm text-muted-foreground'>
                                  Click to upload or drag and drop
                                </p>
                                {field.helpText && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    {field.helpText}
                                  </p>
                                )}
                              </div>
                            )}

                            {field.type === 'textarea' && (
                              <Textarea
                                placeholder={
                                  field.placeholder ||
                                  `Enter your ${field.name.toLowerCase()}`
                                }
                              />
                            )}

                            {field.type === 'select' && (
                              <Select>
                                <SelectTrigger className='h-7.5'>
                                  <SelectValue
                                    placeholder={
                                      field.placeholder || 'Select...'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option, i) => (
                                    <SelectItem key={i} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {field.type === 'checkbox' && (
                              <div className='flex items-center space-x-2'>
                                <Checkbox />
                                <Label>
                                  {field.placeholder || 'Check if applicable'}
                                </Label>
                              </div>
                            )}

                            {field.type === 'radio' && (
                              <div className='space-y-2'>
                                {field.options?.map((option, i) => (
                                  <div
                                    key={i}
                                    className='flex items-center space-x-2'>
                                    <input type='radio' name={field.id} />
                                    <Label>{option}</Label>
                                  </div>
                                ))}
                              </div>
                            )}

                            {field.helpText && field.type !== 'file' && (
                              <p className='text-xs text-muted-foreground'>
                                {field.helpText}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {getCurrentFields().length === 0 && (
                      <div className='text-center py-8 text-muted-foreground'>
                        <p>No fields yet. Add fields to see the preview.</p>
                      </div>
                    )}
                  </div>

                  {getCurrentFields().length > 0 && (
                    <div className='mt-6 flex gap-3'>
                      <Button className='flex-1'>Submit Application</Button>
                      <Button variant='outline'>Save Draft</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <FileText className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-medium mb-2'>No template selected</h3>
            <p className='text-sm text-muted-foreground text-center mb-4'>
              Create a new template to get started
            </p>
            <Button onClick={handleCreateNewTemplate}>
              <Plus className='h-4 w-4 mr-2' />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Field Dialog - React Aria Version */}
      <AriaDialog open={addFieldDialog} onOpenChange={setAddFieldDialog}>
        <AriaDialogContent>
          <AriaDialogHeader>
            <AriaDialogTitle>Add New Field</AriaDialogTitle>
            <AriaDialogDescription>
              Add a custom field to your application form
            </AriaDialogDescription>
          </AriaDialogHeader>
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
              <Select
                value={newFieldType}
                onValueChange={(value) => setNewFieldType(value as FieldType)}>
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
              <Switch
                id='required'
                checked={newFieldRequired}
                onCheckedChange={setNewFieldRequired}
              />
              <Label htmlFor='required'>Make this field required</Label>
            </div>
          </div>
          <AriaDialogFooter>
            <Button variant='outline' onClick={() => setAddFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddField} disabled={!newFieldName.trim()}>
              Add Field
            </Button>
          </AriaDialogFooter>
        </AriaDialogContent>
      </AriaDialog>

      {/* Template Settings Dialog */}
      <Dialog
        open={showTemplateSettingsDialog}
        onOpenChange={setShowTemplateSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Configure your form template details
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Template Name</Label>
              <Input
                placeholder='e.g., Engineering Application Form'
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Description</Label>
              <Textarea
                placeholder='Describe when to use this form template...'
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select
                value={templateCategory}
                onValueChange={setTemplateCategory}>
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
            <div className='flex items-center space-x-2'>
              <Switch
                id='is_default_dialog'
                checked={isDefaultTemplate}
                onCheckedChange={setIsDefaultTemplate}
              />
              <Label htmlFor='is_default_dialog'>Set as default template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowTemplateSettingsDialog(false)}
              disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog - React Aria Version */}
      <AriaDialog
        open={editFieldDialog}
        onOpenChange={(open) => {
          setEditFieldDialog(open)
          if (!open) {
            setEditingField(null)
          }
        }}>
        <AriaDialogContent>
          <AriaDialogHeader>
            <AriaDialogTitle>Edit Field</AriaDialogTitle>
            <AriaDialogDescription>
              Modify the field properties
            </AriaDialogDescription>
          </AriaDialogHeader>
          {editingField && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Field Name</Label>
                <Input
                  value={editingField.name}
                  onChange={(e) =>
                    setEditingField({ ...editingField, name: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Placeholder Text</Label>
                <Input
                  value={editingField.placeholder || ''}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      placeholder: e.target.value,
                    })
                  }
                />
              </div>
              {(editingField.type === 'select' ||
                editingField.type === 'radio') && (
                <div className='space-y-2'>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={(editingField.options || []).join('\n')}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value
                          .split('\n')
                          .filter((o) => o.trim()),
                      })
                    }
                    rows={4}
                    placeholder='Option 1&#10;Option 2&#10;Option 3'
                  />
                </div>
              )}
              <div className='flex items-center space-x-2'>
                <Switch
                  id='edit_required'
                  checked={editingField.required}
                  onCheckedChange={(checked) =>
                    setEditingField({ ...editingField, required: checked })
                  }
                />
                <Label htmlFor='edit_required'>Required field</Label>
              </div>
            </div>
          )}
          <AriaDialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditFieldDialog(false)
                setEditingField(null)
              }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateField}>Update Field</Button>
          </AriaDialogFooter>
        </AriaDialogContent>
      </AriaDialog>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className='max-w-3xl max-h-[90vh] overflow-hidden'>
            <DialogHeader>
              <DialogTitle>Form Preview - {selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                This is how the form will appear to candidates
              </DialogDescription>
            </DialogHeader>
            <div className='overflow-y-auto max-h-[70vh] p-4'>
              <div className='space-y-4'>
                {getFieldGroups().map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={cn(
                      'grid gap-4',
                      group.length > 1 && group[0].groupWithNext
                        ? 'md:grid-cols-2'
                        : 'grid-cols-1'
                    )}>
                    {group.map((field) => (
                      <div key={field.id} className='space-y-2'>
                        <Label>
                          {field.name}
                          {field.required && (
                            <span className='text-destructive ml-1'>*</span>
                          )}
                        </Label>

                        {field.type === 'text' && (
                          <Input
                            placeholder={
                              field.placeholder ||
                              `Enter your ${field.name.toLowerCase()}`
                            }
                          />
                        )}
                        {field.type === 'email' && (
                          <Input
                            type='email'
                            placeholder={
                              field.placeholder || 'email@example.com'
                            }
                          />
                        )}
                        {field.type === 'tel' && (
                          <Input
                            type='tel'
                            placeholder={
                              field.placeholder || '+1 (555) 000-0000'
                            }
                          />
                        )}
                        {field.type === 'url' && (
                          <Input
                            type='url'
                            placeholder={
                              field.placeholder || 'https://example.com'
                            }
                          />
                        )}
                        {field.type === 'number' && (
                          <Input
                            type='number'
                            placeholder={field.placeholder || '0'}
                          />
                        )}
                        {field.type === 'date' && <DatePicker selected={undefined} onSelect={() => {}} placeholder={field.placeholder || 'Select date'} />}
                        {field.type === 'file' && (
                          <div className='border-2 border-dashed rounded-lg p-4 text-center'>
                            <FileUp className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                            <p className='text-sm text-muted-foreground'>
                              Click to upload or drag and drop
                            </p>
                            {field.helpText && (
                              <p className='text-xs text-muted-foreground mt-1'>
                                {field.helpText}
                              </p>
                            )}
                          </div>
                        )}
                        {field.type === 'textarea' && (
                          <Textarea
                            placeholder={
                              field.placeholder ||
                              `Enter your ${field.name.toLowerCase()}`
                            }
                            rows={3}
                          />
                        )}
                        {field.type === 'select' && (
                          <Select>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={field.placeholder || 'Select...'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, i) => (
                                <SelectItem key={i} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {field.type === 'checkbox' && (
                          <div className='flex items-center space-x-2'>
                            <Checkbox />
                            <Label>
                              {field.placeholder || 'Check if applicable'}
                            </Label>
                          </div>
                        )}
                        {field.type === 'radio' && (
                          <div className='space-y-2'>
                            {field.options?.map((option, i) => (
                              <div
                                key={i}
                                className='flex items-center space-x-2'>
                                <input type='radio' name={field.id} />
                                <Label>{option}</Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {field.helpText && field.type !== 'file' && (
                          <p className='text-xs text-muted-foreground'>
                            {field.helpText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {getCurrentFields().length > 0 && (
                <div className='mt-6 flex gap-3'>
                  <Button className='flex-1'>Submit Application</Button>
                  <Button variant='outline'>Save Draft</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
