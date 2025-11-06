'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import { 
  Loader2, Package, MapPin, CreditCard, Truck, 
  Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface OrderItem {
  id: string
  product_name: string
  product_image_url?: string
  quantity: number
  price_per_unit: number
  line_total: number
  unit_type: string
}

interface PaymentAttempt {
  id: string
  amount: number
  status: string
  payment_reference?: string
  error_message?: string
  created_at: string
}

interface OrderDetails {
  id: string
  status: string
  payment_status: string
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  delivery_address: any
  coupon_code?: string
  coupon_discount?: number
  payment_method?: string
  payment_reference?: string
  created_at: string
  items: OrderItem[]
  payment_attempts?: PaymentAttempt[]
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && orderId) {
      loadOrder()
    }
  }, [isAuthenticated, isAuthLoading, orderId])

  const loadOrder = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/orders/${orderId}`)
      setOrder(response.data)
    } catch (error: any) {
      console.error('Failed to load order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="w-6 h-6 text-yellow-500" />
      case 'payment_failed':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'confirmed':
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-500" />
      case 'dispatched':
        return <Truck className="w-6 h-6 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-gray-500" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />
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

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Order Not Found</h2>
          <Button onClick={() => router.push('/profile/orders')} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6] py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/profile/orders')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="shrink-0">{getStatusIcon(order.status)}</div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-[#303A4D] break-words">
                  Order #{order.id.slice(0, 8)}...
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          {/* Action Buttons */}
          {(order.status === 'pending_payment' || order.status === 'payment_failed') && (
            <Button
              onClick={() => router.push(`/checkout/payment/${order.id}`)}
              className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] text-sm sm:text-base"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {order.status === 'payment_failed' ? 'Retry Payment' : 'Complete Payment'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Items */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4">Order Items</h2>
              <div className="space-y-3 sm:space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-b-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-[#303A4D] break-words">{item.product_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {item.quantity} {item.unit_type} × GH₵{item.price_per_unit.toFixed(2)}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-[#303A4D] mt-1">
                        GH₵{item.line_total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address && (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  Delivery Address
                </h2>
                <div className="text-sm sm:text-base text-gray-700 space-y-1">
                  <p className="break-words">{order.delivery_address.street}</p>
                  <p>{order.delivery_address.area}, {order.delivery_address.city}</p>
                  <p>{order.delivery_address.region}</p>
                  <p className="mt-2 font-semibold break-words">Phone: {order.delivery_address.phone}</p>
                  {order.delivery_address.additional_info && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 break-words">{order.delivery_address.additional_info}</p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Attempts */}
            {order.payment_attempts && order.payment_attempts.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4">Payment History</h2>
                <div className="space-y-3">
                  {order.payment_attempts.map((attempt) => (
                    <div key={attempt.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                          attempt.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.status.toUpperCase()}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {new Date(attempt.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-bold">GH₵{attempt.amount.toFixed(2)}</p>
                      {attempt.payment_reference && (
                        <p className="text-xs text-gray-500 mt-1 break-all">Ref: {attempt.payment_reference}</p>
                      )}
                      {attempt.error_message && (
                        <p className="text-xs sm:text-sm text-red-600 mt-2 break-words">{attempt.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                Payment
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold text-right ${
                    order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                {order.payment_method && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold text-right">{order.payment_method}</span>
                  </div>
                )}
                {order.payment_reference && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 shrink-0">Reference</span>
                    <span className="text-xs font-mono break-all text-right">{order.payment_reference.slice(0, 12)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4">Order Summary</h2>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">GH₵{order.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold">GH₵{order.delivery_fee.toFixed(2)}</span>
                </div>

                {order.coupon_code && (
                  <div className="flex justify-between text-green-600 text-xs sm:text-sm">
                    <span className="break-words">Coupon ({order.coupon_code})</span>
                    <span className="shrink-0">-GH₵{order.coupon_discount?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">GH₵{order.tax.toFixed(2)}</span>
                </div>

                <div className="border-t pt-2 sm:pt-3 flex justify-between text-lg sm:text-xl font-bold text-[#303A4D]">
                  <span>Total</span>
                  <span>GH₵{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
