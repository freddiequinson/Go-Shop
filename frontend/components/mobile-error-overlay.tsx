"use client"

import { useEffect, useState } from 'react'
import { X, AlertTriangle, Copy, Check } from 'lucide-react'

interface ErrorLog {
  message: string
  stack?: string
  timestamp: Date
  type: 'error' | 'warning' | 'log'
}

export function MobileErrorOverlay() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Capture console errors
    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log

    console.error = (...args: any[]) => {
      originalError(...args)
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      setErrors(prev => [...prev, {
        message,
        timestamp: new Date(),
        type: 'error'
      }])
      // Don't auto-show overlay - user can click the indicator if needed
      // setIsVisible(true)
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      setErrors(prev => [...prev, {
        message,
        timestamp: new Date(),
        type: 'warning'
      }])
    }

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, {
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        type: 'error'
      }])
      // Don't auto-show overlay - user can click the indicator if needed
      // setIsVisible(true)
    }

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      setErrors(prev => [...prev, {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date(),
        type: 'error'
      }])
      // Don't auto-show overlay - user can click the indicator if needed
      // setIsVisible(true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const copyAllErrors = () => {
    const errorText = errors.map(err => 
      `[${err.timestamp.toISOString()}] ${err.type.toUpperCase()}: ${err.message}${err.stack ? '\n' + err.stack : ''}`
    ).join('\n\n---\n\n')
    
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isVisible || errors.length === 0) {
    // Show floating error indicator if there are errors but overlay is hidden
    if (errors.length > 0 && !isVisible) {
      return (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white p-3 rounded-full shadow-2xl animate-pulse"
          aria-label="Show errors"
        >
          <AlertTriangle className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {errors.length}
          </span>
        </button>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 text-white p-4 rounded-t-lg shadow-lg flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Error Console</h2>
              <p className="text-xs opacity-90">{errors.length} error(s) detected</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAllErrors}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              aria-label="Copy all errors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error List */}
        <div className="space-y-3 pb-20">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 ${
                error.type === 'error' 
                  ? 'bg-red-900/50 border-2 border-red-500' 
                  : error.type === 'warning'
                  ? 'bg-yellow-900/50 border-2 border-yellow-500'
                  : 'bg-blue-900/50 border-2 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  error.type === 'error' 
                    ? 'bg-red-500 text-white' 
                    : error.type === 'warning'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-blue-500 text-white'
                }`}>
                  {error.type.toUpperCase()}
                </span>
                <span className="text-xs text-white/60">
                  {error.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <pre className="text-sm text-white font-mono whitespace-pre-wrap break-words mb-2">
                {error.message}
              </pre>
              
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-white/80 cursor-pointer hover:text-white">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-words mt-2 p-2 bg-black/30 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Clear Button */}
        <div className="fixed bottom-4 left-4 right-4">
          <button
            onClick={() => {
              setErrors([])
              setIsVisible(false)
            }}
            className="w-full bg-white text-red-600 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          >
            Clear All Errors
          </button>
        </div>
      </div>
    </div>
  )
}
