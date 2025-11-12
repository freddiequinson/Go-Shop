"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Search, Filter, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/contexts/auth-context"
import { ordersService } from "@/lib/api/services"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const data = await ordersService.getOrders()
        setOrders(data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated])

  // Check if payment has timed out (15 minutes)
  const isPaymentTimedOut = (order: any) => {
    if (order.payment_status !== 'pending') return false
    
    const orderTime = new Date(order.created_at).getTime()
    const now = new Date().getTime()
    const fifteenMinutes = 15 * 60 * 1000
    
    return (now - orderTime) > fifteenMinutes
  }

  // Retry payment handler
  const handleRetryPayment = async (orderId: string) => {
    setRetryingPayment(orderId)
    try {
      const response = await apiClient.post(`/orders/${orderId}/initialize-payment`, {
        callback_url: `${window.location.origin}/orders/${orderId}`
      })
      
      if (response.data.authorization_url) {
        window.open(response.data.authorization_url, '_blank')
        toast({
          title: 'Payment Window Opened',
          description: 'Complete your payment in the new tab',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to initialize payment',
        variant: 'destructive'
      })
    } finally {
      setRetryingPayment(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700"
      case "processing":
        return "bg-blue-100 text-blue-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5" />
      case "processing":
        return <Clock className="w-5 h-5" />
      case "pending":
        return <Package className="w-5 h-5" />
      case "cancelled":
        return <XCircle className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => 
      o.payment_status === 'pending' || 
      o.payment_status === 'processing' || 
      o.payment_status === 'failed' ||
      o.payment_status === 'pending_payment'
    ).length,
    completed: orders.filter(o => 
      o.payment_status === 'completed' || 
      o.status === 'confirmed' || 
      o.status === 'CONFIRMED' ||
      o.status === 'delivered' ||
      o.status === 'DELIVERED'
    ).length,
    delivered: orders.filter(o => o.status === 'delivered' || o.status === 'DELIVERED').length,
    totalSpent: orders
      .filter(o => o.payment_status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Profile</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">My Orders</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Orders */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#FED141]/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-[#303A4D]" />
              </div>
            </div>
          </Card>

          {/* Pending Payments */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Payment</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          {/* Completed Orders */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Total Spent */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-[#303A4D]">GH₵{stats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-[#FED141]/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-[#303A4D]">₵</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#303A4D]/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#303A4D]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-[#303A4D]/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-12 bg-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
              <p className="text-[#303A4D] text-lg font-medium">Loading orders...</p>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-12 bg-white text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#303A4D] mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0 ? "You haven't placed any orders yet" : "Try adjusting your search or filters"}
              </p>
              <Link href="/shop">
                <Button className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">Start Shopping</Button>
              </Link>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const paymentTimedOut = isPaymentTimedOut(order)
              const showPaymentFailed = order.payment_status === 'pending' && paymentTimedOut
              
              return (
              <Card key={order.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#303A4D]">#{order.id.slice(0, 8)}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                      
                      {/* Payment Status Badge - Only show if not completed */}
                      {order.payment_status !== 'completed' && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            showPaymentFailed ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {showPaymentFailed ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              Payment Failed
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              Payment Pending
                            </>
                          )}
                        </span>
                      )}
                      {order.payment_status === 'completed' && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Paid
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-medium text-[#303A4D]">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Items</p>
                        <p className="font-medium text-[#303A4D]">{order.items?.length || 0} items</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Delivery Date</p>
                        <p className="font-medium text-[#303A4D]">
                          {order.estimated_delivery_time
                            ? new Date(order.estimated_delivery_time).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Payment</p>
                        <p className="font-medium text-[#303A4D]">
                          {order.payment_method 
                            ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) 
                            : order.payment_status === 'pending' 
                              ? "Pending" 
                              : "Not Set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-[#303A4D]">
                        GH₵{order.total ? order.total.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    
                    {/* Show retry payment button if payment failed */}
                    {showPaymentFailed ? (
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleRetryPayment(order.id)}
                          disabled={retryingPayment === order.id}
                          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold w-full"
                        >
                          {retryingPayment === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Retry Payment
                            </>
                          )}
                        </Button>
                        <Link href={`/orders/${order.id}`} className="w-full">
                          <Button variant="outline" className="border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" className="border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent">
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
            })
          )}
        </div>
      </div>
    </div>
  )
}
