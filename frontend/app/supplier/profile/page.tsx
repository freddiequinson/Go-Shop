"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp, Package, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SupplierProfile {
  id: string
  name: string
  supplier_code: string
  contact_person: string
  phone: string
  email: string
  location: any
  specialization: string[]
  rating: string
  on_time_delivery_rate: string
  quality_rating: string
  total_supplies: number
  verification_status: string
}

export default function SupplierProfile() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")

      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/profile`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-8 text-center">Profile not found</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Supplier Profile</h1>
        <p className="text-[#303A4D]/70">Your business information and performance</p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Basic Information */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#303A4D]">Business Information</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              profile.verification_status === 'verified' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {profile.verification_status === 'verified' ? '✓ Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">{profile.name}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Supplier Code</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">{profile.supplier_code}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Contact Person</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">{profile.contact_person}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">{profile.phone}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">{profile.email}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Location</label>
              <p className="text-lg font-medium text-[#303A4D] mt-1">
                {typeof profile.location === 'string' ? profile.location : profile.location?.address || 'N/A'}
              </p>
            </div>
          </div>

          {profile.specialization && profile.specialization.length > 0 && (
            <div className="mt-6">
              <label className="text-sm text-gray-500 block mb-2">Specialization</label>
              <div className="flex flex-wrap gap-2">
                {profile.specialization.map((category: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6 mb-6 bg-white">
          <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Performance Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#303A4D]">{profile.rating}</p>
              <p className="text-sm text-gray-600 mt-1">Average Rating</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#303A4D]">{profile.on_time_delivery_rate}%</p>
              <p className="text-sm text-gray-600 mt-1">On-Time Delivery</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#303A4D]">{profile.quality_rating}</p>
              <p className="text-sm text-gray-600 mt-1">Quality Rating</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-[#303A4D]">{profile.total_supplies}</p>
              <p className="text-sm text-gray-600 mt-1">Total Deliveries</p>
            </div>
          </div>
        </Card>

        {/* Performance Tips */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Tips to Improve Performance</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D] mb-1">Submit Competitive Offers</h3>
                <p className="text-sm text-gray-600">
                  Research market prices and submit competitive offers to increase acceptance rate
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D] mb-1">Deliver On Time</h3>
                <p className="text-sm text-gray-600">
                  Always meet delivery deadlines to maintain high on-time delivery rate
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D] mb-1">Maintain Quality Standards</h3>
                <p className="text-sm text-gray-600">
                  Ensure consistent product quality to improve your quality rating
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D] mb-1">Respond Quickly</h3>
                <p className="text-sm text-gray-600">
                  Submit offers promptly to increase chances of acceptance
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
