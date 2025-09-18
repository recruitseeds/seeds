'use client'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { createClient } from '@seeds/supabase/client/client'
import { handleEmailPasswordSignIn, handleOAuthSignIn } from '@seeds/supabase/utils/auth'
import type { Provider } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm({ className }: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await handleEmailPasswordSignIn(supabase, email, password)

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (data?.user) {
        router.push('/candidate/profile')
      } else {
        setError('Login failed. Please try again.')
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error('Login handleSubmit Error:', err)
      setError(err.message || 'An unexpected error occurred during login.')
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: Provider) => {
    setIsLoading(true)
    setError(null)

    try {
      await handleOAuthSignIn(supabase, provider)
    } catch (err: any) {
      console.error('OAuth Login Error:', err)
      setError(err.message || 'An unexpected error occurred with OAuth login.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col items-center text-center'>
          <h1 className='text-2xl font-bold'>Welcome back!</h1>
          <p className='text-balance text-muted-foreground'>Login to Seeds account</p>
        </div>
        {error && <div className='rounded bg-red-100 p-2 text-sm text-red-600'>{error}</div>}
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='johndoe@gmail.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-2'>
          <div className='flex items-center'>
            <Label htmlFor='password'>Password</Label>
            <a href='#' className='ml-auto text-sm underline-offset-2 hover:underline'>
              Forgot your password?
            </a>
          </div>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
        <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
          <span className='relative z-10 bg-brand-subtle rounded-full px-2 text-brand-subtle-foreground text-xs py-1 border border-brand-border'>
            Or continue with
          </span>
        </div>
        <div className='grid grid-cols-3 gap-4'>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}>
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none'>
              <path
                d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                fill='currentColor'
              />
            </svg>
            <span className='sr-only'>Login with Google</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={() => handleOAuthLogin('azure')}
            disabled={isLoading}>
            <svg
              viewBox='0 0 256 256'
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              preserveAspectRatio='xMidYMid'>
              <path fill='#F1511B' d='M121.666 121.666H0V0h121.666z' />
              <path fill='#80CC28' d='M256 121.666H134.335V0H256z' />
              <path fill='#00ADEF' d='M121.663 256.002H0V134.336h121.663z' />
              <path fill='#FBBC09' d='M256 256.002H134.335V134.336H256z' />
            </svg>
            <span className='sr-only'>Login with Microsoft</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={() => handleOAuthLogin('linkedin_oidc')}
            disabled={isLoading}>
            <svg
              width='24'
              height='24'
              xmlns='http://www.w3.org/2000/svg'
              preserveAspectRatio='xMidYMid'
              viewBox='0 0 256 256'>
              <path
                d='M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453'
                fill='#0A66C2'
              />
            </svg>
            <span className='sr-only'>Login with LinkedIn</span>
          </Button>
        </div>
        <div className='text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Button size='sm' variant='link' className='px-0' asChild>
            <Link href='/signup'>Sign up</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
