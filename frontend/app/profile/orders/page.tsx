'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import { Loader2, Package, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  status: string
  payment_status: string
  total: number
  item_count: number
  created_at: string
  payment_method?: string
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      loadOrders()
    }
  }, [isAuthenticated, isAuthLoading])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/orders/')
      setOrders(response.data)
    } catch (error: any) {
      console.error('Failed to load orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'payment_failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'confirmed':
      case 'preparing':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'dispatched':
        return <Package className="w-5 h-5 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'payment_failed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'dispatched':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'pending') return order.status === 'pending_payment'
    if (filter === 'failed') return order.status === 'payment_failed'
    if (filter === 'active') return ['confirmed', 'preparing', 'dispatched'].includes(order.status)
    if (filter === 'completed') return order.status === 'delivered'
    return true
  })

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#303A4D] mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-[#FED141] text-[#303A4D]' : ''}
            >
              All Orders
            </Button>
            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'default' : 'outline'}
              className={filter === 'pending' ? 'bg-yellow-500 text-white' : ''}
            >
              Pending Payment
            </Button>
            <Button
              onClick={() => setFilter('failed')}
              variant={filter === 'failed' ? 'default' : 'outline'}
              className={filter === 'failed' ? 'bg-red-500 text-white' : ''}
            >
              Payment Failed
            </Button>
            <Button
              onClick={() => setFilter('active')}
              variant={filter === 'active' ? 'default' : 'outline'}
              className={filter === 'active' ? 'bg-blue-500 text-white' : ''}
            >
              Active
            </Button>
            <Button
              onClick={() => setFilter('completed')}
              variant={filter === 'completed' ? 'default' : 'outline'}
              className={filter === 'completed' ? 'bg-green-500 text-white' : ''}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">No Orders Found</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${filter} orders found`}
            </p>
            <Button
              onClick={() => router.push('/shop')}
              className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => router.push(`/profile/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-bold text-[#303A4D]">
                        Order #{order.id.slice(0, 8)}...
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#303A4D]">
                      GH₵{order.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    {order.payment_status === 'completed' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        Paid
                      </span>
                    )}
                  </div>

                  {order.status === 'payment_failed' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/checkout/payment/${order.id}`)
                      }}
                      size="sm"
                      className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Retry Payment
                    </Button>
                  )}

                  {order.status === 'pending_payment' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/checkout/payment/${order.id}`)
                      }}
                      size="sm"
                      className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Payment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
