"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, TrendingUp, CheckCircle, Clock, DollarSign, Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface DashboardStats {
  supplier_name: string
  pending_requests: number
  active_offers: number
  accepted_offers: number
  completed_deliveries: number
  total_revenue: string
  average_rating: string
  on_time_delivery_rate: string
  recent_requests: any[]
  recent_offers: any[]
}

export default function SupplierDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/supplier/dashboard`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        
        // Store supplier name in localStorage for sidebar
        if (data.supplier_name) {
          localStorage.setItem("supplier_name", data.supplier_name)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 sm:p-6 md:p-8 text-center">Loading dashboard...</div>
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="supplier-header"]',
      title: 'Welcome to Your Supplier Dashboard!',
      description: 'This is your command center. View pending supply requests, manage your offers, track deliveries, and monitor your performance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="supplier-stats"]',
      title: 'Your Business Metrics',
      description: 'Track pending requests, active offers, completed deliveries, revenue, and your supplier rating. Click any card to dive deeper.',
      position: 'bottom'
    },
    {
      target: '[data-tour="recent-requests"]',
      title: 'Recent Supply Requests',
      description: 'View the latest supply requests from GoShop. Click "Submit Offer" to bid on requests and grow your business.',
      position: 'top'
    },
    {
      target: '[data-tour="recent-offers"]',
      title: 'Your Recent Offers',
      description: 'Monitor the status of your submitted offers. Track which offers are pending, accepted, or rejected.',
      position: 'top'
    }
  ]

  return (
    <>
      {!loading && <OnboardingTour tourId="supplier-dashboard" steps={tourSteps} />}
      <div className="p-4 sm:p-6 md:p-8 bg-[#F4F2E6] min-h-screen pt-20 lg:pt-8">
      {/* Header */}
      <div data-tour="supplier-header" className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#303A4D] mb-2">Supplier Dashboard</h1>
        <p className="text-sm sm:text-base text-[#303A4D]/70">Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Grid */}
      <div data-tour="supplier-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Pending Requests */}
        <Card className="p-4 sm:p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-500">Pending</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats?.pending_requests || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Supply Requests</p>
          <Link href="/supplier/requests">
            <Button variant="link" className="mt-2 p-0 h-auto text-orange-600">
              View Requests →
            </Button>
          </Link>
        </Card>

        {/* Active Offers */}
        <Card className="p-4 sm:p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Active</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats?.active_offers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Offers</p>
          <Link href="/supplier/offers">
            <Button variant="link" className="mt-2 p-0 h-auto text-blue-600">
              View Offers →
            </Button>
          </Link>
        </Card>

        {/* Accepted Offers */}
        <Card className="p-4 sm:p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Accepted</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats?.accepted_offers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Offers Accepted</p>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 sm:p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">GH₵{stats?.total_revenue || "0.00"}</p>
          <p className="text-sm text-gray-500 mt-1">Total Earnings</p>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <h3 className="font-bold text-[#303A4D]">Average Rating</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#303A4D]">{stats?.average_rating || "0.0"} / 5.0</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Based on {stats?.completed_deliveries || 0} deliveries</p>
        </Card>

        <Card className="p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h3 className="font-bold text-[#303A4D]">On-Time Delivery</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#303A4D]">{stats?.on_time_delivery_rate || "0"}%</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Delivery performance</p>
        </Card>

        <Card className="p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h3 className="font-bold text-[#303A4D]">Completed Orders</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#303A4D]">{stats?.completed_deliveries || 0}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Total deliveries</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <div data-tour="recent-activity" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Requests */}
        <Card data-tour="recent-requests" className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#303A4D]">Recent Requests</h2>
            <Link href="/supplier/requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {stats?.recent_requests && stats.recent_requests.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_requests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#303A4D]">{request.product_name}</span>
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Quantity: {request.quantity_needed} {request.unit_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Request #{request.request_number}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent requests</p>
          )}
        </Card>

        {/* Recent Offers */}
        <Card data-tour="recent-offers" className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#303A4D]">Recent Offers</h2>
            <Link href="/supplier/offers">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {stats?.recent_offers && stats.recent_offers.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_offers.slice(0, 5).map((offer: any) => (
                <div key={offer.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#303A4D]">{offer.product_name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      offer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    GH₵{offer.total_price} • {offer.offered_quantity} units
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Request #{offer.request_number}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent offers</p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#303A4D] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/supplier/requests">
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <Clock className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold text-[#303A4D] mb-2">View Requests</h3>
              <p className="text-sm text-gray-600">See all supply requests and submit offers</p>
            </Card>
          </Link>

          <Link href="/supplier/offers">
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <Package className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-[#303A4D] mb-2">Manage Offers</h3>
              <p className="text-sm text-gray-600">Track and update your submitted offers</p>
            </Card>
          </Link>

          <Link href="/supplier/profile">
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
              <Star className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-[#303A4D] mb-2">Update Profile</h3>
              <p className="text-sm text-gray-600">Manage your supplier information</p>
            </Card>
          </Link>
        </div>
      </div>
      </div>
    </>
  )
}
