"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, User, CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function AddRiderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_type: "motorcycle",
    vehicle_number: "",
    vehicle_make_model: "",
    vehicle_color: "",
    ghana_card_number: "",
    license_number: "",
    alternative_phone: "",
    base_location: "",
    notes: ""
  })

  // Image states
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>("")
  const [ghanaCardFront, setGhanaCardFront] = useState<File | null>(null)
  const [ghanaCardFrontPreview, setGhanaCardFrontPreview] = useState<string>("")
  const [ghanaCardBack, setGhanaCardBack] = useState<File | null>(null)
  const [ghanaCardBackPreview, setGhanaCardBackPreview] = useState<string>("")

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'front' | 'back'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === 'profile') {
          setProfilePicture(file)
          setProfilePreview(result)
        } else if (type === 'front') {
          setGhanaCardFront(file)
          setGhanaCardFrontPreview(result)
        } else {
          setGhanaCardBack(file)
          setGhanaCardBackPreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    // For now, convert to base64 and store directly
    // In production, upload to cloud storage (Cloudinary, AWS S3, etc.)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload images
      let profile_picture_url = ""
      let ghana_card_front_url = ""
      let ghana_card_back_url = ""

      if (profilePicture) {
        profile_picture_url = await uploadImage(profilePicture)
      }
      if (ghanaCardFront) {
        ghana_card_front_url = await uploadImage(ghanaCardFront)
      }
      if (ghanaCardBack) {
        ghana_card_back_url = await uploadImage(ghanaCardBack)
      }

      // Create rider (backend will auto-create user account and send credentials)
      const token = localStorage.getItem("access_token")
      
      const riderResponse = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/riders/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: formData.full_name,  // For user account creation
          email: formData.email,  // For user account creation and email notification
          vehicle_type: formData.vehicle_type,
          vehicle_number: formData.vehicle_number,
          vehicle_make_model: formData.vehicle_make_model,
          vehicle_color: formData.vehicle_color,
          profile_picture_url,
          ghana_card_number: formData.ghana_card_number,
          ghana_card_front_url,
          ghana_card_back_url,
          license_number: formData.license_number,
          phone: formData.phone,
          alternative_phone: formData.alternative_phone,
          base_location: { address: formData.base_location },
          notes: formData.notes
        })
      })

      if (riderResponse.ok) {
        toast({
          title: "Success",
          description: "Rider created successfully"
        })
        router.push("/admin/riders")
      } else {
        const error = await riderResponse.json()
        throw new Error(error.detail || "Failed to create rider")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create rider",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <div className="w-full px-6 py-8">
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Profile Picture */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Picture
            </h2>
            <div className="flex flex-col items-center gap-4">
              {profilePreview ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#FED141]">
                  <Image src={profilePreview} alt="Profile" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <Label htmlFor="profile-picture" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-lg font-semibold">
                  <Upload className="w-4 h-4" />
                  Upload Profile Picture
                </div>
                <Input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'profile')}
                />
              </Label>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="alternative_phone">Alternative Phone</Label>
                <Input
                  id="alternative_phone"
                  value={formData.alternative_phone}
                  onChange={(e) => setFormData({...formData, alternative_phone: e.target.value})}
                />
              </div>
            </div>
          </Card>

          {/* Ghana Card */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Ghana Card Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ghana_card_number">Ghana Card Number</Label>
                <Input
                  id="ghana_card_number"
                  placeholder="GHA-XXXXXXXXX-X"
                  value={formData.ghana_card_number}
                  onChange={(e) => setFormData({...formData, ghana_card_number: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Ghana Card Front */}
                <div>
                  <Label>Ghana Card (Front)</Label>
                  <div className="mt-2">
                    {ghanaCardFrontPreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-[#FED141]">
                        <Image src={ghanaCardFrontPreview} alt="Ghana Card Front" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <Label htmlFor="ghana-card-front" className="cursor-pointer block mt-2">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-lg font-semibold">
                        <Upload className="w-4 h-4" />
                        Upload Front
                      </div>
                      <Input
                        id="ghana-card-front"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'front')}
                      />
                    </Label>
                  </div>
                </div>

                {/* Ghana Card Back */}
                <div>
                  <Label>Ghana Card (Back)</Label>
                  <div className="mt-2">
                    {ghanaCardBackPreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-[#FED141]">
                        <Image src={ghanaCardBackPreview} alt="Ghana Card Back" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <Label htmlFor="ghana-card-back" className="cursor-pointer block mt-2">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-lg font-semibold">
                        <Upload className="w-4 h-4" />
                        Upload Back
                      </div>
                      <Input
                        id="ghana-card-back"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'back')}
                      />
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Vehicle Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => setFormData({...formData, vehicle_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <Input
                  id="vehicle_number"
                  placeholder="GR-1234-20"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_make_model">Make & Model</Label>
                <Input
                  id="vehicle_make_model"
                  placeholder="Honda CB125"
                  value={formData.vehicle_make_model}
                  onChange={(e) => setFormData({...formData, vehicle_make_model: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_color">Vehicle Color</Label>
                <Input
                  id="vehicle_color"
                  placeholder="Red"
                  value={formData.vehicle_color}
                  onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                />
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="base_location">Base Location</Label>
                <Input
                  id="base_location"
                  placeholder="Accra, Greater Accra"
                  value={formData.base_location}
                  onChange={(e) => setFormData({...formData, base_location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Any additional information about the rider..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/riders")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Rider"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
