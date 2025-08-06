'use client'

import { Button } from '@seeds/ui/button'
import { Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../components/auth-provider'
import { AuthModal } from '../../../components/auth-modal'
import { checkExistingApplication } from '../../../lib/api'

interface ApplyButtonsProps {
  jobId?: string
}

export function ApplyButtons({ jobId }: ApplyButtonsProps) {
  const { isAuthenticated, user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // Check if user has already applied and reset state on auth changes
  useEffect(() => {
    if (isAuthenticated && user?.email && jobId) {
      checkExistingApplication(jobId, user.email)
        .then((result) => {
          setHasApplied(result.data.hasApplied)
          setApplicationId(result.data.applicationId || null)
        })
        .catch((error) => {
          console.warn('Failed to check existing application:', error)
          // Don't show error to user, just assume they haven't applied
        })
    } else {
      // Reset state when user logs out or auth changes
      setHasApplied(false)
      setApplicationId(null)
    }
  }, [isAuthenticated, user?.email, jobId])

  const handleApply = () => {
    if (hasApplied) {
      return // Don't allow multiple applications
    }

    // Always scroll to apply section, regardless of auth state
    const applySection = document.getElementById('apply')
    if (applySection) {
      const elementPosition = applySection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - 100

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // The useEffect will automatically check for existing applications
  }

  const handleRefer = () => {
    const subject = encodeURIComponent('Check out this job opportunity')
    const body = encodeURIComponent(
      `I thought you might be interested in this Senior Frontend Developer position at TechCorp: ${window.location.href}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const getApplyButtonContent = () => {
    if (hasApplied) return (
      <>
        <Check className='h-4 w-4 mr-2' />
        Applied
      </>
    )
    return 'Apply'
  }

  return (
    <>
      <div className='flex gap-3'>
        <Button 
          variant={hasApplied ? 'outline' : 'default'} 
          onClick={handleApply}
          disabled={hasApplied}
        >
          {getApplyButtonContent()}
        </Button>
        <Button variant='outline' onClick={handleRefer}>
          Refer someone
        </Button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        mode="login"
      />
    </>
  )
}
