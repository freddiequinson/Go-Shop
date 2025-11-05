"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, MapPin, Calendar, CreditCard, Phone, Mail, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import OrderTimeline from "@/components/OrderTimeline"
import DeliveryTrackingMap from "@/components/maps/DeliveryTrackingMap"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)
  const [riderLocation, setRiderLocation] = useState<any>(null)
  const [trackingEnabled, setTrackingEnabled] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await apiClient.get(`/orders/${id}`)
        setOrder(response.data)
      } catch (error: any) {
        console.error('Failed to fetch order:', error)
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to load order',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, isAuthenticated, router, toast])

  // Poll for rider location when delivery is active (dispatched = out for delivery)
  useEffect(() => {
    // Only show tracking when order status is "dispatched" (Out for Delivery stage)
    if (!order || order.status !== 'dispatched') {
      setTrackingEnabled(false)
      return
    }

    setTrackingEnabled(true)

    const pollLocation = async () => {
      try {
        const response = await apiClient.get(`/orders/${id}/rider-location`)
        if (response.data.rider_location) {
          setRiderLocation(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch rider location:', error)
      }
    }

    // Poll every 10 seconds
    pollLocation()
    const interval = setInterval(pollLocation, 10000)

    return () => clearInterval(interval)
  }, [id, order?.status])

  // Check if payment has timed out (15 minutes)
  const isPaymentTimedOut = () => {
    if (!order || order.payment_status !== 'pending') return false
    
    const orderTime = new Date(order.created_at).getTime()
    const now = new Date().getTime()
    const fifteenMinutes = 15 * 60 * 1000
    
    return (now - orderTime) > fifteenMinutes
  }

  // Retry payment handler
  const handleRetryPayment = async () => {
    setIsRetryingPayment(true)
    try {
      const response = await apiClient.post(`/orders/${id}/initialize-payment`, {
        callback_url: `${window.location.origin}/orders/${id}`
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
      setIsRetryingPayment(false)
    }
  }

  if (loading) {
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
          <p className="text-xl text-[#303A4D] mb-4">Order not found</p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/orders" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Orders</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Order Details</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#303A4D] mb-1">Order #{order.id.slice(0, 8)}</h2>
                  <p className="text-gray-600">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium text-center ${
                    order.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>

            </Card>

            {/* Animated Order Timeline */}
            <OrderTimeline
              orderStatus={order.status}
              paymentStatus={order.payment_status}
              createdAt={order.created_at}
              paymentCompletedAt={order.payment_completed_at}
              deliveredAt={order.delivered_at}
            />

            {/* Real-Time Delivery Tracking */}
            {trackingEnabled && order.delivery_address?.latitude && order.delivery_address?.longitude && (
              <Card className="p-6 bg-white">
                <h3 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FED141]" />
                  Track Your Delivery
                </h3>
                
                <DeliveryTrackingMap
                  customerLocation={{
                    lat: order.delivery_address.latitude,
                    lng: order.delivery_address.longitude
                  }}
                  riderLocation={
                    riderLocation?.rider_location
                      ? {
                          lat: riderLocation.rider_location.latitude,
                          lng: riderLocation.rider_location.longitude
                        }
                      : null
                  }
                  customerAddress={order.delivery_address.address || 'Your delivery address'}
                />

                {/* Distance and ETA Banner */}
                {riderLocation?.rider_location?.distance_km !== null && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#FED141] to-[#FED141]/80 rounded-lg">
                    <div className="flex items-center justify-around text-[#303A4D]">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{riderLocation.rider_location.distance_km} km</p>
                        <p className="text-sm opacity-80">Distance Away</p>
                      </div>
                      <div className="h-12 w-px bg-[#303A4D]/20"></div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{riderLocation.rider_location.eta_minutes} min</p>
                        <p className="text-sm opacity-80">Estimated Arrival</p>
                      </div>
                    </div>
                  </div>
                )}

                {riderLocation?.rider_info && (
                  <div className="mt-4 p-4 bg-[#FED141]/10 rounded-lg border border-[#FED141]/20">
                    <h4 className="font-semibold text-[#303A4D] mb-2">Your Rider</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-medium">{riderLocation.rider_info.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <a 
                          href={`tel:${riderLocation.rider_info.phone}`}
                          className="font-medium text-[#303A4D] hover:text-[#FED141]"
                        >
                          {riderLocation.rider_info.phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-gray-600">Vehicle</p>
                        <p className="font-medium capitalize">{riderLocation.rider_info.vehicle_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Update</p>
                        <p className="font-medium text-xs">
                          {riderLocation.rider_location.is_recent ? (
                            <span className="text-green-600">● Live</span>
                          ) : (
                            <span className="text-orange-600">● {new Date(riderLocation.rider_location.last_update).toLocaleTimeString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!riderLocation?.rider_location && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FED141] mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Waiting for rider location...</p>
                  </div>
                )}
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <Image
                      src={item.product_image_url || "/placeholder.svg"}
                      alt={item.product_name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#303A4D] mb-1">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} {item.unit_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        GH₵{(item.price_per_unit_cedis / 100).toFixed(2)} per {item.unit_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#303A4D]">GH₵{(item.line_total_cedis / 100).toFixed(2)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500">No items in this order</p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>GH₵{order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>GH₵{order.delivery_fee ? order.delivery_fee.toFixed(2) : '0.00'}</span>
                </div>
                {order.tax && order.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>GH₵{order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-[#303A4D] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>GH₵{order.total ? order.total.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#303A4D] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {order.status === 'delivered' ? 'Delivered On' : 'Estimated Delivery'}
                    </p>
                    <p className="font-medium text-[#303A4D]">
                      {(() => {
                        // If delivered, show delivered_at date
                        if (order.delivered_at) {
                          return new Date(order.delivered_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })
                        }
                        // If estimated_delivery_time exists and is valid, use it
                        if (order.estimated_delivery_time) {
                          const estimatedDate = new Date(order.estimated_delivery_time)
                          if (!isNaN(estimatedDate.getTime())) {
                            return estimatedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })
                          }
                        }
                        // Calculate estimated delivery (3-5 business days from order)
                        const orderDate = new Date(order.created_at)
                        const estimatedDays = 3 // 3 business days
                        const estimatedDate = new Date(orderDate)
                        estimatedDate.setDate(orderDate.getDate() + estimatedDays)
                        
                        return estimatedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }) + ' (3-5 business days)'
                      })()}
                    </p>
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Delivery Address</p>
                      <p className="font-medium text-[#303A4D]">
                        {order.delivery_address.street}
                        {order.delivery_address.area && `, ${order.delivery_address.area}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.delivery_address.city}, {order.delivery_address.region}
                      </p>
                      {order.delivery_address.phone && (
                        <p className="text-sm text-gray-600 mt-1">
                          <Phone className="w-3 h-3 inline mr-1" />
                          {order.delivery_address.phone}
                        </p>
                      )}
                      {order.delivery_address.additional_info && (
                        <p className="text-xs text-gray-500 mt-1">
                          {order.delivery_address.additional_info}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-[#303A4D]">{user?.full_name || 'N/A'}</p>
                </div>

                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#303A4D]" />
                    <p className="font-medium text-[#303A4D]">{user.phone}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#303A4D]" />
                  <p className="font-medium text-[#303A4D]">{user?.email || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-[#303A4D]">
                    {order.payment_method || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className={`font-medium ${
                    order.payment_status === 'completed' ? 'text-green-600' :
                    order.payment_status === 'failed' || isPaymentTimedOut() ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {order.payment_status === 'completed' ? '✓ Payment Confirmed' :
                     order.payment_status === 'failed' || isPaymentTimedOut() ? '✗ Payment Failed' :
                     '⏳ Payment Pending'}
                  </p>
                </div>
                {order.payment_reference && (
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="text-xs text-gray-600 font-mono">{order.payment_reference}</p>
                  </div>
                )}
                
                {/* Payment timeout warning and retry button */}
                {(order.payment_status === 'pending' && isPaymentTimedOut()) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-700 font-medium">⚠️ Payment Timeout</p>
                      <p className="text-xs text-red-600 mt-1">
                        Payment window expired after 15 minutes
                      </p>
                    </div>
                    <Button
                      onClick={handleRetryPayment}
                      disabled={isRetryingPayment}
                      className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
                    >
                      {isRetryingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Complete Payment'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Pending payment reminder */}
                {(order.payment_status === 'pending' && !isPaymentTimedOut()) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-yellow-700 font-medium">⏳ Payment Pending</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Please complete payment within 15 minutes
                      </p>
                    </div>
                    <Button
                      onClick={handleRetryPayment}
                      disabled={isRetryingPayment}
                      className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
                    >
                      {isRetryingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Complete Payment Now'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white"
                onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Reorder functionality will be available soon',
                  })
                }}
              >
                Reorder Items
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-[#303A4D]/20 bg-transparent"
                onClick={() => {
                  // Generate and download invoice
                  const invoiceContent = `
GOSHOP GHANA - INVOICE
========================

Order ID: ${order.id}
Date: ${new Date(order.created_at).toLocaleDateString()}

CUSTOMER INFORMATION
--------------------
Name: ${user?.full_name || 'N/A'}
Email: ${user?.email || 'N/A'}
Phone: ${user?.phone || order.delivery_address?.phone || 'N/A'}

DELIVERY ADDRESS
----------------
${order.delivery_address?.street || ''}
${order.delivery_address?.area || ''}
${order.delivery_address?.city || ''}, ${order.delivery_address?.region || ''}

ORDER ITEMS
-----------
${order.items?.map((item: any) => 
  `${item.product_name} - ${item.quantity} ${item.unit_type} @ GH₵${(item.price_per_unit_cedis / 100).toFixed(2)} = GH₵${(item.line_total_cedis / 100).toFixed(2)}`
).join('\n')}

SUMMARY
-------
Subtotal:     GH₵${order.subtotal?.toFixed(2) || '0.00'}
Delivery Fee: GH₵${order.delivery_fee?.toFixed(2) || '0.00'}
${order.tax && order.tax > 0 ? `Tax:          GH₵${order.tax.toFixed(2)}\n` : ''}
TOTAL:        GH₵${order.total?.toFixed(2) || '0.00'}

PAYMENT
-------
Method: ${order.payment_method || 'Not specified'}
Status: ${order.payment_status?.toUpperCase() || 'PENDING'}
${order.payment_reference ? `Reference: ${order.payment_reference}` : ''}

Thank you for shopping with GoShop Ghana!
                  `.trim()

                  const blob = new Blob([invoiceContent], { type: 'text/plain' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `invoice-${order.id.slice(0, 8)}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)

                  toast({
                    title: 'Invoice Downloaded',
                    description: 'Your invoice has been downloaded',
                  })
                }}
              >
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
