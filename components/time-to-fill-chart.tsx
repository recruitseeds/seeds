'use client'

import { TrendingDown } from 'lucide-react'

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
const chartData = [
  {
    metric: 'timeToFill',
    value: 32,
    fill: 'hsl(var(--chart-1))',
  },
]

const chartConfig = {
  timeToFill: {
    label: 'Days to Fill',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function TimeToFillChart() {
  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center'>
        <CardTitle>Time to Fill</CardTitle>
        <CardDescription>January - June 2024 • 28 positions</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px]'>
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={0}
            innerRadius={80}
            outerRadius={110}>
            <PolarGrid
              gridType='circle'
              radialLines={false}
              stroke='none'
              className='first:fill-muted last:fill-background'
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey='value' background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'>
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-4xl font-bold'>
                          {chartData[0].value}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground'>
                          Days
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          4 days faster than last month
          <TrendingDown className='h-4 w-4 text-green-500' />
        </div>
        <div className='leading-none text-muted-foreground'>
          Average across all departments
        </div>
      </CardFooter>
    </Card>
  )
}
