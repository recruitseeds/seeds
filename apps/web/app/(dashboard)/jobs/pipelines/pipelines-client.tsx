'use client'

import { Container } from '@/components/container'
import { Briefcase, ClipboardText, EditorPencil, PlusCircle, Users } from '@/components/icons'
import { PipelineCreationForm } from '@/components/pipelines/pipeline-creation-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Clock, Edit3, Search, Target, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface Pipeline {
  id: string
  name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  pipeline_steps?: Array<{
    id: string
    name: string
    step_order: number
    description?: string
    duration_days?: number
  }>
}

interface PipelineListingClientProps {
  initialPipelines: Pipeline[]
}

export function PipelineListingClient({ initialPipelines }: PipelineListingClientProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  // Use live query with initial data for optimistic updates
  const { data: livePipelines } = useQuery({
    ...trpc.organization.listPipelines.queryOptions(),
    initialData: initialPipelines,
  })
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string>()
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [activeDepartment, setActiveDepartment] = useState<string>('All Departments')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Delete pipeline mutation
  const deletePipelineMutation = useMutation(
    trpc.organization.deletePipeline.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(
          trpc.organization.listPipelines.queryOptions()
        )

        // Snapshot the previous value
        const previousPipelines = queryClient.getQueryData(
          trpc.organization.listPipelines.queryOptions().queryKey
        )

        // Optimistically remove the pipeline
        if (previousPipelines) {
          queryClient.setQueryData(
            trpc.organization.listPipelines.queryOptions().queryKey,
            (previousPipelines as Pipeline[]).filter(p => p.id !== variables.id)
          )
        }

        return { previousPipelines }
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousPipelines) {
          queryClient.setQueryData(
            trpc.organization.listPipelines.queryOptions().queryKey,
            context.previousPipelines
          )
        }
        console.error('Failed to delete pipeline:', error.message)
      },
      onSuccess: () => {
        // Pipeline deleted successfully
        setShowDeleteDialog(false)
        setPipelineToDelete(null)
      },
    })
  )


  // Process and filter pipelines
  const processedPipelines = (livePipelines || []).map((pipeline: Pipeline) => {
    // For now, extract department from pipeline name or use 'General'
    const department = pipeline.name.includes('Engineer')
      ? 'Engineering'
      : pipeline.name.includes('Designer')
        ? 'Design'
        : pipeline.name.includes('Sales')
          ? 'Sales'
          : pipeline.name.includes('Marketing')
            ? 'Marketing'
            : 'General'

    return {
      ...pipeline,
      department,
      stages: pipeline.pipeline_steps?.length || 0,
      activeJobs: 0, // TODO: Calculate from job_postings
      activeCandidates: 0, // TODO: Calculate from applications
      lastUpdated: new Date(pipeline.updated_at || pipeline.created_at).toLocaleDateString(),
    }
  })

  // Filter pipelines based on search
  const filteredPipelines = processedPipelines.filter((pipeline) => {
    // Search filter
    const searchMatch = searchQuery === '' || 
      pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pipeline.description && pipeline.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return searchMatch
  })

  // Group filtered pipelines by department
  const groupedPipelines = filteredPipelines.reduce((acc: Record<string, any[]>, pipeline) => {
    if (!acc[pipeline.department]) {
      acc[pipeline.department] = []
    }
    acc[pipeline.department].push(pipeline)
    return acc
  }, {})

  const departments = Object.keys(groupedPipelines)

  // Add default departments if no pipelines exist, plus "All Departments"
  const allDepartments =
    departments.length > 0
      ? ['All Departments', ...departments]
      : ['All Departments', 'Engineering', 'Design', 'Sales', 'Marketing']

  // Set initial active department
  if (!activeDepartment && allDepartments.length > 0) {
    setActiveDepartment(allDepartments[0])
  }

  // Get pipelines for current department
  const currentPipelines =
    activeDepartment === 'All Departments' ? filteredPipelines : groupedPipelines[activeDepartment] || []

  const handleEditPipeline = (pipelineId: string) => {
    router.push(`/jobs/pipelines/edit/${pipelineId}`)
  }

  const handleViewPipeline = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setShowViewDialog(true)
  }

  const handleCreatePipeline = (department: string) => {
    setSelectedDepartment(department === 'All Departments' ? undefined : department)
    setShowCreateForm(true)
  }

  const handleDeletePipeline = (pipeline: Pipeline) => {
    setPipelineToDelete(pipeline)
    setShowDeleteDialog(true)
  }

  const confirmDeletePipeline = async () => {
    if (pipelineToDelete) {
      await deletePipelineMutation.mutateAsync({ id: pipelineToDelete.id })
    }
  }



  return (
    <Container className='py-6'>
      <div className='flex items-center mb-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Recruitment Pipelines</h1>
          <p className='text-muted-foreground mt-1'>Manage your hiring workflows and candidate journey templates</p>
        </div>
      </div>

      <div className='mb-6 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4 flex-1'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input 
              placeholder='Search pipelines...' 
              className='pl-9' 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Only show tabs if there are pipelines */}
      {filteredPipelines.length > 0 && (
        <Tabs value={activeDepartment} onValueChange={setActiveDepartment} className='w-full'>
          <TabsList className='mb-6'>
            {allDepartments.map((dept) => (
              <TabsTrigger key={dept} value={dept}>
                {dept}
                {dept !== 'All Departments' && groupedPipelines[dept]?.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {groupedPipelines[dept].length}
                  </Badge>
                )}
                {dept === 'All Departments' && filteredPipelines.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {filteredPipelines.length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {currentPipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader className='pb-2'>
                  <div className='flex justify-between items-start'>
                    <CardTitle className='text-lg'>{pipeline.name}</CardTitle>
                    <div className='flex items-center gap-2'>
                      <Button 
                        variant='outline' 
                        size='icon' 
                        className='h-8 w-8' 
                        onClick={() => handleEditPipeline(pipeline.id)}
                        title='Edit Pipeline'
                      >
                        <Edit3 className='h-4 w-4' />
                      </Button>
                      <Button 
                        variant='destructive-subtle' 
                        size='icon' 
                        className='h-8 w-8' 
                        onClick={() => handleDeletePipeline(pipeline)}
                        title='Delete Pipeline'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    <span>{pipeline.stages} stages • Last updated {pipeline.lastUpdated}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className='pb-2'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex justify-between items-center'>
                      <div className='flex items-center gap-2 text-sm'>
                        <Briefcase className='h-4 w-4 text-muted-foreground' />
                        <span>Active Jobs</span>
                      </div>
                      <Badge variant='outline'>{pipeline.activeJobs}</Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <div className='flex items-center gap-2 text-sm'>
                        <Users className='h-4 w-4 text-muted-foreground' />
                        <span>Active Candidates</span>
                      </div>
                      <Badge variant='outline'>{pipeline.activeCandidates}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant='outline' className='w-full gap-2' onClick={() => handleViewPipeline(pipeline)}>
                    <ClipboardText className='h-4 w-4' />
                    View Pipeline
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {/* Create new pipeline card - only show for specific departments when there are existing pipelines */}
            {activeDepartment !== 'All Departments' && currentPipelines.length > 0 && (
              <Card
                className='border-dashed cursor-pointer flex flex-col items-center justify-center p-6'
                onClick={() => handleCreatePipeline(activeDepartment)}>
                <div className='rounded-full bg-primary/10 p-3 mb-3'>
                  <PlusCircle className='h-6 w-6 text-primary' />
                </div>
                <h3 className='font-medium'>New {activeDepartment} Pipeline</h3>
                <p className='text-sm text-muted-foreground text-center mt-2'>
                  Create a custom pipeline for {activeDepartment.toLowerCase()} positions
                </p>
              </Card>
            )}
          </div>

          {/* Empty state */}
          {currentPipelines.length === 0 && (
            <Card className='border-dashed border-2'>
              <CardContent className='flex flex-col items-center justify-center py-16'>
                <PlusCircle className='h-12 w-12 text-muted-foreground mb-6' />
                <h3 className='text-lg font-medium mb-2'>
                  {filteredPipelines.length === 0
                    ? 'No pipelines found'
                    : searchQuery !== ''
                      ? 'No pipelines match your search'
                      : `No ${activeDepartment?.toLowerCase()} pipelines yet`}
                </h3>
                <p className='text-sm text-muted-foreground text-center mb-4'>
                  {searchQuery !== ''
                    ? `No pipelines match your current filters.`
                    : 'Get started by creating your first pipeline.'}
                </p>
                {/* Always show create button when there are no pipelines or when not searching */}
                {searchQuery === '' && (
                  <Button onClick={() => handleCreatePipeline(filteredPipelines.length > 0 ? activeDepartment : 'All Departments')}>
                    <PlusCircle className='h-4 w-4 mr-2' />
                    Create Pipeline
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

      <PipelineCreationForm open={showCreateForm} onOpenChange={setShowCreateForm} department={selectedDepartment} />

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className='!max-w-3xl max-h-[90vh] overflow-hidden flex flex-col'>
          <DialogHeader className='pb-4'>
            <DialogTitle className='text-2xl font-bold'>{selectedPipeline?.name}</DialogTitle>
            <DialogDescription>Pipeline overview and statistics</DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-auto space-y-6'>
            {selectedPipeline && (
              <>
                {/* Metrics Cards */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium text-muted-foreground'>Total Steps</CardTitle>
                      <Target className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>{selectedPipeline.pipeline_steps?.length || 0}</div>
                      <p className='text-xs text-muted-foreground'>
                        {selectedPipeline.pipeline_steps?.length === 0 ? 'No steps yet' : 'Configured steps'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium text-muted-foreground'>Active Jobs</CardTitle>
                      <Briefcase className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>0</div>
                      <p className='text-xs text-muted-foreground'>Using this pipeline</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium text-muted-foreground'>Active Candidates</CardTitle>
                      <Users className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>0</div>
                      <p className='text-xs text-muted-foreground'>In progress</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium text-muted-foreground'>Avg. Duration</CardTitle>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {selectedPipeline.pipeline_steps?.reduce(
                          (total, step) => total + (step.duration_days || 0),
                          0
                        ) || 0}
                        d
                      </div>
                      <p className='text-xs text-muted-foreground'>Expected timeline</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pipeline Steps Section */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>Pipeline Steps</h3>
                  </div>

                  {selectedPipeline.pipeline_steps && selectedPipeline.pipeline_steps.length > 0 ? (
                    <div className='border rounded-lg overflow-hidden'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-muted/50'>
                            <TableHead className='w-16'>Order</TableHead>
                            <TableHead>Step Name</TableHead>
                            <TableHead className='hidden md:table-cell'>Description</TableHead>
                            <TableHead className='w-24'>Duration</TableHead>
                            <TableHead className='w-24 text-center'>Candidates</TableHead>
                            <TableHead className='w-20'>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPipeline.pipeline_steps
                            ?.sort((a, b) => a.step_order - b.step_order)
                            .map((step, index) => (
                              <TableRow key={step.id} className='hover:bg-muted/50'>
                                <TableCell className='font-medium'>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center'>
                                      {step.step_order}
                                    </div>
                                    <ArrowRight className='w-3 h-3 text-muted-foreground ml-1' />
                                  </div>
                                </TableCell>
                                <TableCell className='font-medium'>{step.name}</TableCell>
                                <TableCell className='hidden md:table-cell text-muted-foreground'>
                                  {step.description || 'No description'}
                                </TableCell>
                                <TableCell>
                                  {step.duration_days && step.duration_days > 0 ? (
                                    <Badge variant='outline' className='gap-1'>
                                      <Clock className='w-3 h-3' />
                                      {step.duration_days}d
                                    </Badge>
                                  ) : (
                                    <Badge variant='outline' className='gap-1'>
                                      <Clock className='w-3 h-3' />—
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className='text-center'>
                                  <Badge variant='secondary'>0</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant='default' className='capitalize'>
                                    Active
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
                      <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
                        <Target className='w-8 h-8 text-muted-foreground' />
                      </div>
                      <h3 className='text-lg font-semibold mb-2'>No pipeline steps configured</h3>
                      <p className='text-muted-foreground max-w-sm'>
                        This pipeline doesn't have any steps yet. Use the "Edit Pipeline" button below to add steps and
                        configure your hiring workflow.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t'>
            <Button
              className='gap-2 flex-1'
              onClick={() => {
                setShowViewDialog(false)
                handleEditPipeline(selectedPipeline!.id)
              }}>
              <Edit3 className='w-4 h-4' />
              Edit Pipeline
            </Button>
            <Button
              variant='outline'
              className='gap-2 flex-1 bg-transparent'
              onClick={() => {
                // TODO: Navigate to jobs using this pipeline
                console.log('View jobs for pipeline:', selectedPipeline!.id)
              }}>
              <Briefcase className='w-4 h-4' />
              View Jobs
            </Button>
            <Button
              variant='outline'
              className='gap-2 flex-1 bg-transparent'
              onClick={() => {
                // TODO: Navigate to candidates in this pipeline
                console.log('View candidates for pipeline:', selectedPipeline!.id)
              }}>
              <Users className='w-4 h-4' />
              View Candidates
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pipelineToDelete?.name}"? This action cannot be undone and will remove
              all pipeline steps and associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePipeline}
              disabled={deletePipelineMutation.isPending}
            >
              Delete Pipeline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  )
}
