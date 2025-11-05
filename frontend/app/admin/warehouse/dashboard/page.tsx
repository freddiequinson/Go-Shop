"use client"

import { useEffect, useState } from "react"
import { Package, MapPin, AlertTriangle, ClipboardList, TrendingUp, Warehouse, CheckCircle, Truck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface DashboardStats {
  locations: {
    total_locations: number
    active_locations: number
    average_utilization_percentage: number
  }
  grn: {
    total_grns: number
    pending_quality_check: number
    grns_this_month: number
  }
  perishables: {
    total_expiring: number
    total_expired: number
  }
  pickLists: {
    total_pick_lists: number
    pending: number
    in_progress: number
  }
}

export default function WarehouseDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingDeliveries, setPendingDeliveries] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
    fetchPendingDeliveries()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      // Fetch all stats in parallel
      const [locationsRes, grnRes, perishablesRes, pickListsRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/warehouse/locations/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/warehouse/grn/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/warehouse/perishables/alerts?days=14", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/warehouse/pick-lists/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      if (locationsRes.ok && grnRes.ok && perishablesRes.ok && pickListsRes.ok) {
        const [locations, grn, perishables, pickLists] = await Promise.all([
          locationsRes.json(),
          grnRes.json(),
          perishablesRes.json(),
          pickListsRes.json()
        ])

        setStats({ locations, grn, perishables, pickLists })
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      toast({
        title: "Error",
        description: "Failed to load warehouse statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDeliveries = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/supply-offers/admin/all-offers", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Count accepted direct orders (waiting for delivery)
        const acceptedCount = data.filter((offer: any) => 
          offer.is_direct_order && offer.status === 'accepted'
        ).length
        setPendingDeliveries(acceptedCount)
      }
    } catch (error) {
      console.error("Failed to fetch pending deliveries:", error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="warehouse-dashboard-header"]',
      title: 'Warehouse Management Dashboard',
      description: 'Your central hub for all warehouse operations. Monitor locations, goods receipts (GRN), perishables, pick lists, and pending deliveries all in one place.',
      position: 'bottom'
    },
    {
      target: '[data-tour="locations-card"]',
      title: 'Warehouse Locations',
      description: 'Track your warehouse zones and storage locations. See utilization percentage to optimize space usage and organize inventory efficiently.',
      position: 'bottom'
    },
    {
      target: '[data-tour="grn-card"]',
      title: 'Goods Received Notes (GRN)',
      description: 'When suppliers deliver goods, create GRN to verify and record receipt. This automatically updates warehouse inventory and tracks incoming stock.',
      position: 'bottom'
    },
    {
      target: '[data-tour="perishables-card"]',
      title: 'Perishable Items Alert',
      description: 'Monitor products expiring soon. Take action to sell or discount items before they expire to minimize waste and maximize revenue.',
      position: 'bottom'
    },
    {
      target: '[data-tour="pick-lists-card"]',
      title: 'Pick Lists',
      description: 'When customers order, create pick lists for warehouse staff to gather products for delivery. Track picking progress and ensure accurate fulfillment.',
      position: 'bottom'
    },
    {
      target: '[data-tour="pending-deliveries-card"]',
      title: 'Pending Supplier Deliveries',
      description: 'Orders you\'ve placed with suppliers awaiting delivery. Receive them via GRN to add to inventory and update stock levels automatically.',
      position: 'bottom'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="warehouse-dashboard" steps={tourSteps} />
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div data-tour="warehouse-dashboard-header" className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Management</h1>
        <p className="text-[#303A4D]/70">Complete inventory and warehouse operations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Link href="/admin/warehouse/locations">
          <Card data-tour="locations-card" className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-500">Locations</span>
            </div>
            <p className="text-3xl font-bold text-[#303A4D]">{stats?.locations.active_locations || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.locations.average_utilization_percentage.toFixed(1)}% utilized
            </p>
          </Card>
        </Link>

        <Link href="/admin/warehouse/grn">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-gray-500">GRNs</span>
            </div>
            <p className="text-3xl font-bold text-[#303A4D]">{stats?.grn.grns_this_month || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.grn.pending_quality_check || 0} pending check
            </p>
          </Card>
        </Link>

        <Link href="/admin/warehouse/perishables">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <span className="text-sm font-medium text-gray-500">Perishables</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats?.perishables.total_expiring || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.perishables.total_expired || 0} expired
            </p>
          </Card>
        </Link>

        <Link href="/admin/warehouse/pick-lists">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-500">Pick Lists</span>
            </div>
            <p className="text-3xl font-bold text-[#303A4D]">{stats?.pickLists.in_progress || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.pickLists.pending || 0} pending
            </p>
          </Card>
        </Link>

        <Link href="/admin/procurement/direct-orders">
          <Card data-tour="pending-deliveries-card" className="p-6 bg-gradient-to-br from-green-500 to-green-600 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <Truck className="w-8 h-8 text-white" />
              <span className="text-sm font-medium text-white/90">Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-white">{pendingDeliveries}</p>
            <p className="text-sm text-white/80 mt-1">
              Awaiting receipt
            </p>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/warehouse/grn">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Goods Receipt</h3>
                <p className="text-sm text-gray-500">Record incoming stock</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/warehouse/locations">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Locations</h3>
                <p className="text-sm text-gray-500">Manage storage zones</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/warehouse/perishables">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Perishables</h3>
                <p className="text-sm text-gray-500">Track expiry dates</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/warehouse/pick-lists">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Pick Lists</h3>
                <p className="text-sm text-gray-500">Order fulfillment</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/warehouse">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Warehouse className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Inventory</h3>
                <p className="text-sm text-gray-500">Current stock levels</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/warehouse/analytics">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Analytics</h3>
                <p className="text-sm text-gray-500">Reports & insights</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Alerts Section */}
      {stats && (stats.grn.pending_quality_check > 0 || stats.perishables.total_expiring > 0 || stats.perishables.total_expired > 0) && (
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">⚠️ Attention Required</h2>
          <div className="space-y-3">
            {stats.grn.pending_quality_check > 0 && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-[#303A4D]">
                    {stats.grn.pending_quality_check} GRN(s) pending quality check
                  </span>
                </div>
                <Link href="/admin/warehouse/grn">
                  <Button size="sm" className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            {stats.perishables.total_expiring > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-[#303A4D]">
                    {stats.perishables.total_expiring} product(s) expiring soon
                  </span>
                </div>
                <Link href="/admin/warehouse/perishables">
                  <Button size="sm" className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
                    View
                  </Button>
                </Link>
              </div>
            )}

            {stats.perishables.total_expired > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-[#303A4D]">
                    {stats.perishables.total_expired} product(s) expired
                  </span>
                </div>
                <Link href="/admin/warehouse/perishables">
                  <Button size="sm" variant="destructive">
                    Take Action
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
      </div>
    </>
  )
}
