'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, Eye, Settings } from 'lucide-react'
import {
  getFormTemplates,
  deleteFormTemplate,
  type FormTemplate,
  FormTemplateApiError
} from '../../../lib/form-templates-api'

export default function ApplicationSettingsPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
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

  const handleDelete = async (templateId: string) => {
    try {
      await deleteFormTemplate(templateId)
      setTemplates(templates.filter(t => t.id !== templateId))
      setDeleteConfirm(null)
    } catch (err) {
      if (err instanceof FormTemplateApiError) {
        setError(err.message)
      } else {
        setError('Failed to delete form template')
      }
    }
  }

  const getFieldTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      email: 'bg-green-100 text-green-800',
      file: 'bg-orange-100 text-orange-800',
      select: 'bg-purple-100 text-purple-800',
      checkbox: 'bg-indigo-100 text-indigo-800',
      number: 'bg-yellow-100 text-yellow-800',
      tel: 'bg-teal-100 text-teal-800',
      url: 'bg-pink-100 text-pink-800',
      date: 'bg-red-100 text-red-800',
      radio: 'bg-gray-100 text-gray-800',
      textarea: 'bg-cyan-100 text-cyan-800'
    }
    
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading form templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Form Templates</h2>
          <p className="text-gray-600 mt-1">
            Create custom application forms that candidates will fill out when applying to your jobs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600 text-sm">
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No form templates yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first application form template to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {template.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {template.category}
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{template.fields.length} fields</span>
                    <span>•</span>
                    <span>
                      {template.fields.filter(f => f.required).length} required
                    </span>
                    <span>•</span>
                    <span>
                      Updated {new Date(template.updated_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/settings/application/${template.id}/preview`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.location.href = `/settings/application/${template.id}/edit`}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.location.href = `/settings/application/${template.id}/duplicate`}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template.id!)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Field Types Preview */}
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(template.fields.map(f => f.type))).map((type) => (
                  <span
                    key={type}
                    className={`px-2 py-1 text-xs rounded-full ${getFieldTypeBadge(type)}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this form template? This action cannot be undone.
              Jobs currently using this template may be affected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h3>
            <p className="text-gray-600 mb-6">
              Choose how you'd like to create your form template:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/settings/application/new'}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Start from scratch</div>
                <div className="text-sm text-gray-600">Build a custom form with our form builder</div>
              </button>
              <button
                onClick={() => window.location.href = '/settings/application/templates'}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Use a template</div>
                <div className="text-sm text-gray-600">Start with a pre-built template</div>
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}