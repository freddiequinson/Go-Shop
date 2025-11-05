"use client"

import type React from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef } from "react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

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
        referral_source: formData.referralSource || undefined,
        profile_picture_url: profilePicture || undefined,
      })
      
      toast({
        title: "🎉 Welcome to Go-Shop!",
        description: `Hi ${formData.name}! Your account has been created successfully. Redirecting you to the homepage...`,
      })

      // Redirect to homepage after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
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

          <div className="mt-8 text-center">
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
  )
}
