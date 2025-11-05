"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api/client'

function FacebookCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double execution
      if (isProcessing) return
      
      const code = searchParams.get('code')
      
      if (!code) {
        toast({
          title: "Error",
          description: "No authorization code received",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      setIsProcessing(true)

      try {
        // Send code to backend
        const response = await apiClient.post('/oauth/facebook/callback', { code })
        
        // Store token and user in localStorage
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // CRITICAL FIX: Update AuthContext by refreshing user data
        await refreshUser()
        
        // Get user name from response
        const userName = response.data.user?.full_name || 'there'
        
        toast({
          title: "🎉 Welcome to GoShop Ghana!",
          description: `Hi ${userName}! You've successfully signed in with Facebook. Start shopping for fresh groceries!`,
        })
        
        // Small delay to ensure state updates before redirect
        setTimeout(() => {
          router.push('/')
        }, 100)
      } catch (error) {
        console.error('OAuth callback error:', error)
        toast({
          title: "Authentication Failed",
          description: "Could not complete Facebook sign in. Please try again.",
          variant: "destructive",
        })
        router.push('/login')
      }
    }

    handleCallback()
  }, [searchParams, router, toast, refreshUser, isProcessing])

  return (
    <div className="min-h-screen bg-[#1877F2] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Completing sign in with Facebook...</p>
      </div>
    </div>
  )
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1877F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    }>
      <FacebookCallbackContent />
    </Suspense>
  )
}
