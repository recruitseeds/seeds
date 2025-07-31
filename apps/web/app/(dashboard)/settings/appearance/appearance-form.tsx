'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FontSwitcher } from '@/components/font-switcher'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

const appearanceFormSchema = z.object({
  theme: z
    .enum(['light', 'dark'], {
      required_error: 'Please select a theme.',
    })
    .optional(),
  font: z.enum(['inter', 'geist', 'poppins', 'roboto', 'opensans'], {
    invalid_type_error: 'Select a font',
    required_error: 'Please select a font.',
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

const defaultValues: Partial<AppearanceFormValues> = {
  theme: undefined,
  font: 'inter',
}

function getFontDisplayName(font: string): string {
  switch (font) {
    case 'inter':
      return 'Inter'
    case 'geist':
      return 'Geist'
    case 'poppins':
      return 'Poppins'
    case 'roboto':
      return 'Roboto'
    case 'opensans':
      return 'Open Sans'
    default:
      return 'Inter'
  }
}

interface AppearanceFormProps {
  initialSettings?: Record<string, unknown> | null
}

export function AppearanceForm({ initialSettings }: AppearanceFormProps) {
  const { setTheme, theme } = useTheme()
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  })

  const trpc = useTRPC()
  const { data: settings, isLoading } = useQuery(trpc.organization.getUserSettings.queryOptions())
  const updateSettings = useMutation(trpc.organization.updateUserSettingsPartial.mutationOptions())

  // Get initial font preference from server-provided data
  const appearance = initialSettings?.appearance as Record<string, unknown>
  const initialFont = (appearance?.font as 'inter' | 'geist' | 'poppins' | 'roboto' | 'opensans') || 'inter'

  useEffect(() => {
    // Set initial values from server data first
    if (initialSettings) {
      const appearance = initialSettings.appearance as Record<string, unknown>
      if (appearance) {
        if (!theme && appearance.theme) {
          form.setValue('theme', appearance.theme as 'light' | 'dark')
        }
        const savedFont = appearance.font as 'inter' | 'geist' | 'poppins' | 'roboto' | 'opensans'
        if (savedFont) {
          form.setValue('font', savedFont)
        }
      }
    }

    // Update with client-side data when available
    if (settings) {
      const appearance = settings.appearance as Record<string, unknown>
      if (appearance) {
        if (!theme && appearance.theme) {
          form.setValue('theme', appearance.theme as 'light' | 'dark')
        }
        const savedFont = appearance.font as 'inter' | 'geist' | 'poppins' | 'roboto' | 'opensans'
        if (savedFont) {
          form.setValue('font', savedFont)
        }
      }
    }
    if (theme && (theme === 'light' || theme === 'dark')) {
      form.setValue('theme', theme)
    }
  }, [settings, theme, form, initialSettings])

  useEffect(() => {
    if (theme && (theme === 'light' || theme === 'dark')) {
      const currentFormTheme = form.getValues('theme')
      if (currentFormTheme !== theme) {
        form.setValue('theme', theme)
      }
    }
  }, [theme, form])

  async function onSubmit(data: AppearanceFormValues) {
    try {
      await updateSettings.mutateAsync({
        path: 'appearance',
        value: data,
      })

      setTheme(data.theme)

      localStorage.setItem('font-preference', data.font)

      toast.success('Preferences updated successfully. Refreshing the page to show the changes.')

      setTimeout(() => {
        window.location.reload()
      }, 400)
    } catch (error) {
      toast.error('Failed to update preferences')
    }
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    form.setValue('theme', newTheme)

    setTheme(newTheme)

    try {
      await updateSettings.mutateAsync({
        path: 'appearance.theme',
        value: newTheme,
      })
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  return (
    <>
      <FontSwitcher />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='font'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Font</FormLabel>
                <div className='relative w-max'>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='w-[200px]'>
                          <SelectValue placeholder={getFontDisplayName(initialFont)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='inter'>Inter</SelectItem>
                        <SelectItem value='geist'>Geist</SelectItem>
                        <SelectItem value='poppins'>Poppins</SelectItem>
                        <SelectItem value='roboto'>Roboto</SelectItem>
                        <SelectItem value='opensans'>Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <ChevronDown className='absolute right-3 top-2.5 h-4 w-4 opacity-50' />
                </div>
                <FormDescription>Set the font you want to use in the dashboard.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='theme'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel>Theme</FormLabel>
                <FormDescription>Select the theme for the dashboard.</FormDescription>
                <FormMessage />
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleThemeChange(value as 'light' | 'dark')
                  }}
                  value={field.value}
                  className='grid max-w-md grid-cols-2 gap-8 pt-2'>
                  <FormItem>
                    <FormLabel className='[&:has([data-state=checked])>div>div]:border-brand'>
                      <FormControl>
                        <RadioGroupItem value='light' className='sr-only' />
                      </FormControl>
                      <div className='flex flex-col items-center'>
                        <div className='rounded-md border-2 border-muted p-1 hover:border-accent hover:bg-accent hover:text-accent-foreground'>
                          <div className='space-y-2 rounded-sm bg-[#ecedef] p-2'>
                            <div className='space-y-2 rounded-md bg-white p-2 shadow-sm'>
                              <div className='h-2 w-[80px] rounded-lg bg-[#ecedef]' />
                              <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                            </div>
                            <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                              <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                              <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                            </div>
                            <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm'>
                              <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                              <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                            </div>
                          </div>
                        </div>
                        <span className='mt-2 block text-center font-normal'>Light</span>
                      </div>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormLabel className='[&:has([data-state=checked])>div>div]:border-brand'>
                      <FormControl>
                        <RadioGroupItem value='dark' className='sr-only' />
                      </FormControl>
                      <div className='flex flex-col items-center'>
                        <div className='rounded-md border-2 border-muted p-1 hover:border-accent hover:bg-accent hover:text-accent-foreground'>
                          <div className='space-y-2 rounded-sm bg-slate-950 p-2'>
                            <div className='space-y-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                              <div className='h-2 w-[80px] rounded-lg bg-slate-400' />
                              <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                            </div>
                            <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                              <div className='h-4 w-4 rounded-full bg-slate-400' />
                              <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                            </div>
                            <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm'>
                              <div className='h-4 w-4 rounded-full bg-slate-400' />
                              <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                            </div>
                          </div>
                        </div>
                        <span className='mt-2 block text-center font-normal'>Dark</span>
                      </div>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />
          <Button type='submit'>Update preferences</Button>
        </form>
      </Form>
    </>
  )
}
