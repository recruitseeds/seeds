import { Container } from '@/components/container'
import { ChartFour } from '@/components/analytics/chart-four'
import { ChartOne } from '@/components/analytics/chart-one'

export default function Page() {
  return (
    <Container>
      <div className='flex flex-col gap-8 xl:gap-5 md:gap-2'>
        <div className='grid flex-1 scroll-mt-20 items-start gap-8 md:gap-2 lg:grid-cols-3 xl:gap-5'>
          <ChartOne />
          <ChartOne />
          <ChartOne />
        </div>
        <ChartFour />
      </div>
    </Container>
  )
}
