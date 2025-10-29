"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { UserType } from "@/lib/types"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register } = useAuth()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be less than 2MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
        return
      }

      // Convert to base64
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
        
        // Reverse geocode to get address
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
          // Fallback to coordinates only
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
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
        user_type: UserType.BUYER, // Default to buyer
        location: location?.address || undefined,
        latitude: location?.latitude || undefined,
        longitude: location?.longitude || undefined,
        referral_source: formData.referralSource || undefined,
        profile_picture_url: profilePicture || undefined,
      })
      
      toast({
        title: "🎉 Welcome to GoShop Ghana!",
        description: `Hi ${formData.name}! Your account has been created successfully. Check your email and SMS for welcome message with FREE delivery offer!`,
      })
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#4698CA] flex flex-col">
      {/* Header */}
      <div className="px-6 md:px-8 py-6">
        <Link href="/" className="inline-block">
          <Image src="/images/logo.png" alt="go-shop" width={124} height={39} className="brightness-0 invert" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-3">Join Go-Shop</h1>
            <p className="text-lg text-[#303A4D]/70 mb-6">Create your account and start shopping fresh</p>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/v1/oauth/google/login')
                    const data = await response.json()
                    window.location.href = data.auth_url
                  } catch (error) {
                    console.error('OAuth error:', error)
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-[#4698CA] rounded-2xl px-4 py-3 text-[#303A4D] font-medium transition-colors"
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
                <span className="px-4 bg-white text-[#303A4D]/60">Or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                  />
                </div>
              </div>

              {/* Profile Picture Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Profile Picture <span className="text-[#303A4D]/50">(Optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  {profilePicture ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FED141]">
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#F4F2E6] border-2 border-dashed border-[#303A4D]/30 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-[#303A4D]/40" />
                    </div>
                  )}
                  <div className="flex-1">
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
                      className="inline-block bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-6 py-3 font-medium transition-colors cursor-pointer"
                    >
                      {profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </label>
                    <p className="text-sm text-[#303A4D]/60 mt-2">Max size: 2MB. JPG, PNG, or GIF</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
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
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                  />
                </div>
              </div>


              {/* Delivery Location */}
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Delivery Location <span className="text-[#303A4D]/50">(Optional)</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex-1 bg-[#4698CA] hover:bg-[#3B7BA8] text-white rounded-2xl px-4 py-4 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isGettingLocation ? "Getting location..." : location ? "Update Location" : "Get Current Location"}
                  </button>
                </div>
                {location && (
                  <div className="mt-3 p-4 bg-[#F4F2E6] rounded-2xl">
                    <p className="text-sm text-[#303A4D] font-medium mb-1">📍 Delivery Address:</p>
                    <p className="text-sm text-[#303A4D]/70">{location.address}</p>
                    <p className="text-xs text-[#303A4D]/50 mt-1">
                      Coordinates: {location.latitude}, {location.longitude}
                    </p>
                  </div>
                )}
                <p className="text-sm text-[#303A4D]/60 mt-2">
                  We'll use this location for delivery. You can update it later in your profile.
                </p>
              </div>

              {/* How did you hear about us */}
              <div>
                <label htmlFor="referralSource" className="block text-sm font-medium text-[#303A4D] mb-2">
                  How did you hear about us? <span className="text-[#303A4D]/50">(Optional)</span>
                </label>
                <select
                  id="referralSource"
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleChange}
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] focus:outline-none focus:border-[#4698CA] transition-colors"
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
                  <option value="Billboard">Billboard</option>
                  <option value="Market">Local Market</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#303A4D] mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-4 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-5 h-5 mt-1 rounded border-2 border-[#303A4D]/30 text-[#4698CA] focus:ring-[#4698CA]"
                />
                <label htmlFor="terms" className="text-sm text-[#303A4D]">
                  I agree to the{" "}
                  <Link href="#" className="underline hover:text-[#4698CA]">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline hover:text-[#4698CA]">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#303A4D]/70">
                Already have an account?{" "}
                <Link href="/login" className="text-[#303A4D] font-bold hover:text-[#4698CA]">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
