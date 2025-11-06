"use client"

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Package, MapPin, Calendar, Loader2, CheckCircle, Clock, Truck, Home } from 'lucide-react'
import axios from 'axios'
import { getApiBaseUrl } from '@/lib/api/url-helper'

export default function TrackOrderPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const { toast } = useToast()

  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)

  const trackOrder = async () => {
    if (!phone) {
      toast({
        title: 'Phone Required',
        description: 'Please enter your phone number',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(`${getApiBaseUrl()}/guest-orders/track`, {
        order_id: orderId,
        phone: phone,
      })

      setOrder(response.data)
      toast({
        title: 'Order Found!',
        description: 'Your order details are displayed below',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to track order. Please check your phone number.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-500" />
      case 'dispatched':
        return <Truck className="w-6 h-6 text-purple-500" />
      case 'delivered':
        return <Home className="w-6 h-6 text-green-600" />
      default:
        return <Package className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'dispatched':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Track Your Order</h1>
          <p className="text-lg text-[#303A4D]/70">Enter your phone number to view order details</p>
        </div>

        {/* Tracking Form */}
        {!order && (
          <Card className="p-8 mb-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  value={orderId}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Enter the phone number used for delivery
                </p>
              </div>

              <Button
                onClick={trackOrder}
                disabled={isLoading}
                className="w-full bg-[#303A4D] hover:bg-[#3B4559]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  'Track Order'
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {getStatusIcon(order.status)}
                  <div>
                    <h2 className="text-2xl font-bold text-[#303A4D]">Order Status</h2>
                    <p className="text-sm text-gray-600">Order #{order.id.substring(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full font-bold ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D] mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Order Date</span>
                  </div>
                  <p className="text-gray-600 pl-6">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {order.delivery_address && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D] mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>Delivery Address</span>
                    </div>
                    <p className="text-gray-600 pl-6">
                      {order.delivery_address.street}, {order.delivery_address.area}
                      <br />
                      {order.delivery_address.city}, {order.delivery_address.region}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-[#303A4D] mb-6">Order Items</h3>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#303A4D]">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × GH₵{(item.price_per_unit_cedis / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="font-bold text-[#303A4D]">
                      GH₵{(item.line_total_cedis / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t-2 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>GH₵{order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>GH₵{order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[#303A4D] pt-2 border-t">
                  <span>Total</span>
                  <span>GH₵{order.total?.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => setOrder(null)}
                variant="outline"
                className="flex-1"
              >
                Track Another Order
              </Button>
              <Link href="/" className="flex-1">
                <Button className="w-full bg-[#303A4D] hover:bg-[#3B4559]">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-[#303A4D] mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your order, please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-[#303A4D]">
              📞 <strong>Phone:</strong> 0241293754
            </p>
            <p className="text-[#303A4D]">
              📧 <strong>Email:</strong> support@goshopghana.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
