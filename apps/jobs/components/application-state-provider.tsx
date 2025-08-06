'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
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
  initialState: {
    hasApplied: boolean
    applicationId: string | null
  }
}

export function ApplicationStateProvider({ children, initialState }: ApplicationStateProviderProps) {
  const { isAuthenticated, user } = useAuth()

  const [applicationState, setApplicationState] = useState<ApplicationState>({
    hasApplied: initialState.hasApplied,
    applicationId: initialState.applicationId,
    isSubmitting: false,
  })

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
