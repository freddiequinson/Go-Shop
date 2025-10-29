"use client"

import { useEffect, useState } from "react"
import { Truck, Star, MapPin, Plus, Search, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Rider {
  id: string
  rider_code: string
  phone: string
  vehicle_type: string
  current_status: string
  rating: number
  total_deliveries: number
  successful_deliveries: number
  is_verified: boolean
  is_online: boolean
  is_active: boolean
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchRiders()
  }, [statusFilter])

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = "http://localhost:8000/api/v1/riders?per_page=50"
      
      if (statusFilter !== "all") {
        url += `&current_status=${statusFilter}`
      }

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRiders(data.riders || [])
      }
    } catch (error) {
      console.error("Failed to fetch riders:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyRider = async (riderId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `http://localhost:8000/api/v1/riders/${riderId}/verify`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        fetchRiders()
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

  const filteredRiders = riders.filter(r =>
    r.rider_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const availableRiders = riders.filter(r => r.current_status === "AVAILABLE" && r.is_online)
  const onDeliveryRiders = riders.filter(r => r.current_status === "ON_DELIVERY")
  const verifiedRiders = riders.filter(r => r.is_verified)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Riders</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your delivery riders</p>
        </div>
        <Link href="/admin/riders/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors">
            <Plus className="w-5 h-5" />
            Add Rider
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Riders</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{riders.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">Available</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{availableRiders.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">On Delivery</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{onDeliveryRiders.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Verified</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{verifiedRiders.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                statusFilter === "all" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                statusFilter === "AVAILABLE" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter("ON_DELIVERY")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                statusFilter === "ON_DELIVERY" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              On Delivery
            </button>
          </div>
        </div>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRiders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#FED141] rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#303A4D]" />
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(rider.current_status)}`}>
                  {rider.current_status.replace(/_/g, " ")}
                </span>
                {rider.is_online && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#303A4D] mb-1">{rider.rider_code}</h3>
            <p className="text-sm text-[#303A4D]/60 mb-4">{rider.phone}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Vehicle</span>
                <span className="font-bold text-[#303A4D]">{rider.vehicle_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-[#303A4D]">{rider.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Deliveries</span>
                <span className="font-bold text-[#303A4D]">{rider.total_deliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Success Rate</span>
                <span className="font-bold text-green-600">
                  {rider.total_deliveries > 0 ? ((rider.successful_deliveries / rider.total_deliveries) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!rider.is_verified && (
                <button
                  onClick={() => verifyRider(rider.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors text-sm"
                >
                  Verify
                </button>
              )}
              <Link href={`/admin/riders/${rider.id}`} className="flex-1">
                <button className="w-full px-4 py-2 bg-[#303A4D] text-white rounded-full font-bold hover:bg-[#303A4D]/90 transition-colors text-sm">
                  View Details
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Truck className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-xl font-bold text-[#303A4D]">No Riders Found</p>
          <p className="text-[#303A4D]/60">Try adjusting your search or add a new rider</p>
        </div>
      )}
    </div>
  )
}
