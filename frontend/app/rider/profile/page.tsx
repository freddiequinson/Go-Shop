"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  User, Phone, MapPin, Bike, Shield, Edit2, Save, X, Lock, Mail
} from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"

export default function RiderProfilePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [rider, setRider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    alternative_phone: "",
    base_location: "",
    vehicle_type: "",
    vehicle_number: "",
    notes: ""
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await ridersService.getMyProfile()
      setRider(response.data)
      setFormData({
        username: user?.username || "",
        phone: response.data.phone || "",
        alternative_phone: response.data.alternative_phone || "",
        base_location: typeof response.data.base_location === 'object' 
          ? response.data.base_location.address 
          : response.data.base_location || "",
        vehicle_type: response.data.vehicle_type || "",
        vehicle_number: response.data.vehicle_number || "",
        notes: response.data.notes || ""
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await ridersService.updateProfile(formData)
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
      setEditing(false)
      fetchProfile()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setShowPasswordSection(false)
    if (rider) {
      setFormData({
        username: user?.username || "",
        phone: rider.phone || "",
        alternative_phone: rider.alternative_phone || "",
        base_location: typeof rider.base_location === 'object' 
          ? rider.base_location.address 
          : rider.base_location || "",
        vehicle_type: rider.vehicle_type || "",
        vehicle_number: rider.vehicle_number || "",
        notes: rider.notes || ""
      })
    }
    setPasswordData({ current_password: "", new_password: "", confirm_password: "" })
  }

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      // Call password change API
      await ridersService.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      toast({
        title: "Success",
        description: "Password changed successfully"
      })
      setShowPasswordSection(false)
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your rider information</p>
      </div>

      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] text-3xl font-bold">
              {user?.full_name?.charAt(0) || 'R'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#303A4D]">{user?.full_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {rider?.is_verified && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Shield className="w-4 h-4" />
                    Verified
                  </span>
                )}
                <span className={`text-sm px-2 py-1 rounded ${
                  rider?.is_online 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {rider?.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Deliveries</p>
          <p className="text-2xl font-bold text-[#303A4D] mt-1">
            {rider?.total_deliveries || 0}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {rider?.total_deliveries > 0 
              ? ((rider?.successful_deliveries / rider?.total_deliveries) * 100).toFixed(1)
              : 0}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Rating</p>
          <p className="text-2xl font-bold text-[#FED141] mt-1">
            {typeof rider?.rating === 'number' ? rider.rating.toFixed(1) : '0.0'} ⭐
          </p>
        </Card>
      </div>

      {/* Account Information */}
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-bold text-[#303A4D] mb-6">Account Information</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              disabled={!editing}
              placeholder="username"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {!showPasswordSection && editing && (
            <Button
              onClick={() => setShowPasswordSection(true)}
              variant="outline"
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          )}

          {showPasswordSection && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-[#303A4D] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change Password
              </h4>
              
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
                >
                  Update Password
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordSection(false)
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-bold text-[#303A4D] mb-6">Contact Information</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Primary Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!editing}
                placeholder="0241234567"
              />
            </div>

            <div>
              <Label htmlFor="alt_phone" className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Alternative Phone
              </Label>
              <Input
                id="alt_phone"
                value={formData.alternative_phone}
                onChange={(e) => setFormData({...formData, alternative_phone: e.target.value})}
                disabled={!editing}
                placeholder="0241234567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Base Location
            </Label>
            <Input
              id="location"
              value={formData.base_location}
              onChange={(e) => setFormData({...formData, base_location: e.target.value})}
              disabled={!editing}
              placeholder="Accra, Ghana"
            />
          </div>
        </div>

        <h3 className="text-xl font-bold text-[#303A4D] mt-8 mb-6">Vehicle Information</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_type" className="flex items-center gap-2 mb-2">
                <Bike className="w-4 h-4" />
                Vehicle Type
              </Label>
              <select
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                disabled={!editing}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141] disabled:bg-gray-100"
              >
                <option value="">Select vehicle type</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>

            <div>
              <Label htmlFor="vehicle_number" className="flex items-center gap-2 mb-2">
                <Bike className="w-4 h-4" />
                Vehicle Number
              </Label>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                disabled={!editing}
                placeholder="GR-1234-20"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              disabled={!editing}
              placeholder="Any additional information..."
              rows={4}
            />
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
