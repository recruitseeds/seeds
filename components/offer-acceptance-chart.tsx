'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
const chartData = [
  { date: '2024-01', accepted: 8, declined: 2 },
  { date: '2024-02', accepted: 12, declined: 1 },
  { date: '2024-03', accepted: 6, declined: 2 },
  { date: '2024-04', accepted: 9, declined: 3 },
  { date: '2024-05', accepted: 15, declined: 2 },
  { date: '2024-06', accepted: 11, declined: 1 },
]

const chartConfig = {
  offers: {
    label: 'Offers',
  },
  accepted: {
    label: 'Accepted',
    color: 'hsl(var(--chart-1))',
  },
  declined: {
    label: 'Declined',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

export function OfferAcceptanceChart() {
  return (
    <Card className='flex flex-col h-full'>
      <CardHeader className='items-center'>
        <CardTitle>Offer Acceptance Rate</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>
        <ChartContainer config={chartConfig} className='w-full h-full'>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey='date'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString('en-US', {
                  month: 'short',
                })
              }}
            />
            <Bar
              dataKey='accepted'
              stackId='a'
              fill='var(--color-accepted)'
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey='declined'
              stackId='a'
              fill='var(--color-declined)'
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelKey='offers' indicator='line' />
              }
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col items-center gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          85% acceptance rate this month
          <TrendingUp className='h-4 w-4 text-green-500' />
        </div>
        <div className='leading-none text-muted-foreground'>
          5% higher than last month
        </div>
      </CardFooter>
    </Card>
  )
}
