"use client"

import React, { Component, ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full p-8 bg-white text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#303A4D] mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-700">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
              >
                Go Back
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              If this problem persists, please contact support at{" "}
              <a href="tel:0241293754" className="text-[#4698CA] hover:underline">
                0241293754
              </a>
            </p>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
