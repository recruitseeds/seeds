'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useApplicationCheck } from '../lib/queries'
import { useAuth } from './auth-provider'

interface ApplicationState {
  hasApplied: boolean
  applicationId: string | null
  isSubmitting: boolean
}

interface ApplicationStateContextType {
  applicationState: ApplicationState
  setHasApplied: (hasApplied: boolean, applicationId?: string | null) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  resetApplicationState: () => void
}

const ApplicationStateContext = createContext<ApplicationStateContextType | undefined>(undefined)

interface ApplicationStateProviderProps {
  children: React.ReactNode
  jobId: string
  initialState: {
    hasApplied: boolean
    applicationId: string | null
  }
}

export function ApplicationStateProvider({ children, jobId, initialState }: ApplicationStateProviderProps) {
  const { isAuthenticated, user } = useAuth()

  const [applicationState, setApplicationState] = useState<ApplicationState>({
    hasApplied: initialState.hasApplied,
    applicationId: initialState.applicationId,
    isSubmitting: false,
  })

  // Check if user has already applied to this job
  const { data: applicationCheck, isLoading: isCheckingApplication } = useApplicationCheck(
    jobId,
    user?.email || '',
    {
      enabled: !!(isAuthenticated && user?.email && jobId),
    }
  )

  // Update application state when check completes
  useEffect(() => {
    if (applicationCheck && isAuthenticated) {
      setApplicationState((prev) => ({
        ...prev,
        hasApplied: applicationCheck.data.hasApplied,
        applicationId: applicationCheck.data.applicationId || null,
      }))
    }
  }, [applicationCheck, isAuthenticated])

  // Reset application state when user logs out or changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // User logged out - reset to default state
      setApplicationState({
        hasApplied: false,
        applicationId: null,
        isSubmitting: false,
      })
    }
  }, [isAuthenticated, user])

  const setHasApplied = (hasApplied: boolean, applicationId: string | null = null) => {
    setApplicationState((prev) => ({
      ...prev,
      hasApplied,
      applicationId: applicationId ?? prev.applicationId,
    }))
  }

  const setIsSubmitting = (isSubmitting: boolean) => {
    setApplicationState((prev) => ({
      ...prev,
      isSubmitting,
    }))
  }

  const resetApplicationState = () => {
    setApplicationState({
      hasApplied: false,
      applicationId: null,
      isSubmitting: false,
    })
  }

  const value = {
    applicationState,
    setHasApplied,
    setIsSubmitting,
    resetApplicationState,
  }

  return <ApplicationStateContext.Provider value={value}>{children}</ApplicationStateContext.Provider>
}

export function useApplicationState() {
  const context = useContext(ApplicationStateContext)
  if (context === undefined) {
    throw new Error('useApplicationState must be used within an ApplicationStateProvider')
  }
  return context
}
