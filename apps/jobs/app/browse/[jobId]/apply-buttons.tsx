'use client'

import { Button } from '@seeds/ui/button'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../../components/auth-provider'
import { useApplicationState } from '../../../components/application-state-provider'
import { AuthModal } from '../../../components/auth-modal'

interface ApplyButtonsProps {
  jobId: string
}

export function ApplyButtons({ jobId }: ApplyButtonsProps) {
  const { isAuthenticated, user } = useAuth()
  const { applicationState } = useApplicationState()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { hasApplied, isSubmitting } = applicationState
  const isChecking = isSubmitting

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
    if (!isAuthenticated) return 'Apply'
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
