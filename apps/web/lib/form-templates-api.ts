


export type FieldType = 'text' | 'number' | 'email' | 'tel' | 'url' | 'file' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea'

export interface FormField {
  id: string
  name: string
  type: FieldType
  required: boolean
  order: number
  placeholder?: string
  helpText?: string
  validation?: Record<string, any>
  options?: string[]
  groupWithNext?: boolean 
  width?: 'full' | 'half' | 'third' | 'two-thirds' 
}

export interface FormTemplate {
  id?: string
  name: string
  description?: string
  category?: string
  is_default?: boolean
  fields: FormField[]
  created_at?: string
  updated_at?: string
}

export interface FormTemplateListResponse {
  success: true
  data: FormTemplate[]
  metadata: {
    count: number
    total: number
    page: number
    limit: number
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

export interface FormTemplateResponse {
  success: true
  data: FormTemplate
  metadata: {
    processingTimeMs: number
    correlationId: string
    timestamp: string
  }
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string[]
  }
  timestamp: string
  correlationId: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '3ZJMPsS1DKLUgn1MpJ3ZnTdq'

export class FormTemplateApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: string[]
  ) {
    super(message)
    this.name = 'FormTemplateApiError'
  }
}

async function makeFormTemplateApiRequest<T>(
  endpoint: string,
  options?: {
    method?: string
    body?: any
    headers?: Record<string, string>
  }
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1/public/manage/forms${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    ...options?.headers,
  }
  
  const body = options?.body ? JSON.stringify(options.body) : undefined
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Form Template API request:', {
      url,
      method: options?.method || 'GET',
      hasAuth: !!API_KEY,
    })
  }
  
  try {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers,
      body,
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as ApiErrorResponse
      throw new FormTemplateApiError(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'An unknown error occurred',
        response.status,
        errorData.error?.details
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof FormTemplateApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'TypeError') {
      throw new FormTemplateApiError(
        'NETWORK_ERROR',
        'Failed to connect to the API. Please check your internet connection.',
        0
      )
    }

    throw new FormTemplateApiError(
      'FETCH_ERROR',
      'An error occurred while communicating with the API.',
      500
    )
  }
}


export async function getFormTemplates(
  page = 1,
  limit = 20
): Promise<FormTemplateListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  return makeFormTemplateApiRequest<FormTemplateListResponse>(`?${params.toString()}`)
}


export async function getFormTemplate(id: string): Promise<FormTemplateResponse> {
  return makeFormTemplateApiRequest<FormTemplateResponse>(`/${id}`)
}


export async function createFormTemplate(
  template: Omit<FormTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<FormTemplateResponse> {
  return makeFormTemplateApiRequest<FormTemplateResponse>('', {
    method: 'POST',
    body: template,
  })
}


export async function updateFormTemplate(
  id: string,
  updates: Partial<Omit<FormTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<FormTemplateResponse> {
  return makeFormTemplateApiRequest<FormTemplateResponse>(`/${id}`, {
    method: 'PUT',
    body: updates,
  })
}


export async function deleteFormTemplate(id: string): Promise<{ success: true }> {
  return makeFormTemplateApiRequest<{ success: true }>(`/${id}`, {
    method: 'DELETE',
  })
}


export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getDefaultFieldConfig(type: FieldType): Partial<FormField> {
  const defaults: Record<FieldType, Partial<FormField>> = {
    text: {
      placeholder: 'Enter text...',
      validation: { min_length: 1, max_length: 255 }
    },
    number: {
      placeholder: '0',
      validation: { min: 0 }
    },
    email: {
      placeholder: 'your@email.com',
      validation: {}
    },
    tel: {
      placeholder: '+1 (555) 000-0000',
      validation: {}
    },
    url: {
      placeholder: 'https://example.com',
      validation: {}
    },
    file: {
      helpText: 'Supported formats: PDF, DOCX, TXT',
      validation: { accepted_formats: ['.pdf', '.docx', '.txt'], max_size_mb: 10 }
    },
    date: {
      placeholder: 'Select date...',
      validation: {}
    },
    select: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      validation: {}
    },
    checkbox: {
      validation: {}
    },
    radio: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      validation: {}
    },
    textarea: {
      placeholder: 'Enter detailed text...',
      validation: { min_length: 1, max_length: 1000 }
    }
  }
  
  return defaults[type] || {}
}

export function validateFormField(field: FormField): string[] {
  const errors: string[] = []
  
  if (!field.name?.trim()) {
    errors.push('Field name is required')
  }
  
  if (!field.type) {
    errors.push('Field type is required')
  }
  
  if (typeof field.order !== 'number' || field.order < 1) {
    errors.push('Field order must be a positive number')
  }
  
  if (field.type === 'select' || field.type === 'radio') {
    if (!field.options || field.options.length === 0) {
      errors.push(`${field.type} field requires at least one option`)
    }
  }
  
  return errors
}

export function validateFormTemplate(template: FormTemplate): string[] {
  const errors: string[] = []
  
  if (!template.name?.trim()) {
    errors.push('Template name is required')
  }
  
  if (!template.fields || template.fields.length === 0) {
    errors.push('Template must have at least one field')
  }
  
  
  const orders = template.fields.map(f => f.order)
  const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
  if (duplicateOrders.length > 0) {
    errors.push(`Duplicate field orders found: ${duplicateOrders.join(', ')}`)
  }
  
  
  template.fields.forEach((field, index) => {
    const fieldErrors = validateFormField(field)
    fieldErrors.forEach(error => {
      errors.push(`Field ${index + 1}: ${error}`)
    })
  })
  
  return errors
}