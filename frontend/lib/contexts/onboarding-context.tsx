"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface OnboardingContextType {
  completedTours: string[]
  markTourComplete: (tourId: string) => void
  resetTour: (tourId: string) => void
  resetAllTours: () => void
  shouldShowTour: (tourId: string) => boolean
  skipAllTours: () => void
  hasSkippedAll: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const STORAGE_KEY = 'goshop_onboarding_tours'
const SKIP_ALL_KEY = 'goshop_skip_all_tours'

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completedTours, setCompletedTours] = useState<string[]>([])
  const [hasSkippedAll, setHasSkippedAll] = useState(false)

  // Load completed tours from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const skipped = localStorage.getItem(SKIP_ALL_KEY)
    
    if (stored) {
      try {
        setCompletedTours(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse onboarding data:', e)
      }
    }
    
    if (skipped === 'true') {
      setHasSkippedAll(true)
    }
  }, [])

  const markTourComplete = (tourId: string) => {
    setCompletedTours(prev => {
      if (prev.includes(tourId)) return prev
      const updated = [...prev, tourId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const resetTour = (tourId: string) => {
    setCompletedTours(prev => {
      const updated = prev.filter(id => id !== tourId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const resetAllTours = () => {
    setCompletedTours([])
    setHasSkippedAll(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SKIP_ALL_KEY)
  }

  const skipAllTours = () => {
    setHasSkippedAll(true)
    localStorage.setItem(SKIP_ALL_KEY, 'true')
  }

  const shouldShowTour = (tourId: string) => {
    return !hasSkippedAll && !completedTours.includes(tourId)
  }

  return (
    <OnboardingContext.Provider
      value={{
        completedTours,
        markTourComplete,
        resetTour,
        resetAllTours,
        shouldShowTour,
        skipAllTours,
        hasSkippedAll
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
