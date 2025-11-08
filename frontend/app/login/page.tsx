"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // Can be email or username
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  // Load remembered user on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('remembered_user')
    if (rememberedUser) {
      setIdentifier(rememberedUser)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!identifier || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      // Backend will accept either email or username
      await login({ email: identifier, password })
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('remembered_user', identifier)
      } else {
        localStorage.removeItem('remembered_user')
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in. Ready to shop for fresh groceries?",
      })
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Extract error message
      let errorMessage = "Invalid email/username or password"
      
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FED141] flex flex-col">
      {/* Header */}
      <div className="px-6 md:px-8 py-6">
        <Link href="/" className="inline-block">
          <Image src="/images/logo.png" alt="go-shop" width={96} height={30} className="w-20 md:w-24 object-contain" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Welcome Back</h1>
            <p className="text-lg text-[#303A4D]/70 mb-6">Sign in to continue shopping</p>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                    const response = await fetch(`${apiUrl}/api/v1/oauth/google/login`)
                    const data = await response.json()
                    window.location.href = data.auth_url
                  } catch (error) {
                    console.error('OAuth error:', error)
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-[#FED141] rounded-2xl px-4 py-3 text-[#303A4D] font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#303A4D]/60">Or sign in with email/username</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Email or Username
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your.email@example.com or username"
                  required
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#303A4D]/30 text-[#FED141] focus:ring-[#FED141]"
                  />
                  <span className="text-sm text-[#303A4D]">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[#303A4D] hover:text-[#FED141] font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#303A4D]/70">
                Don't have an account?{" "}
                <Link href="/signup" className="text-[#303A4D] font-bold hover:text-[#FED141]">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="mt-8 text-center">
            <p className="text-[#303A4D] text-sm">
              By signing in, you agree to our{" "}
              <Link href="#" className="underline hover:text-[#303A4D]/70">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-[#303A4D]/70">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
