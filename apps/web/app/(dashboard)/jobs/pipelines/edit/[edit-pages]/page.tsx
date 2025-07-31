import { Container } from '@/components/container'
import PipelineEditServer from './pipeline-edit-server'

interface PageProps {
  params: {
    'edit-pages': string
  }
}

export default function Page({ params }: PageProps) {
  const pipelineId = params['edit-pages']

  return (
    <Container className="py-6">
      <PipelineEditServer pipelineId={pipelineId} />
    </Container>
  )
}
