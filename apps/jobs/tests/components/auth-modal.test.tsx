import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthModal } from '../../components/auth-modal'

const mockOnClose = vi.fn()
const mockOnAuthSuccess = vi.fn()

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form by default', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    expect(screen.getByText('Sign in to apply')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders signup form when mode is signup', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess}
        mode="signup"
      />
    )

    expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('switches between login and signup tabs', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    const signupTab = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signupTab)

    expect(signupTab).toHaveAttribute('data-state', 'active')
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
  })

  it('validates login form submission', async () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('validates signup form password matching', async () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess}
        mode="signup"
      />
    )

    const firstNameInput = screen.getByLabelText('First Name')
    const lastNameInput = screen.getByLabelText('Last Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    expect(mockOnAuthSuccess).not.toHaveBeenCalled()
  })

  it('validates password strength', async () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess}
        mode="signup"
      />
    )

    const firstNameInput = screen.getByLabelText('First Name')
    const lastNameInput = screen.getByLabelText('Last Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    )

    expect(passwordInput).toHaveAttribute('type', 'password')
    
    if (toggleButton) {
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
    }
  })

  it('shows loading state during submission', async () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign In' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument()
    })
  })

  it('provides redirect to main app option', () => {
    const mockLocationAssign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3002/test-job',
        assign: mockLocationAssign,
      },
      writable: true,
    })

    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    const redirectButton = screen.getByRole('button', { name: 'Sign in with RecruitSeeds Account' })
    fireEvent.click(redirectButton)

    expect(mockLocationAssign).toHaveBeenCalledWith(
      'https://app.recruitseeds.com/login?returnUrl=http%3A%2F%2Flocalhost%3A3002%2Ftest-job'
    )
  })

  it('does not render when isOpen is false', () => {
    render(
      <AuthModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess} 
      />
    )

    expect(screen.queryByText('Sign in to apply')).not.toBeInTheDocument()
  })

  it('successful signup calls onAuthSuccess with correct user data', async () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onAuthSuccess={mockOnAuthSuccess}
        mode="signup"
      />
    )

    const firstNameInput = screen.getByLabelText('First Name')
    const lastNameInput = screen.getByLabelText('Last Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })

    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } })
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith({
        id: 'user-456',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      })
    })
  })
})