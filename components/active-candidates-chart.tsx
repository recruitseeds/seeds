'use client'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

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
  { month: 'Screening', candidates: 86 },
  { month: 'Phone Screen', candidates: 45 },
  { month: 'Interviews', candidates: 35 },
  { month: 'Offer', candidates: 25 },
]

const chartConfig = {
  candidates: {
    label: 'Candidates',
    color: 'hsl(var(--chart-1))',
  },
  label: {
    color: 'hsl(var(--background))',
  },
} satisfies ChartConfig

export function ActiveCandidatesChart() {
  return (
    <Card className='flex flex-col h-full'>
      <CardHeader className='text-center'>
        <CardTitle>Active Candidates</CardTitle>
        <CardDescription>
          January - June 2024 • 187 total candidates
        </CardDescription>
      </CardHeader>
      <CardContent className='flex-grow'>
        <ChartContainer config={chartConfig} className='w-full h-full'>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout='vertical'
            margin={{
              right: 16,
            }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey='month'
              type='category'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey='candidates' type='number' hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='line' />}
            />
            <Bar
              dataKey='candidates'
              layout='vertical'
              fill='hsl(var(--chart-1))'
              radius={8}>
              <LabelList
                dataKey='month'
                position='insideLeft'
                offset={8}
                className='fill-[--color-label]'
                fontSize={12}
              />
              <LabelList
                dataKey='candidates'
                position='right'
                offset={8}
                className='fill-foreground'
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          12% more candidates than last month
          <svg
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className=' stroke-green-500 size-4'>
            <path
              d='M22 6V12M22 6H16M22 6L15 13C14.4548 13.5452 14.1821 13.8179 13.888 13.9636C13.3285 14.2409 12.6715 14.2409 12.112 13.9636C11.8179 13.8179 11.5452 13.5452 11 13V13C10.4547 12.4547 10.1821 12.1821 9.88799 12.0364C9.32844 11.7591 8.6715 11.7591 8.11195 12.0364C7.81785 12.1821 7.54522 12.4547 6.99995 13L2 17.9999'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <div className='leading-none text-muted-foreground'>
          Most candidates in technical screening
        </div>
      </CardFooter>
    </Card>
  )
}
