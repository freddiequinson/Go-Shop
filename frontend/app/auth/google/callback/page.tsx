"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api/client'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const handleCallback = async () => {
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

      try {
        // Send code to backend
        const response = await apiClient.post('/oauth/google/callback', { code })
        
        // Store token
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Get user name from response
        const userName = response.data.user?.full_name || 'there'
        
        toast({
          title: "🎉 Welcome to GoShop Ghana!",
          description: `Hi ${userName}! You've successfully signed in with Google. Start shopping for fresh groceries!`,
        })
        
        router.push('/')
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
  }, [searchParams, router, toast])

  return (
    <div className="min-h-screen bg-[#FED141] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
        <p className="text-[#303A4D] text-lg font-medium">Completing sign in with Google...</p>
      </div>
    </div>
  )
}
