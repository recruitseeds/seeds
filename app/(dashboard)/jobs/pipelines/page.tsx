import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  ClipboardCheck,
  Pencil,
  PlusCircle,
  Search,
  Users,
} from 'lucide-react'

const PipelineListingPage = () => {
  const pipelines = [
    {
      id: 1,
      name: 'Software Engineer',
      category: 'Engineering',
      stages: 5,
      activeJobs: 3,
      activeCandidates: 28,
      lastUpdated: '2 days ago',
      department: 'Engineering',
    },
    {
      id: 2,
      name: 'Senior Software Engineer',
      category: 'Engineering',
      stages: 6,
      activeJobs: 2,
      activeCandidates: 15,
      lastUpdated: '1 week ago',
      department: 'Engineering',
    },
    {
      id: 3,
      name: 'Product Designer',
      category: 'Design',
      stages: 4,
      activeJobs: 1,
      activeCandidates: 12,
      lastUpdated: '3 days ago',
      department: 'Design',
    },
    {
      id: 4,
      name: 'Account Executive',
      category: 'Sales',
      stages: 5,
      activeJobs: 4,
      activeCandidates: 32,
      lastUpdated: '1 day ago',
      department: 'Sales',
    },
    {
      id: 5,
      name: 'Marketing Manager',
      category: 'Marketing',
      stages: 4,
      activeJobs: 1,
      activeCandidates: 8,
      lastUpdated: '5 days ago',
      department: 'Marketing',
    },
  ]

  // Group pipelines by department
  const groupedPipelines = pipelines.reduce((acc, pipeline) => {
    if (!acc[pipeline.department]) {
      acc[pipeline.department] = []
    }
    acc[pipeline.department].push(pipeline)
    return acc
  }, {})

  const departments = Object.keys(groupedPipelines)

  return (
    <Container className='py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Recruitment Pipelines
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your hiring workflows and candidate journey templates
          </p>
        </div>
        <Button className='gap-1'>
          <PlusCircle className='h-4 w-4' />
          Create Pipeline
        </Button>
      </div>

      <div className='mb-6 flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search pipelines...' className='pl-9' />
        </div>
        <Tabs defaultValue='all' className='w-auto'>
          <TabsList>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='active'>Active</TabsTrigger>
            <TabsTrigger value='archived'>Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue={departments[0]} className='w-full'>
        <TabsList className='mb-6'>
          {departments.map((dept) => (
            <TabsTrigger key={dept} value={dept}>
              {dept}
            </TabsTrigger>
          ))}
        </TabsList>

        {departments.map((dept) => (
          <TabsContent key={dept} value={dept} className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {groupedPipelines[dept].map((pipeline) => (
                <Card
                  key={pipeline.id}
                  className='hover:shadow-md transition-shadow'>
                  <CardHeader className='pb-2'>
                    <div className='flex justify-between items-start'>
                      <CardTitle className='text-lg'>{pipeline.name}</CardTitle>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        title='Edit Pipeline'>
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </div>
                    <CardDescription>
                      {pipeline.stages} stages • Last updated{' '}
                      {pipeline.lastUpdated}
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
                        <Badge variant='outline'>
                          {pipeline.activeCandidates}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant='outline' className='w-full gap-2'>
                      <ClipboardCheck className='h-4 w-4' />
                      View Pipeline
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Add new pipeline card - appears at the end of each category */}
              <Card className='border-dashed hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center p-6'>
                <div className='rounded-full bg-primary/10 p-3 mb-3'>
                  <PlusCircle className='h-6 w-6 text-primary' />
                </div>
                <h3 className='font-medium'>New {dept} Pipeline</h3>
                <p className='text-sm text-muted-foreground text-center mt-2'>
                  Create a custom pipeline for {dept.toLowerCase()} positions
                </p>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Container>
  )
}

export default PipelineListingPage
