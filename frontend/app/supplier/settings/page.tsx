"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User, Lock, Building, Phone, Mail, MapPin, Save } from "lucide-react"

interface SupplierProfile {
  id: string
  name: string
  supplier_code: string
  contact_person: string
  phone: string
  email: string
  location: any
  specialization: string[]
}

interface UserCredentials {
  username: string
  email: string
}

export default function SupplierSettings() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [user, setUser] = useState<UserCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Profile form state
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")

  // Credentials form state
  const [username, setUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    fetchProfile()
    fetchUserInfo()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setContactPerson(data.contact_person || "")
        setPhone(data.phone || "")
        setEmail(data.email || "")
        setLocation(typeof data.location === 'string' ? data.location : data.location?.address || "")
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
        setUsername(userData.username || "")
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem("access_token")
      const updates = {
        contact_person: contactPerson,
        phone: phone,
        email: email,
        location: location
      }

      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
        fetchProfile()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (newPassword && newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem("access_token")
      const params = new URLSearchParams()
      
      if (username !== user?.username) {
        params.append("username", username)
      }
      if (newPassword) {
        params.append("password", newPassword)
      }

      if (params.toString() === "") {
        toast({
          title: "Info",
          description: "No changes to save",
        })
        setSaving(false)
        return
      }

      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/credentials?${params}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Credentials updated successfully. Please login again with your new credentials."
        })
        
        // Clear passwords
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        
        // Update stored user data if username changed
        if (username !== user?.username) {
          const userStr = localStorage.getItem("user")
          if (userStr) {
            const userData = JSON.parse(userStr)
            userData.username = username
            localStorage.setItem("user", JSON.stringify(userData))
          }
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to update credentials",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update credentials",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>
  }

  return (
    <div className="p-4 md:p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-2">Settings</h1>
        <p className="text-[#303A4D]/70">Manage your account and preferences</p>
      </div>

      <div className="w-full space-y-6">
        {/* Business Information */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">Business Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-[#303A4D]">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  value={profile?.name || ""}
                  disabled
                  className="bg-gray-100 h-11"
                />
                <p className="text-xs text-gray-500">Contact admin to change</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierCode" className="text-sm font-medium text-[#303A4D]">
                  Supplier Code
                </Label>
                <Input
                  id="supplierCode"
                  value={profile?.supplier_code || ""}
                  disabled
                  className="bg-gray-100 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-medium text-[#303A4D]">
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="John Doe"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-[#303A4D]">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0241234567"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#303A4D]">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supplier@example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-[#303A4D]">
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Accra, Ghana"
                  className="h-11"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 h-11 px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Login Credentials */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">Login Credentials</h2>
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-[#303A4D]">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Current: <span className="font-medium">{user?.username}</span>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-[#303A4D] mb-4 text-lg">Change Password</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-[#303A4D]">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#303A4D]">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#303A4D] text-white hover:bg-[#303A4D]/90 h-11 px-6"
              >
                <Lock className="w-4 h-4 mr-2" />
                {saving ? "Updating..." : "Update Credentials"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Information (Read-only) */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">Account Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#303A4D]">Account Email</Label>
              <p className="text-lg font-medium text-[#303A4D] bg-gray-50 p-3 rounded-md">
                {user?.email || "N/A"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#303A4D]">Specialization</Label>
              <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md min-h-[48px]">
                {profile?.specialization && profile.specialization.length > 0 ? (
                  profile.specialization.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {cat}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">None set</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
