'use client'

import { Button } from '@seeds/ui/button'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../../components/auth-provider'
import { AuthModal } from '../../../components/auth-modal'

interface ApplyButtonsProps {
  jobId: string
  serverApplicationCheck?: {
    hasApplied: boolean
    applicationId: string | null
  }
}

export function ApplyButtons({ jobId, serverApplicationCheck }: ApplyButtonsProps) {
  const { isAuthenticated, user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Use server-side application check if available, otherwise client-side fallback
  const hasApplied = serverApplicationCheck?.hasApplied || false
  const isChecking = false // No need for checking state with server-side data

  const handleApply = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    if (hasApplied) {
      return // Don't allow multiple applications
    }

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
    if (isChecking) return 'Checking...'
    if (hasApplied) return (
      <>
        <Check className='h-4 w-4 mr-2' />
        Applied
      </>
    )
    if (!isAuthenticated) return 'Sign in to Apply'
    return 'Apply'
  }

  return (
    <>
      <div className='flex gap-3'>
        <Button 
          variant={hasApplied ? 'outline' : 'default'} 
          onClick={handleApply}
          disabled={isChecking || hasApplied}
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
