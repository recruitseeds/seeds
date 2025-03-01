import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function Page() {
  return (
    <div className='w-full h-screen'>
      <h1>Proposed theme colors</h1>
      <div className='flex items-center justify-center h-full gap-2'>
        <Button variant='brand'>Button</Button>
        <Badge variant='brand'>Badge</Badge>
      </div>
    </div>
  )
}
