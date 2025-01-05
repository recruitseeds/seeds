'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Editor } from './editor'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FormSchema = z
  .object({
    'job-title': z.string(),
    'job-type': z.string({
      required_error: 'Please select a job type.',
    }),
    location: z.string({
      required_error: 'Please select a location.',
    }),
    department: z.string({
      required_error: 'Please select a department.',
    }),
    'hiring-manager': z.string({
      required_error: 'Please select a hiring manager.',
    }),
    'salary-min': z
      .number({
        required_error: 'Minimum salary is required',
      })
      .min(0, 'Salary must be positive'),
    'salary-max': z
      .number({
        required_error: 'Maximum salary is required',
      })
      .min(0, 'Salary must be positive'),
  })
  .refine((data) => data['salary-max'] >= data['salary-min'], {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salary-max'],
  })

export function NewJobForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      'job-title': '',
      'job-type': '',
      location: '',
      department: '',
      'hiring-manager': '',
      'salary-min': 0,
      'salary-max': 0,
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="job-title"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input placeholder="Senior Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 lg:flex-row">
          <FormField
            control={form.control}
            name="job-type"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Job type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full-time">Full time</SelectItem>
                    <SelectItem value="part-time">Part time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Location</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="united-states">United States</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hiring-manager"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Hiring Manager</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hiring manager" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="jane-doe">Jane Doe</SelectItem>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <FormField
            control={form.control}
            name="salary-min"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Minimum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    min={0}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber
                      field.onChange(isNaN(value) ? 0 : value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary-max"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Maximum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="80000"
                    min={0}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber
                      field.onChange(isNaN(value) ? 0 : value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Editor />

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  )
}
