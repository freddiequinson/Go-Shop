"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, ArrowLeft, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const validateForm = () => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
    let isValid = true

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
      isValid = false
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
      isValid = false
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
      isValid = false
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
      isValid = false
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      const response = await fetch(`${apiUrl}/api/v1/users/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Failed to change password")
      }

      toast({
        title: "Success",
        description: "Password changed successfully!",
      })
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
      // Optionally redirect back to settings
      setTimeout(() => {
        router.push("/admin/settings")
      }, 1500)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/admin/settings" 
          className="inline-flex items-center text-[#303A4D] hover:text-[#303A4D]/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>
      </div>

      <Card className="border-2 border-[#303A4D]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FED141] rounded-lg">
              <Lock className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#303A4D]">Change Password</CardTitle>
              <CardDescription>
                Update your admin account password. Make sure to use a strong password.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[#303A4D] font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className={`pr-10 border-2 ${errors.currentPassword ? "border-red-500" : "border-[#303A4D]/30"} focus:border-[#303A4D]`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#303A4D]/60 hover:text-[#303A4D]"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-sm">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[#303A4D] font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className={`pr-10 border-2 ${errors.newPassword ? "border-red-500" : "border-[#303A4D]/30"} focus:border-[#303A4D]`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#303A4D]/60 hover:text-[#303A4D]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm">{errors.newPassword}</p>
              )}
              <p className="text-sm text-[#303A4D]/60">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#303A4D] font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pr-10 border-2 ${errors.confirmPassword ? "border-red-500" : "border-[#303A4D]/30"} focus:border-[#303A4D]`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#303A4D]/60 hover:text-[#303A4D]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white py-6 text-lg font-bold rounded-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Changing Password...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Change Password
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-[#FED141]/20 rounded-xl border-2 border-[#FED141]">
        <h3 className="font-bold text-[#303A4D] mb-2">Security Tips</h3>
        <ul className="text-sm text-[#303A4D]/80 space-y-1">
          <li>• Use a unique password that you don&apos;t use elsewhere</li>
          <li>• Include a mix of letters, numbers, and special characters</li>
          <li>• Avoid using personal information in your password</li>
          <li>• Consider using a password manager</li>
        </ul>
      </div>
    </div>
  )
}
