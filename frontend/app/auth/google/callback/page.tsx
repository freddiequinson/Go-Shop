"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api/client'

function GoogleCallbackContent() {
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
        const response = await apiClient.post('/oauth/google/callback', { code })
        
        // Store token and user in localStorage
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // CRITICAL FIX: Update AuthContext by refreshing user data
        await refreshUser()
        
        // Get user name and profile picture from response
        const userName = response.data.user?.full_name || 'there'
        const hasProfilePicture = !!response.data.user?.profile_picture_url
        
        toast({
          title: "🎉 Welcome to GoShop Ghana!",
          description: `Hi ${userName}! You've successfully signed in with Google. Start shopping for fresh groceries!`,
        })
        
        // Show profile picture reminder if missing
        if (!hasProfilePicture) {
          setTimeout(() => {
            toast({
              title: "📸 Complete Your Profile",
              description: "Add a profile picture to personalize your account. Visit your profile page to upload one!",
              duration: 6000,
            })
          }, 2000)
        }
        
        // Small delay to ensure state updates before redirect
        setTimeout(() => {
          router.push('/')
        }, 100)
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        
        let errorMessage = "Could not complete Google sign in. Please try again."
        
        // Extract error details
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.message === 'Network Error') {
          errorMessage = "Cannot connect to server. Please ensure the backend is running and try again."
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        })
        router.push('/login')
      }
    }

    handleCallback()
  }, [searchParams, router, toast, refreshUser, isProcessing])

  return (
    <div className="min-h-screen bg-[#FED141] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
        <p className="text-[#303A4D] text-lg font-medium">Completing sign in with Google...</p>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FED141] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
          <p className="text-[#303A4D] text-lg font-medium">Loading...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}
