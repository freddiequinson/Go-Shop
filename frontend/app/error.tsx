"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#303A4D] mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-[#303A4D]/70 mb-6">
          We're sorry, but something unexpected happened. Don't worry, our team has been notified and we're working on it!
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-800 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={reset}
            className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-6 font-bold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = "/"}
            className="flex-1 bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 font-bold"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
        </div>

        <p className="text-sm text-[#303A4D]/50 mt-6">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}
