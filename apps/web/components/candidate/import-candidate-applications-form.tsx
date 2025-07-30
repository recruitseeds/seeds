'use client'

import { Button } from '@seeds/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@seeds/ui/tabs'
import { parseDateString } from '@/lib/dates'
import type { TablesInsert } from '@/supabase/types/db'
import { useTRPC } from '@/trpc/client'
import type { AppRouter } from '@/trpc/routers/_app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TRPCClientErrorLike } from '@trpc/client'
import { isValid } from 'date-fns'
import Papa from 'papaparse'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { CandidateApplicationFileUploader } from './candidate-application-file-uploader'

interface ImportCandidateApplicationsContentProps {
  onApplicationsImported?: () => void
  onClose?: () => void
}

type ParsedApplication = Omit<
  TablesInsert<'candidate_applications'>,
  'candidate_id' | 'id' | 'created_at' | 'updated_at'
> & {
  application_date: string
  next_step_date?: string | null
}

export function ImportCandidateApplicationsContent({
  onApplicationsImported,
  onClose,
}: ImportCandidateApplicationsContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedApplications, setParsedApplications] = useState<ParsedApplication[]>([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  const importMutation = useMutation(
    trpcClient.candidate.importApplications.mutationOptions({
      onSuccess: async (result) => {
        if (result.success) {
          await queryClient.invalidateQueries(trpcClient.candidate.listApplications.queryFilter())
          onApplicationsImported?.()
          resetState()
          onClose?.()
        } else {
          setError(`Import failed: ${result.errors?.join(', ') || 'Unknown error'}`)
        }
      },
      onError: (err: TRPCClientErrorLike<AppRouter>) => {
        setError(`Import error: ${err.message}`)
      },
    })
  )

  const resetState = () => {
    setSelectedFile(null)
    setParsedApplications([])
    setError(null)
    setIsProcessingFile(false)
  }

  const handleFileParse = async (file: File, type: 'excel' | 'csv') => {
    setIsProcessingFile(true)
    setError(null)
    setParsedApplications([])
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const binaryStr = event.target?.result
        let data: any[] = []

        if (type === 'excel') {
          const workbook = XLSX.read(binaryStr, {
            type: 'binary',
            cellDates: true,
          })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
        } else {
          const text = event.target?.result as string
          const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          })
          data = result.data
        }

        const headers = (type === 'excel' ? data[0] : Object.keys(data[0] || {})) as string[]

        const mappedData: ParsedApplication[] = (type === 'excel' ? data.slice(1) : data)
          .map((row: any, rowIndex: number) => {
            const app: any = {}
            headers.forEach((header, index) => {
              const key = header.toString().toLowerCase().replace(/\s+/g, '_')
              const value = type === 'excel' ? row[index] : row[header]

              if (key === 'application_date' || key === 'next_step_date') {
                let finalDateString: string | null = null
                if (value instanceof Date && isValid(value)) {
                  finalDateString = value.toISOString()
                } else if (typeof value === 'string' && value.trim() !== '') {
                  let parsedD = parseDateString(value)
                  if (parsedD && isValid(parsedD)) {
                    finalDateString = parsedD.toISOString()
                  } else {
                    parsedD = new Date(value)
                    if (isValid(parsedD)) {
                      finalDateString = parsedD.toISOString()
                      console.warn(
                        `Row ${
                          rowIndex + 1
                        }: Used generic date parsing for ${key}: "${value}". Result: ${finalDateString}. Ensure this is correct.`
                      )
                    } else {
                      console.warn(
                        `Row ${rowIndex + 1}: Could not parse date string for ${key}: "${value}". Setting to null.`
                      )
                    }
                  }
                }
                app[key] = finalDateString
              } else if (key === 'application_url' || key === 'company_logo_url' || key === 'contact_email') {
                const strValue = value !== undefined && value !== null ? String(value).trim() : ''
                app[key] = strValue === '' ? null : strValue
              } else {
                app[key] = value !== undefined && value !== null ? String(value) : null
              }
            })

            if (!app.job_title || !app.company_name || !app.application_date) {
              console.warn(
                `Row ${
                  rowIndex + 1
                }: Skipping due to missing essential data (job_title, company_name, or application_date):`,
                JSON.stringify(app)
              )
              return null
            }
            return app as ParsedApplication
          })
          .filter(
            (app): app is ParsedApplication =>
              app !== null && !!app.job_title && !!app.company_name && !!app.application_date
          )

        setParsedApplications(mappedData)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file.')
        console.error('Error during file parsing:', e)
      } finally {
        setIsProcessingFile(false)
      }
    }

    if (type === 'excel') {
      reader.readAsBinaryString(file)
    } else {
      reader.readAsText(file)
    }
  }

  const handleImportConfirm = () => {
    if (parsedApplications.length > 0) {
      const applicationsToImport = parsedApplications.map((app) => ({
        ...app,
        status: app.status || 'applied',
        source: app.source || 'import',
      }))
      importMutation.mutate(applicationsToImport as TablesInsert<'candidate_applications'>[])
    }
  }

  return (
    <>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold'>Import Applications</h2>
        <p className='text-sm text-muted-foreground'>
          Upload an Excel or CSV file to bulk import applications. Required headers: job_title, company_name,
          application_date. Dates should be parsable (e.g., YYYY-MM-DD or ISO 8601).
        </p>
      </div>
      <Tabs defaultValue='excel' className='py-2'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='excel'>From Excel</TabsTrigger>
          <TabsTrigger value='csv'>From CSV</TabsTrigger>
        </TabsList>
        <TabsContent value='excel' className='space-y-4 pt-4'>
          <CandidateApplicationFileUploader
            onFileSelect={(file) => {
              setSelectedFile(file)
              if (file) handleFileParse(file, 'excel')
              else setParsedApplications([])
            }}
            accept='.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            disabled={isProcessingFile || importMutation.isLoading}
          />
        </TabsContent>
        <TabsContent value='csv' className='space-y-4 pt-4'>
          <CandidateApplicationFileUploader
            onFileSelect={(file) => {
              setSelectedFile(file)
              if (file) handleFileParse(file, 'csv')
              else setParsedApplications([])
            }}
            accept='.csv,text/csv'
            disabled={isProcessingFile || importMutation.isLoading}
          />
        </TabsContent>
      </Tabs>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      {parsedApplications.length > 0 && !isProcessingFile && (
        <div className='mt-4'>
          <h3 className='text-md font-semibold mb-2'>Preview ({parsedApplications.length} applications found)</h3>
          <div className='max-h-60 overflow-y-auto border rounded-md p-2 text-xs bg-muted/50'>
            <pre>{JSON.stringify(parsedApplications.slice(0, 5), null, 2)}</pre>
            {parsedApplications.length > 5 && <p>...and {parsedApplications.length - 5} more.</p>}
          </div>
        </div>
      )}

      <div className='flex justify-end gap-2 pt-4 mt-auto'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            resetState()
            onClose?.()
          }}
          disabled={importMutation.isLoading}>
          Cancel
        </Button>
        <Button
          type='button'
          onClick={handleImportConfirm}
          disabled={isProcessingFile || importMutation.isLoading || parsedApplications.length === 0}>
          {importMutation.isLoading ? 'Importing...' : `Import ${parsedApplications.length} Applications`}
        </Button>
      </div>
    </>
  )
}
