"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Truck, Star, MapPin, Phone, Mail, Calendar, 
  CheckCircle, XCircle, Package, Clock, ArrowLeft,
  User, CreditCard, TrendingUp, Award
} from "lucide-react"
import Link from "next/link"

interface Rider {
  id: string
  rider_code: string
  phone: string
  alternative_phone?: string
  email?: string
  vehicle_type: string
  vehicle_number?: string
  vehicle_make_model?: string
  vehicle_color?: string
  license_number?: string
  current_status: string
  rating: number | string
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  cancelled_deliveries: number
  average_delivery_time_minutes?: number
  is_verified: boolean
  is_online: boolean
  is_active: boolean
  base_location?: { address: string } | string
  notes?: string
  profile_picture_url?: string
  ghana_card_number?: string
  ghana_card_front_url?: string
  ghana_card_back_url?: string
  created_at: string
  updated_at: string
}

interface DeliveryAssignment {
  id: string
  order_id: string
  status: string
  assigned_at: string
  picked_up_at?: string
  delivered_at?: string
  estimated_delivery_time?: string
  actual_delivery_time_minutes?: number
  delivery_notes?: string
}

export default function RiderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const riderId = params.id as string

  const [rider, setRider] = useState<Rider | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "deliveries" | "documents">("overview")

  useEffect(() => {
    fetchRiderDetails()
    fetchDeliveries()
  }, [riderId])

  const fetchRiderDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/${riderId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Rider data:", data)
        setRider(data)
      } else {
        console.error("Failed to fetch rider:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch rider:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/${riderId}/deliveries`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log("Deliveries data:", data)
        setDeliveries(data || [])
      } else {
        console.error("Failed to fetch deliveries:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error)
    }
  }

  const toggleRiderStatus = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/${riderId}/toggle-status`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        fetchRiderDetails()
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
    }
  }

  const verifyRider = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/${riderId}/verify`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        fetchRiderDetails()
      }
    } catch (error) {
      console.error("Failed to verify rider:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-700"
      case "ON_DELIVERY": return "bg-blue-100 text-blue-700"
      case "OFF_DUTY": return "bg-gray-100 text-gray-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-green-100 text-green-700"
      case "IN_TRANSIT": return "bg-blue-100 text-blue-700"
      case "PICKED_UP": return "bg-yellow-100 text-yellow-700"
      case "ASSIGNED": return "bg-purple-100 text-purple-700"
      case "CANCELLED": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!rider) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-bold text-[#303A4D]">Rider not found</p>
        <Link href="/admin/riders">
          <button className="mt-4 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold">
            Back to Riders
          </button>
        </Link>
      </div>
    )
  }

  const successRate = rider.total_deliveries > 0 
    ? ((rider.successful_deliveries / rider.total_deliveries) * 100).toFixed(0)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/riders">
            <button className="p-2 hover:bg-[#F4F2E6] rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-[#303A4D]" />
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">{rider.rider_code}</h1>
            <p className="text-lg text-[#303A4D]/70">Rider Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!rider.is_verified && (
            <button
              onClick={verifyRider}
              className="px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Verify Rider
            </button>
          )}
          <button
            onClick={toggleRiderStatus}
            className={`px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2 ${
              rider.is_active
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {rider.is_active ? (
              <>
                <XCircle className="w-5 h-5" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Activate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Deliveries</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{rider.total_deliveries}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">Successful</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{rider.successful_deliveries}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Rating</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{Number(rider.rating).toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">Success Rate</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{successRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-bold transition-colors border-b-2 ${
              activeTab === "overview"
                ? "border-[#FED141] text-[#303A4D]"
                : "border-transparent text-[#303A4D]/60 hover:text-[#303A4D]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`px-6 py-3 font-bold transition-colors border-b-2 ${
              activeTab === "deliveries"
                ? "border-[#FED141] text-[#303A4D]"
                : "border-transparent text-[#303A4D]/60 hover:text-[#303A4D]"
            }`}
          >
            Deliveries
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 font-bold transition-colors border-b-2 ${
              activeTab === "documents"
                ? "border-[#FED141] text-[#303A4D]"
                : "border-transparent text-[#303A4D]/60 hover:text-[#303A4D]"
            }`}
          >
            Documents
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#303A4D]/60" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Phone</p>
                  <p className="font-bold text-[#303A4D]">{rider.phone}</p>
                </div>
              </div>
              {rider.alternative_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#303A4D]/60" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Alternative Phone</p>
                    <p className="font-bold text-[#303A4D]">{rider.alternative_phone}</p>
                  </div>
                </div>
              )}
              {rider.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#303A4D]/60" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Email</p>
                    <p className="font-bold text-[#303A4D]">{rider.email}</p>
                  </div>
                </div>
              )}
              {rider.base_location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#303A4D]/60" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Base Location</p>
                    <p className="font-bold text-[#303A4D]">
                      {typeof rider.base_location === 'string' 
                        ? rider.base_location 
                        : (rider.base_location?.address || 'Not specified')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#303A4D]/60" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Joined</p>
                  <p className="font-bold text-[#303A4D]">
                    {new Date(rider.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${rider.is_online ? "bg-green-500" : "bg-gray-400"}`}></div>
                <div>
                  <p className="text-sm text-[#303A4D]/60">Status</p>
                  <p className="font-bold text-[#303A4D]">
                    {rider.is_online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-2">
              <Truck className="w-6 h-6" />
              Vehicle Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#303A4D]/60">Vehicle Type</p>
                <p className="font-bold text-[#303A4D] text-lg">{rider.vehicle_type}</p>
              </div>
              {rider.vehicle_number && (
                <div>
                  <p className="text-sm text-[#303A4D]/60">Vehicle Number</p>
                  <p className="font-bold text-[#303A4D]">{rider.vehicle_number}</p>
                </div>
              )}
              {rider.vehicle_make_model && (
                <div>
                  <p className="text-sm text-[#303A4D]/60">Make & Model</p>
                  <p className="font-bold text-[#303A4D]">{rider.vehicle_make_model}</p>
                </div>
              )}
              {rider.vehicle_color && (
                <div>
                  <p className="text-sm text-[#303A4D]/60">Color</p>
                  <p className="font-bold text-[#303A4D]">{rider.vehicle_color}</p>
                </div>
              )}
              {rider.license_number && (
                <div>
                  <p className="text-sm text-[#303A4D]/60">License Number</p>
                  <p className="font-bold text-[#303A4D]">{rider.license_number}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[#303A4D]/60">Current Status</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mt-1 ${getStatusColor(rider.current_status)}`}>
                  {rider.current_status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Performance Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Successful</p>
                <p className="text-2xl font-bold text-green-600">{rider.successful_deliveries}</p>
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-600">{rider.failed_deliveries}</p>
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-orange-600">{rider.cancelled_deliveries}</p>
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/60">Avg. Time</p>
                <p className="text-2xl font-bold text-[#303A4D]">
                  {rider.average_delivery_time_minutes ? `${rider.average_delivery_time_minutes}m` : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {rider.notes && (
            <div className="bg-white rounded-3xl p-6 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Notes</h2>
              <p className="text-[#303A4D]">{rider.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "deliveries" && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4F2E6]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Assigned</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Picked Up</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Delivered</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${delivery.order_id}`}>
                        <span className="font-bold text-blue-600 hover:underline">
                          #{delivery.order_id.slice(0, 8)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDeliveryStatusColor(delivery.status)}`}>
                        {delivery.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#303A4D]">
                      {new Date(delivery.assigned_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-[#303A4D]">
                      {delivery.picked_up_at ? new Date(delivery.picked_up_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-[#303A4D]">
                      {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${delivery.order_id}`}>
                        <button className="px-3 py-1 bg-[#303A4D] text-white rounded-full font-bold hover:bg-[#303A4D]/90 transition-colors text-sm">
                          View Order
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deliveries.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
              <p className="text-xl font-bold text-[#303A4D]">No Deliveries Yet</p>
              <p className="text-[#303A4D]/60">This rider hasn't been assigned any deliveries</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Picture */}
          {rider.profile_picture_url && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Profile Picture</h2>
              <img
                src={rider.profile_picture_url}
                alt="Profile"
                className="w-full h-64 object-cover rounded-2xl"
              />
            </div>
          )}

          {/* Ghana Card */}
          {rider.ghana_card_number && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Ghana Card
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#303A4D]/60">Card Number</p>
                  <p className="font-bold text-[#303A4D] text-lg">{rider.ghana_card_number}</p>
                </div>
                {rider.ghana_card_front_url && (
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-2">Front</p>
                    <img
                      src={rider.ghana_card_front_url}
                      alt="Ghana Card Front"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                  </div>
                )}
                {rider.ghana_card_back_url && (
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-2">Back</p>
                    <img
                      src={rider.ghana_card_back_url}
                      alt="Ghana Card Back"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {!rider.profile_picture_url && !rider.ghana_card_number && (
            <div className="bg-white rounded-3xl p-12 text-center lg:col-span-2">
              <CreditCard className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
              <p className="text-xl font-bold text-[#303A4D]">No Documents Available</p>
              <p className="text-[#303A4D]/60">This rider hasn't uploaded any documents yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
