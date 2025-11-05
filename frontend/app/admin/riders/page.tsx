"use client"

import { useEffect, useState } from "react"
import { Truck, Star, MapPin, Plus, Search, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface Rider {
  id: string
  user_id: string
  rider_code: string
  phone: string
  vehicle_type: string
  current_status: string
  rating: number | string
  total_deliveries: number
  successful_deliveries: number
  is_verified: boolean
  is_online: boolean
  is_active: boolean
}

interface User {
  id: string
  full_name: string
  email: string
  phone: string
}

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchRiders()
  }, [statusFilter])

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem("access_token")
      let url = "http://localhost:8000/api/v1/admin/riders?per_page=50"
      
      if (statusFilter !== "all") {
        url += `&current_status=${statusFilter}`
      }

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Riders data:", data)
        setRiders(data.riders || [])
        
        // Fetch user details for each rider
        const userIds = data.riders.map((r: Rider) => r.user_id).filter(Boolean)
        if (userIds.length > 0) {
          await fetchUsers(userIds)
        }
      } else {
        console.error("Failed to fetch riders:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch riders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async (userIds: string[]) => {
    try {
      const token = localStorage.getItem("access_token")
      const usersMap: Record<string, User> = {}
      
      // Fetch each user
      for (const userId of userIds) {
        const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (response.ok) {
          const user = await response.json()
          usersMap[userId] = user
        }
      }
      
      setUsers(usersMap)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const verifyRider = async (riderId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/riders/${riderId}/verify`,
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

  const deleteRider = async (riderId: string, riderName: string) => {
    console.log("Delete rider called:", riderId, riderName)
    
    const displayName = riderName || "this rider"
    if (!confirm(`Are you sure you want to delete ${displayName}? This action cannot be undone.`)) {
      console.log("Delete cancelled by user")
      return
    }

    console.log("Proceeding with delete...")
    try {
      const token = localStorage.getItem("access_token")
      console.log("Sending DELETE request to:", `http://localhost:8000/api/v1/admin/riders/${riderId}`)
      
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/riders/${riderId}`,
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      console.log("Delete response:", response.status, response.statusText)
      
      if (response.ok) {
        console.log("Delete successful, refreshing riders list")
        alert("Rider deleted successfully!")
        fetchRiders()
      } else {
        const errorText = await response.text()
        console.error("Delete failed:", errorText)
        alert(`Failed to delete rider: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Failed to delete rider:", error)
      alert("Error deleting rider: " + error)
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

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="riders-header"]',
      title: 'Rider Management',
      description: 'Manage your delivery riders. Riders handle order deliveries from warehouse to customers using GPS tracking. Monitor their performance and availability.',
      position: 'bottom'
    },
    {
      target: '[data-tour="add-rider"]',
      title: 'Add New Rider',
      description: 'Register new riders with their details, vehicle info, and contact. Riders must be verified before they can accept delivery assignments.',
      position: 'left'
    },
    {
      target: '[data-tour="rider-stats"]',
      title: 'Rider Statistics',
      description: 'Quick overview: total riders, available riders (online and ready), riders on delivery, and verified riders. Monitor your delivery capacity.',
      position: 'bottom'
    },
    {
      target: '[data-tour="search-riders"]',
      title: 'Search & Filter Riders',
      description: 'Search riders by code or phone. Filter by status (Available, On Delivery, Off Duty) to find riders for assignments.',
      position: 'bottom'
    },
    {
      target: '[data-tour="rider-list"]',
      title: 'Rider Directory',
      description: 'All riders with status, ratings, delivery stats, and performance metrics. Click any rider to view details and assign orders.',
      position: 'bottom'
    },
    {
      target: '[data-tour="verify-rider"]',
      title: 'Verify Rider',
      description: 'Verify new riders after reviewing their credentials and vehicle documents. Only verified riders can accept delivery assignments.',
      position: 'left'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="riders" steps={tourSteps} />
      <div>
      <div data-tour="riders-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Riders</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your delivery riders</p>
        </div>
        <Link href="/admin/riders/new">
          <button data-tour="add-rider" className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors">
            <Plus className="w-5 h-5" />
            Add Rider
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div data-tour="rider-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div data-tour="search-riders" className="bg-white rounded-3xl p-6 shadow-sm mb-6">
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

      {/* Riders Table */}
      <div data-tour="rider-list" className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Rider Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Rating</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Deliveries</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Success Rate</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRiders.map((rider) => (
                <tr key={rider.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FED141] rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-[#303A4D]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#303A4D]">{users[rider.user_id]?.full_name || rider.rider_code}</p>
                        <p className="text-xs text-[#303A4D]/60">{rider.rider_code}</p>
                        {rider.is_verified && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#303A4D]">{rider.phone}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-[#303A4D]">{rider.vehicle_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center ${getStatusColor(rider.current_status)}`}>
                        {rider.current_status.replace(/_/g, " ")}
                      </span>
                      {rider.is_online && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 justify-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Online
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-[#303A4D]">{Number(rider.rating).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#303A4D]">{rider.total_deliveries}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-green-600">
                      {rider.total_deliveries > 0 ? ((rider.successful_deliveries / rider.total_deliveries) * 100).toFixed(0) : 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!rider.is_verified && (
                        <button
                          data-tour="verify-rider"
                          onClick={() => verifyRider(rider.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors text-sm"
                        >
                          Verify
                        </button>
                      )}
                      <Link href={`/admin/riders/${rider.id}`}>
                        <button className="px-3 py-1 bg-[#303A4D] text-white rounded-full font-bold hover:bg-[#303A4D]/90 transition-colors text-sm">
                          View
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          console.log("Delete button clicked for rider:", rider.id)
                          deleteRider(rider.id, users[rider.user_id]?.full_name || rider.rider_code)
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRiders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Truck className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-xl font-bold text-[#303A4D]">No Riders Found</p>
          <p className="text-[#303A4D]/60">Try adjusting your search or add a new rider</p>
        </div>
      )}
      </div>
    </>
  )
}
