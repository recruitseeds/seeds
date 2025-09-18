'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, X, GripVertical, Eye, Save, ArrowLeft } from 'lucide-react'
import {
  getFormTemplate,
  updateFormTemplate,
  generateFieldId,
  getDefaultFieldConfig,
  validateFormTemplate,
  type FormTemplate,
  type FormField,
  type FieldType,
  FormTemplateApiError
} from '../../../../../lib/form-templates-api'

export default function EditFormTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const fieldTypes: { value: FieldType; label: string; icon: string }[] = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'tel', label: 'Phone', icon: '📞' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'select', label: 'Dropdown', icon: '📋' },
    { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'textarea', label: 'Long Text', icon: '📄' }
  ]

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      setErrors([])
      const response = await getFormTemplate(templateId)
      setTemplate(response.data)
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setErrors([err.message])
      } else {
        setErrors(['Failed to load form template'])
      }
    } finally {
      setLoading(false)
    }
  }

  const addField = useCallback((type: FieldType) => {
    if (!template) return
    
    const newField: FormField = {
      id: generateFieldId(),
      name: `New ${type} field`,
      type,
      required: false,
      order: template.fields.length + 1,
      ...getDefaultFieldConfig(type)
    }
    
    setTemplate(prev => prev ? ({
      ...prev,
      fields: [...prev.fields, newField]
    }) : null)
  }, [template])

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    if (!template) return
    
    setTemplate(prev => prev ? ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }) : null)
  }, [template])

  const removeField = useCallback((fieldId: string) => {
    if (!template) return
    
    setTemplate(prev => prev ? ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
        .map((field, index) => ({ ...field, order: index + 1 }))
    }) : null)
  }, [template])

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !template) return
    
    setTemplate(prev => {
      if (!prev) return null
      
      const newFields = [...prev.fields]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      
      
      return {
        ...prev,
        fields: newFields.map((field, index) => ({ ...field, order: index + 1 }))
      }
    })
  }, [template])

  const handleSave = async () => {
    if (!template) return
    
    setErrors([])
    
    
    const validationErrors = validateFormTemplate(template)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    try {
      setSaving(true)
      const { id, created_at, updated_at, ...updateData } = template
      await updateFormTemplate(templateId, updateData)
      router.push('/settings/application')
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setErrors([err.message])
        if (err.details) {
          setErrors(prev => [...prev, ...err.details!])
        }
      } else {
        setErrors(['Failed to save form template'])
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem !== null && draggedItem !== index) {
      moveField(draggedItem, index)
      setDraggedItem(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading template...</span>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Template not found</div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Form Template</h1>
            <p className="text-gray-600">Modify your application form template</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium mb-2">Please fix the following errors:</div>
          <ul className="text-red-600 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Builder - Same as New Template */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Engineering Application Form"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={template.description || ''}
                  onChange={(e) => setTemplate(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe when and how this template should be used..."
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={template.category || 'general'}
                    onChange={(e) => setTemplate(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="engineering">Engineering</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="design">Design</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={template.is_default || false}
                    onChange={(e) => setTemplate(prev => prev ? ({ ...prev, is_default: e.target.checked }) : null)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                    Set as default template
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h3>
            
            {template.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No fields yet. Add your first field from the panel on the right.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {template.fields.map((field, index) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    index={index}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedItem === index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Field Types Panel - Same as New Template */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Fields</h3>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => (
                <button
                  key={fieldType.value}
                  onClick={() => addField(fieldType.value)}
                  className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-lg">{fieldType.icon}</span>
                  <span className="font-medium text-gray-900">{fieldType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fields:</span>
                <span className="font-medium">{template.fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Required Fields:</span>
                <span className="font-medium">{template.fields.filter(f => f.required).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Fields:</span>
                <span className="font-medium">{template.fields.filter(f => f.type === 'file').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{new Date(template.created_at || '').toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{new Date(template.updated_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal - Same as New Template */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <FormPreview template={template} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




interface FieldEditorProps {
  field: FormField
  index: number
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  isDragging: boolean
}

function FieldEditor({
  field,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{field.name}</div>
            <div className="text-sm text-gray-500 capitalize">
              {field.type} {field.required && '• Required'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isExpanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Required field</label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder Text
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          
          {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
                rows={3}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FormPreview({ template }: { template: FormTemplate }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
        {template.description && (
          <p className="text-gray-600 mt-1">{template.description}</p>
        )}
      </div>
      
      <form className="space-y-4">
        {template.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  disabled
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                >
                  <option value="">Select...</option>
                  {field.options?.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {field.options?.map((option, i) => (
                    <label key={i} className="flex items-center">
                      <input
                        type="radio"
                        name={field.id}
                        value={option}
                        className="h-4 w-4 text-blue-600"
                        disabled
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    disabled
                  />
                  <span className="ml-2 text-sm text-gray-700">{field.placeholder || 'Check if applicable'}</span>
                </label>
              ) : field.type === 'file' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="text-gray-600">Click to upload or drag and drop</div>
                  <div className="text-sm text-gray-500 mt-1">{field.helpText}</div>
                </div>
              ) : (
                <input
                  type={field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : field.type}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled
                />
              )}
              
              {field.helpText && (
                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
          ))}
      </form>
    </div>
  )
}