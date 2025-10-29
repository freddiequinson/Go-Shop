"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usersService } from "@/lib/api/services"
import Image from "next/image"

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    profile_picture_url: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const regions = [
    "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
    "Northern", "Upper East", "Upper West", "Volta", "Bono",
    "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North",
  ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
    
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: "",
        profile_picture_url: user.profile_picture_url || "",
      })
      setPreviewImage(user.profile_picture_url || null)
    }
  }, [user, isAuthenticated, isLoading, router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreviewImage(base64String)
      setFormData(prev => ({
        ...prev,
        profile_picture_url: base64String
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      await usersService.updateProfile(formData)
      
      // Refresh user data in auth context
      await refreshUser()
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been updated successfully.",
      })
      
      router.push("/profile")
    } catch (error: any) {
      console.error("Profile update error:", error)
      
      // Extract error message from response
      let errorMessage = "Could not update profile"
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
          <p className="text-[#303A4D] text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Profile</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Edit Profile</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-32 h-32 mb-4">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-[#FED141] flex items-center justify-center">
                    <Camera className="w-12 h-12 text-[#303A4D]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-600">Click the upload button to change your profile picture</p>
              <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name" className="text-[#303A4D] font-medium mb-2 block">
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-[#F4F2E6] border-2 border-transparent focus:border-[#FED141] rounded-xl"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-[#303A4D] font-medium mb-2 block">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233 24 123 4567"
                className="bg-[#F4F2E6] border-2 border-transparent focus:border-[#FED141] rounded-xl"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-[#303A4D] font-medium mb-2 block">
                Region
              </Label>
              <select
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-[#F4F2E6] border-2 border-transparent focus:border-[#FED141] rounded-xl px-4 py-3 text-[#303A4D]"
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-[#303A4D] font-medium mb-2 block">
                Bio (Optional)
              </Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full bg-[#F4F2E6] border-2 border-transparent focus:border-[#FED141] rounded-xl px-4 py-3 text-[#303A4D] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-xl py-6 text-lg font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/profile")}
                variant="outline"
                className="px-8 rounded-xl py-6 border-2 border-[#303A4D]/20"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
