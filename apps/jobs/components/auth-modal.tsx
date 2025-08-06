'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@seeds/ui/dialog'
import { Button } from '@seeds/ui/button'
import { Input } from '@seeds/ui/input'
import { Label } from '@seeds/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@seeds/ui/tabs'
import { Alert, AlertDescription } from '@seeds/ui/alert'
import { ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: any) => void // Called when authentication succeeds
  mode?: 'login' | 'signup'
}

interface LoginForm {
  email: string
  password: string
}

interface SignupForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, mode = 'login' }: AuthModalProps) {
  const [currentTab, setCurrentTab] = useState(mode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  })
  
  const [signupForm, setSignupForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log('Login attempt:', loginForm)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser = {
        id: 'user-123',
        email: loginForm.email,
        firstName: 'John',
        lastName: 'Doe',
      }
      
      onAuthSuccess(mockUser)
      onClose()
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (signupForm.password !== signupForm.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (signupForm.password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      console.log('Signup attempt:', signupForm)
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockUser = {
        id: 'user-456',
        email: signupForm.email,
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
      }
      
      onAuthSuccess(mockUser)
      onClose()
      
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMainAppRedirect = () => {
    const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://app.recruitseeds.com'
    const returnUrl = encodeURIComponent(window.location.href)
    window.location.href = `${mainAppUrl}/login?returnUrl=${returnUrl}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Sign in to apply</DialogTitle>
        </DialogHeader>
        
        <div className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={currentTab} onValueChange={setCurrentTab} className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='login'>Sign In</TabsTrigger>
              <TabsTrigger value='signup'>Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value='login' className='space-y-4 mt-4'>
              <form onSubmit={handleLoginSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='login-email'>Email</Label>
                  <Input
                    id='login-email'
                    type='email'
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder='john@example.com'
                    required
                  />
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='login-password'>Password</Label>
                  <div className='relative'>
                    <Input
                      id='login-password'
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder='Enter your password'
                      required
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value='signup' className='space-y-4 mt-4'>
              <form onSubmit={handleSignupSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-firstName'>First Name</Label>
                    <Input
                      id='signup-firstName'
                      type='text'
                      value={signupForm.firstName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder='John'
                      required
                    />
                  </div>
                  
                  <div className='space-y-2'>
                    <Label htmlFor='signup-lastName'>Last Name</Label>
                    <Input
                      id='signup-lastName'
                      type='text'
                      value={signupForm.lastName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder='Doe'
                      required
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='signup-email'>Email</Label>
                  <Input
                    id='signup-email'
                    type='email'
                    value={signupForm.email}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder='john@example.com'
                    required
                  />
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='signup-password'>Password</Label>
                  <div className='relative'>
                    <Input
                      id='signup-password'
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder='Create a password'
                      required
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='signup-confirmPassword'>Confirm Password</Label>
                  <div className='relative'>
                    <Input
                      id='signup-confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder='Confirm your password'
                      required
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className='pt-4 border-t'>
            <p className='text-sm text-muted-foreground text-center mb-3'>
              Or continue with your existing account
            </p>
            <Button 
              variant='outline' 
              className='w-full' 
              onClick={handleMainAppRedirect}
            >
              <ExternalLink className='h-4 w-4 mr-2' />
              Sign in with RecruitSeeds Account
            </Button>
          </div>

          <div className='text-xs text-muted-foreground text-center space-y-1'>
            <p>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}