"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Mail, Lock, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type Step = "identifier" | "code" | "password" | "success"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("identifier")
  const [identifier, setIdentifier] = useState("") // Can be email, username, or phone
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const getApiBaseUrl = () => {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!identifier) {
      toast({
        title: "Error",
        description: "Please enter your email, username, or phone number",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('identifier', identifier)

      const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Reset Code Sent!",
          description: "Check your email for the 6-digit reset code",
        })
        setStep("code")
      } else {
        const data = await response.json()
        
        // If account not found, offer to redirect to signup
        if (response.status === 404) {
          toast({
            title: "Account Not Found",
            description: data.detail || "No account found. Redirecting to sign up...",
            variant: "destructive",
          })
          setTimeout(() => router.push('/signup'), 2000)
          return
        }
        
        throw new Error(data.detail || "Failed to send reset code")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('identifier', identifier)
      formData.append('code', code)

      const response = await fetch(`${getApiBaseUrl()}/auth/verify-reset-code`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Code Verified!",
          description: "Now create your new password",
        })
        setStep("password")
      } else {
        const data = await response.json()
        throw new Error(data.detail || "Invalid or expired code")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('identifier', identifier)
      formData.append('code', code)
      formData.append('new_password', newPassword)

      const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setStep("success")
      } else {
        const data = await response.json()
        throw new Error(data.detail || "Failed to reset password")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
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
          <Image src="/images/logo.png" alt="go-shop" width={96} height={30} className="w-20 md:w-24 h-auto object-contain" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            {/* Back to Login */}
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-[#303A4D] hover:text-[#FED141] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Login</span>
            </Link>

            {/* Step 1: Enter Identifier */}
            {step === "identifier" && (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#FED141] rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-[#303A4D]" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Forgot Password?</h1>
                  <p className="text-lg text-[#303A4D]/70">No worries! Enter your email, username, or phone number and we'll send you a reset code.</p>
                </div>

                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Email, Username, or Phone
                    </label>
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="your.email@example.com, username, or phone"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending Code..." : "Send Reset Code"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </>
            )}

            {/* Step 2: Enter Code */}
            {step === "code" && (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#FED141] rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-[#303A4D]" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Check Your Email</h1>
                  <p className="text-lg text-[#303A4D]/70">
                    We sent a 6-digit code to your email
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Reset Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] text-center text-2xl font-bold tracking-widest placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                    />
                    <p className="text-sm text-[#303A4D]/60 mt-2">Code expires in 15 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || code.length !== 6}
                    className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
                  >
                    {isSubmitting ? "Verifying..." : "Verify Code"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("identifier")}
                    className="w-full text-sm text-[#303A4D] hover:text-[#FED141] font-medium"
                  >
                    Didn't receive the code? Try again
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Create New Password */}
            {step === "password" && (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#FED141] rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-[#303A4D]" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Create New Password</h1>
                  <p className="text-lg text-[#303A4D]/70">Choose a strong password for your account</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-[#303A4D] mb-2">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
                  >
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Password Reset!</h1>
                  <p className="text-lg text-[#303A4D]/70">Your password has been successfully reset. You can now log in with your new password.</p>
                </div>

                <Button
                  onClick={() => router.push('/login')}
                  size="lg"
                  className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto"
                >
                  Go to Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-[#303A4D] text-sm">
              Need help?{" "}
              <Link href="#" className="underline hover:text-[#303A4D]/70 font-medium">
                Contact Support
              </Link>
              {" "}or call <strong>0241293754</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
