"use client"

import { Button } from "@/components/ui/button"
import { Search, ArrowLeft, Eye, Loader2, Package, Clock, CheckCircle, TrendingUp, Calendar, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { adminService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"


export default function OrdersManagement() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFilter, setDateFilter] = useState<string>("")
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const getErrorMessage = (error: any, fallback: string): string => {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail)
    }
    return fallback
  }

  // Fetch orders
  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, searchQuery])

  // Fetch stats
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        per_page: 20
      }
      
      if (statusFilter !== "All") {
        params.status_filter = statusFilter.toLowerCase()
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      const data = await adminService.getOrders(params)
      setOrders(data.orders)
      setTotalPages(data.pages)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to fetch orders'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId)
      await adminService.cancelOrder(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast({
        title: '✅ Order Deleted',
        description: 'The order has been permanently deleted.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete order'),
        variant: 'destructive'
      })
    } finally {
      setDeletingOrderId(null)
      setConfirmDeleteId(null)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await adminService.getOrderStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="orders-header"]',
      title: 'Order Management',
      description: 'All customer orders in one place. Process orders, assign riders, and track deliveries from pending to completed.',
      position: 'bottom'
    },
    {
      target: '[data-tour="order-stats"]',
      title: 'Order Statistics',
      description: 'Quick overview: total orders, pending payment (need action), delivered orders, and total revenue. Monitor your fulfillment performance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="search-filter"]',
      title: 'Search & Filter',
      description: 'Search orders by ID or customer name. Filter by date to find exactly what you need.',
      position: 'bottom'
    },
    {
      target: '[data-tour="status-filter"]',
      title: 'Filter by Status',
      description: 'Filter orders by status: Pending (need processing), Processing (being prepared), Delivered (completed). Focus on orders that need attention.',
      position: 'bottom'
    },
    {
      target: '[data-tour="order-list"]',
      title: 'Order List',
      description: 'All orders with customer details, items, total amount, and status. Click any order to view full details and assign riders for delivery.',
      position: 'bottom'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="orders" steps={tourSteps} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This will <span className="font-bold text-red-600">permanently delete</span> the order and all its items. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={!!deletingOrderId}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmDeleteId && handleDeleteOrder(confirmDeleteId)}
              disabled={!!deletingOrderId}
            >
              {deletingOrderId === confirmDeleteId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-[#F4F2E6]">
      <div className="w-full px-6 md:px-8 py-8">
        {/* Header */}
        <div data-tour="orders-header" className="mb-6">
          <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Order Management</h1>
          <p className="text-[#303A4D]/70">View and manage customer orders</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div data-tour="order-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Orders */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-[#303A4D]">{stats.total_orders}</p>
                </div>
                <div className="w-12 h-12 bg-[#FED141]/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#303A4D]" />
                </div>
              </div>
            </Card>

            {/* Pending Payment */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Payment</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending_payment}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            {/* Delivered */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Delivered</p>
                  <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            {/* Total Revenue */}
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#303A4D]">GH₵{stats.total_revenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-[#FED141]/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#303A4D]" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4">
          <div data-tour="search-filter" className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#303A4D]/60" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-full px-12 py-4 text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#303A4D]/60" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white rounded-full px-12 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
          </div>

          <div data-tour="status-filter" className="flex gap-3 flex-wrap">
            {["All", "Pending", "Processing", "Delivered"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  statusFilter === status ? "bg-[#303A4D] text-white" : "bg-white text-[#303A4D] hover:bg-[#FED141]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div data-tour="order-list" className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#F4F2E6]">
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Order #</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Customer</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Phone</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Items</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Total</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Payment</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Delivery</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Date</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#303A4D]" />
                      <p className="mt-2 text-[#303A4D]/60">Loading orders...</p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#303A4D]/60">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#303A4D]">#{order.order_number || order.id.slice(0, 8)}</td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-[#303A4D]">{order.user_name || 'Guest'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <a href={`tel:${order.user_phone}`} className="text-blue-600 hover:underline">
                          {order.user_phone || 'N/A'}
                        </a>
                      </td>
                      <td className="py-4 px-4 text-[#303A4D]">{order.item_count || 0}</td>
                      <td className="py-4 px-4 font-bold text-[#303A4D]">GH₵{Number(order.total || 0).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status?.toLowerCase() === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                          order.status?.toLowerCase() === 'preparing' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status?.toLowerCase() === 'preparing' ? 'Packaged' :
                           order.status?.toLowerCase() === 'dispatched' ? 'Out for Delivery' :
                           order.status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#303A4D]/60">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button size="sm" className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDeleteId(order.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
