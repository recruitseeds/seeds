'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TablesInsert } from '@/supabase/types/db'
import { useTRPC } from '@/trpc/client'
import type { AppRouter } from '@/trpc/routers/_app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TRPCClientErrorLike } from '@trpc/client'
import Papa from 'papaparse'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { CandidateApplicationFileUploader } from './candidate-application-file-uploader'

interface ImportCandidateApplicationsSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onApplicationsImported?: () => void
}

type ParsedApplication = Omit<
  TablesInsert<'candidate_applications'>,
  'candidate_id' | 'id' | 'created_at' | 'updated_at'
> & {
  application_date: string
}

export function ImportCandidateApplicationsSheet({
  isOpen,
  onOpenChange,
  onApplicationsImported,
}: ImportCandidateApplicationsSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedApplications, setParsedApplications] = useState<
    ParsedApplication[]
  >([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trpcClient = useTRPC()
  const queryClient = useQueryClient()

  const importMutation = useMutation(
    trpcClient.candidate.importApplications.mutationOptions({
      onSuccess: async (result) => {
        if (result.success) {
          await queryClient.invalidateQueries(
            trpcClient.candidate.listApplications.queryFilter()
          )
          onApplicationsImported?.()
          onOpenChange(false)
          resetState()
        } else {
          setError(
            `Import failed: ${result.errors?.join(', ') || 'Unknown error'}`
          )
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

        const headers = (
          type === 'excel' ? data[0] : Object.keys(data[0] || {})
        ) as string[]
        const mappedData: ParsedApplication[] = (
          type === 'excel' ? data.slice(1) : data
        )
          .map((row: any) => {
            const app: any = {}
            headers.forEach((header, index) => {
              const key = header.toString().toLowerCase().replace(/\s+/g, '_')
              const value = type === 'excel' ? row[index] : row[header]

              if (key === 'application_date' || key === 'next_step_date') {
                app[key] =
                  value instanceof Date
                    ? value.toISOString()
                    : typeof value === 'string'
                    ? value
                    : null
              } else {
                app[key] = value !== undefined ? String(value) : null
              }
            })
            return app as ParsedApplication
          })
          .filter(
            (app) => app.job_title && app.company_name && app.application_date
          )
        setParsedApplications(mappedData)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file.')
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
      importMutation.mutate(applicationsToImport as any)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-xl w-full overflow-y-auto px-8'>
        <SheetHeader>
          <SheetTitle>Import Applications</SheetTitle>
          <SheetDescription>
            Upload an Excel or CSV file to bulk import applications. Required
            headers: job_title, company_name, application_date. Dates should be
            parsable (e.g., YYYY-MM-DD).
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue='excel' className='py-6'>
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
            />
          </TabsContent>
        </Tabs>

        {error && <p className='text-sm text-destructive'>{error}</p>}

        {parsedApplications.length > 0 && !isProcessingFile && (
          <div className='mt-4'>
            <h3 className='text-md font-semibold mb-2'>
              Preview ({parsedApplications.length} applications found)
            </h3>
            <div className='max-h-60 overflow-y-auto border rounded-md p-2 text-xs bg-muted/50'>
              <pre>
                {JSON.stringify(parsedApplications.slice(0, 5), null, 2)}
              </pre>
              {parsedApplications.length > 5 && (
                <p>...and {parsedApplications.length - 5} more.</p>
              )}
            </div>
          </div>
        )}

        <SheetFooter className='pt-6'>
          <SheetClose asChild>
            <Button type='button' variant='outline' onClick={resetState}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            type='button'
            onClick={handleImportConfirm}
            disabled={
              isProcessingFile ||
              importMutation.isLoading ||
              parsedApplications.length === 0
            }>
            {importMutation.isLoading
              ? 'Importing...'
              : `Import ${parsedApplications.length} Applications`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
