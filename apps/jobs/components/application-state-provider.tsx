'use client'

import React, { createContext, useContext, useState } from 'react'

interface ApplicationState {
  hasApplied: boolean
  applicationId: string | null
  isSubmitting: boolean
}

interface ApplicationStateContextType {
  applicationState: ApplicationState
  setHasApplied: (hasApplied: boolean, applicationId?: string | null) => void
  setIsSubmitting: (isSubmitting: boolean) => void
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
  const [applicationState, setApplicationState] = useState<ApplicationState>({
    hasApplied: initialState.hasApplied,
    applicationId: initialState.applicationId,
    isSubmitting: false,
  })

  const setHasApplied = (hasApplied: boolean, applicationId: string | null = null) => {
    setApplicationState(prev => ({
      ...prev,
      hasApplied,
      applicationId: applicationId ?? prev.applicationId,
    }))
  }

  const setIsSubmitting = (isSubmitting: boolean) => {
    setApplicationState(prev => ({
      ...prev,
      isSubmitting,
    }))
  }

  const value = {
    applicationState,
    setHasApplied,
    setIsSubmitting,
  }

  return (
    <ApplicationStateContext.Provider value={value}>
      {children}
    </ApplicationStateContext.Provider>
  )
}

export function useApplicationState() {
  const context = useContext(ApplicationStateContext)
  if (context === undefined) {
    throw new Error('useApplicationState must be used within an ApplicationStateProvider')
  }
  return context
}