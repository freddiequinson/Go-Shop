"use client"

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { useOnboarding } from '@/lib/contexts/onboarding-context'

export interface TourStep {
  target: string // CSS selector for the element to highlight
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void // Optional action to perform when step is shown
}

interface OnboardingTourProps {
  tourId: string
  steps: TourStep[]
  onComplete?: () => void
}

export default function OnboardingTour({ tourId, steps, onComplete }: OnboardingTourProps) {
  const { shouldShowTour, markTourComplete, completedTours, hasSkippedAll } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    // Show tour after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (shouldShowTour(tourId)) {
        setIsActive(true)
        updateTargetPosition()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [tourId, completedTours, hasSkippedAll])

  useEffect(() => {
    if (isActive) {
      updateTargetPosition()
      // Execute step action if defined
      if (steps[currentStep]?.action) {
        steps[currentStep].action!()
      }
    }
  }, [currentStep, isActive])

  useEffect(() => {
    if (isActive) {
      const handleResize = () => updateTargetPosition()
      const handleScroll = () => updateTargetPosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isActive, currentStep])

  const updateTargetPosition = () => {
    const step = steps[currentStep]
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
      
      // Smart scroll based on tooltip position
      const position = step.position || 'bottom'
      const tooltipHeight = 250 // Approximate tooltip height with padding
      const headerHeight = 100 // Account for sticky header
      const viewportHeight = window.innerHeight
      
      // Calculate if element is visible with space for tooltip
      const isElementVisible = rect.top >= headerHeight && rect.bottom <= viewportHeight
      
      if (!isElementVisible) {
        // Determine scroll position based on tooltip position
        let scrollOptions: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
        
        if (position === 'top') {
          // If tooltip is on top, ensure space above element
          scrollOptions = { behavior: 'smooth', block: 'end' }
        } else if (position === 'bottom') {
          // If tooltip is on bottom, ensure space below element
          // Use 'start' to keep element near top with space below
          scrollOptions = { behavior: 'smooth', block: 'start' }
          
          // Add offset for header
          setTimeout(() => {
            window.scrollBy({ top: -headerHeight - 20, behavior: 'smooth' })
          }, 100)
        } else {
          // For left/right, center is fine
          scrollOptions = { behavior: 'smooth', block: 'center' }
        }
        
        element.scrollIntoView(scrollOptions)
      }
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    markTourComplete(tourId)
    setIsActive(false)
    if (onComplete) onComplete()
  }

  const handleSkip = () => {
    markTourComplete(tourId)
    setIsActive(false)
  }

  if (!isActive || !targetRect) return null

  const step = steps[currentStep]
  const position = step.position || 'bottom'

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const padding = 20
    const tooltipHeight = 200 // Approximate tooltip height
    const tooltipWidth = 400 // Approximate tooltip width
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    let top = 0
    let left = 0
    let actualPosition = position

    // Calculate initial position
    switch (position) {
      case 'top':
        top = targetRect.top - padding
        left = targetRect.left + targetRect.width / 2
        // If tooltip would go above viewport, switch to bottom
        if (top - tooltipHeight < 0) {
          actualPosition = 'bottom'
          top = targetRect.bottom + padding
        }
        break
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2
        // If tooltip would go below viewport, switch to top
        if (top + tooltipHeight > viewportHeight) {
          actualPosition = 'top'
          top = targetRect.top - padding
        }
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.left - padding
        // If tooltip would go off left edge, switch to right
        if (left - tooltipWidth < 0) {
          actualPosition = 'right'
          left = targetRect.right + padding
        }
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.right + padding
        // If tooltip would go off right edge, switch to left
        if (left + tooltipWidth > viewportWidth) {
          actualPosition = 'left'
          left = targetRect.left - padding
        }
        break
    }

    // Ensure tooltip stays within viewport bounds
    if (top < 20) top = 20
    if (top + tooltipHeight > viewportHeight - 20) top = viewportHeight - tooltipHeight - 20
    if (left < tooltipWidth / 2 + 20) left = tooltipWidth / 2 + 20
    if (left > viewportWidth - tooltipWidth / 2 - 20) left = viewportWidth - tooltipWidth / 2 - 20

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: actualPosition === 'left' || actualPosition === 'right' 
        ? 'translate(-50%, -50%)' 
        : actualPosition === 'top'
        ? 'translate(-50%, -100%)'
        : 'translate(-50%, 0)',
      zIndex: 10001,
      maxHeight: `${viewportHeight - 40}px`,
      overflowY: 'auto'
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: 'none' }}>
        {/* Dark overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Animated spotlight border */}
        <div
          className="absolute border-4 border-[#FED141] rounded-xl animate-pulse"
          style={{
            left: `${targetRect.left - 8}px`,
            top: `${targetRect.top - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            boxShadow: '0 0 30px rgba(254, 209, 65, 0.6)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className="bg-white rounded-2xl shadow-2xl border-4 border-[#FED141] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FED141] rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-[#303A4D]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#303A4D]">{step.title}</h3>
                <p className="text-xs text-[#303A4D]/60">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-[#303A4D]/60 hover:text-[#303A4D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-[#303A4D]/80 mb-6 leading-relaxed">{step.description}</p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-[#FED141]'
                    : index < currentStep
                    ? 'w-2 bg-[#303A4D]'
                    : 'w-2 bg-[#303A4D]/20'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-100 text-[#303A4D] rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-[#FED141] text-[#303A4D] font-bold rounded-lg hover:bg-[#FED141]/90 transition-colors flex items-center gap-2"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  'Got it!'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
