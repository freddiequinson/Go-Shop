"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Log to external service if needed
    if (typeof window !== 'undefined') {
      // Store error in localStorage for debugging
      try {
        const errorLog = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }
        localStorage.setItem('last_error', JSON.stringify(errorLog))
      } catch (e) {
        console.error('Failed to log error:', e)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                <p className="text-gray-600">The page encountered an error</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <h2 className="font-semibold text-gray-900 mb-2">Error Details:</h2>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-sm font-mono text-red-800 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-red-700 mt-2 overflow-x-auto whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {this.state.errorInfo && (
              <div className="mb-6">
                <details>
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-gray-700">
                    Component Stack
                  </summary>
                  <pre className="text-xs text-gray-700 mt-2 bg-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>For developers:</strong> Check the browser console or localStorage 'last_error' for more details.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
