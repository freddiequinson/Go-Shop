"use client"

import type React from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { UserType } from "@/lib/types"
import Stepper, { Step } from "@/components/Stepper"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    referralSource: "",
    password: "",
    confirmPassword: "",
  })
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: string; longitude: string; address: string } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Countdown timer effect
  useEffect(() => {
    if (registrationSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (registrationSuccess && countdown === 0) {
      router.push('/')
    }
  }, [registrationSuccess, countdown, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be less than 2MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.display_name || `${latitude}, ${longitude}`
          
          setLocation({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: address,
          })
          
          toast({
            title: "Location detected!",
            description: "Your delivery location has been set",
          })
        } catch (error) {
          setLocation({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: `${latitude}, ${longitude}`,
          })
        }
        setIsGettingLocation(false)
      },
      (error) => {
        setIsGettingLocation(false)
        toast({
          title: "Location access denied",
          description: "Please enable location access to set your delivery address",
          variant: "destructive",
        })
      }
    )
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        if (!formData.name.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your full name",
            variant: "destructive",
          })
          return false
        }
        if (!formData.username.trim()) {
          toast({
            title: "Username required",
            description: "Please enter a username",
            variant: "destructive",
          })
          return false
        }
        if (!formData.email.trim()) {
          toast({
            title: "Email required",
            description: "Please enter your email address",
            variant: "destructive",
          })
          return false
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address",
            variant: "destructive",
          })
          return false
        }
        return true
      
      case 2: // Profile Picture (optional, always valid)
        return true
      
      case 3: // Location & Referral (optional, always valid)
        return true
      
      case 4: // Password
        if (!formData.password) {
          toast({
            title: "Password required",
            description: "Please create a password",
            variant: "destructive",
          })
          return false
        }
        if (formData.password.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters",
            variant: "destructive",
          })
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match",
            variant: "destructive",
          })
          return false
        }
        if (!termsAccepted) {
          toast({
            title: "Terms required",
            description: "Please accept the terms and conditions",
            variant: "destructive",
          })
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const handleStepChange = (step: number): boolean => {
    // Validate current step before moving forward
    if (step > currentStep) {
      if (!validateStep(currentStep)) {
        return false // Prevent step change
      }
    }
    setCurrentStep(step)
    return true // Allow step change
  }

  const handleFinalSubmit = async () => {
    if (!validateStep(4)) {
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.name,
        phone_number: formData.phone || undefined,
        user_type: UserType.BUYER,
        location: location?.address || undefined,
        latitude: location?.latitude || undefined,
        longitude: location?.longitude || undefined,
        referral_source: formData.referralSource || undefined,
        profile_picture_url: profilePicture || undefined,
      })
      
      // Mark registration as successful
      setRegistrationSuccess(true)
      setIsSubmitting(false)
      setCountdown(5) // Reset countdown to 5 seconds
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FED141] flex flex-col">
      <div className="px-6 md:px-8 py-6">
        <Link href="/" className="inline-block">
          <Image src="/images/logo.png" alt="go-shop" width={96} height={30} className="w-20 md:w-24 object-contain" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-2">Join Go-Shop</h1>
            <p className="text-base md:text-lg text-[#303A4D]/70">Create your account in a few simple steps</p>
          </div>

          <Stepper
            initialStep={1}
            onStepChange={handleStepChange}
            onFinalStepCompleted={handleFinalSubmit}
            backButtonText="Previous"
            nextButtonText="Next"
          >
            {/* Step 1: Basic Info */}
            <Step>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Basic Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Username *
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#303A4D] mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233 55 000 0000"
                      className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 2: Profile Picture */}
            <Step>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Profile Picture</h2>
                <p className="text-[#303A4D]/70 mb-6">Add a profile picture to personalize your account (optional)</p>
                
                <div className="flex flex-col items-center gap-6">
                  {profilePicture ? (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#303A4D]">
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[#F4F2E6] border-4 border-dashed border-[#303A4D]/30 flex items-center justify-center">
                      <Upload className="w-12 h-12 text-[#303A4D]/40" />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="inline-block bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-3 font-semibold transition-all cursor-pointer shadow-lg hover:shadow-xl"
                    >
                      {profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </label>
                    <p className="text-sm text-[#303A4D]/60 mt-3">Max size: 2MB. JPG, PNG, or GIF</p>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 3: Location & Referral */}
            <Step>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Delivery & More</h2>
                
                <div>
                  <label className="block text-sm font-medium text-[#303A4D] mb-2">
                    Delivery Location <span className="text-[#303A4D]/50">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50"
                  >
                    {isGettingLocation ? "Getting location..." : location ? "Update Location" : "Get Current Location"}
                  </button>
                  {location && (
                    <div className="mt-3 p-4 bg-[#F4F2E6] rounded-xl">
                      <p className="text-sm text-[#303A4D] font-medium mb-1">📍 Delivery Address:</p>
                      <p className="text-sm text-[#303A4D]/70">{location.address}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="referralSource" className="block text-sm font-medium text-[#303A4D] mb-2">
                    How did you hear about us? <span className="text-[#303A4D]/50">(Optional)</span>
                  </label>
                  <select
                    id="referralSource"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={handleChange}
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:border-[#303A4D] transition-colors"
                  >
                    <option value="">Select an option</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Friend/Family">Friend or Family</option>
                    <option value="Radio">Radio</option>
                    <option value="TV">TV</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </Step>

            {/* Step 4: Password */}
            <Step>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Create Password</h2>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                  />
                  <p className="text-sm text-[#303A4D]/60 mt-2">At least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#303A4D] transition-colors"
                  />
                </div>

                <div className="flex items-start gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="w-5 h-5 mt-1 rounded border-2 border-[#303A4D]/30 text-[#303A4D] focus:ring-[#303A4D]"
                  />
                  <label htmlFor="terms" className="text-sm text-[#303A4D]">
                    I agree to the{" "}
                    <Link href="#" className="underline font-semibold hover:text-[#FED141]">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="underline font-semibold hover:text-[#FED141]">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            </Step>
          </Stepper>

              <div className="mt-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#303A4D]/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#FED141] text-[#303A4D] font-medium">Or sign up with</span>
              </div>
            </div>

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
                  toast({
                    title: "OAuth Error",
                    description: "Could not initiate Google sign up. Please try again.",
                    variant: "destructive",
                  })
                }
              }}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#303A4D] rounded-xl px-6 py-3 font-semibold transition-all shadow-lg hover:shadow-xl border-2 border-[#303A4D]/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="text-center">
              <p className="text-[#303A4D]">
                Already have an account?{" "}
                <Link href="/login" className="font-bold hover:text-white transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal Overlay */}
      {registrationSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full animate-in zoom-in duration-500">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-700">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#303A4D] text-center">Welcome to Go-Shop!</h2>
              <p className="text-lg text-[#303A4D]/70 text-center">
                Hi {formData.name}! Your account has been created successfully.
              </p>
              <p className="text-sm text-[#303A4D]/60 text-center">
                Redirecting you to the homepage in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#303A4D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#303A4D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#303A4D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
