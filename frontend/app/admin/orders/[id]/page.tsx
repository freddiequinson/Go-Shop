"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Package, MapPin, Calendar, CreditCard, Phone, Mail, 
  Loader2, User, CheckCircle, XCircle, Truck, Eye, ExternalLink
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, use } from "react"
import { adminService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast()
  const unwrappedParams = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRiderModal, setShowRiderModal] = useState(false)
  const [riders, setRiders] = useState<any[]>([])
  const [selectedRider, setSelectedRider] = useState("")

  useEffect(() => {
    fetchOrderDetails()
    fetchRiders()
  }, [])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/orders/${unwrappedParams.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Order data:", data)
        setOrder(data)
      } else {
        throw new Error("Failed to fetch order")
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/riders?is_active=true", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRiders(data.riders || data || [])
      }
    } catch (error) {
      console.error("Failed to fetch riders:", error)
    }
  }

  const handlePackageOrder = async () => {
    try {
      setActionLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/orders/${unwrappedParams.id}/package`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Order marked as packaged. Now assign a rider for delivery."
        })
        await fetchOrderDetails()
        // Open rider assignment modal after packaging
        setShowRiderModal(true)
      } else {
        const errorData = await response.json()
        toast({
          title: "Cannot Package Order",
          description: errorData.detail || "Failed to package order",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to package order",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignRider = async () => {
    if (!selectedRider) {
      toast({
        title: "Error",
        description: "Please select a rider",
        variant: "destructive"
      })
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/orders/${unwrappedParams.id}/send-for-delivery`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rider_id: selectedRider })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Order assigned to rider. OTP: ${data.otp_code}`
        })
        setShowRiderModal(false)
        fetchOrderDetails()
      } else {
        throw new Error("Failed to assign rider")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign rider",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const colors: any = {
      completed: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-white",
      failed: "bg-red-500 text-white"
    }
    return <Badge className={colors[status] || "bg-gray-500 text-white"}>{status}</Badge>
  }

  const getDeliveryStatusBadge = (status: string) => {
    const colors: any = {
      delivered: "bg-green-500 text-white",
      out_for_delivery: "bg-blue-500 text-white",
      packaged: "bg-purple-500 text-white",
      pending: "bg-gray-500 text-white"
    }
    return <Badge className={colors[status] || "bg-gray-500 text-white"}>
      {status?.replace('_', ' ')}
    </Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <p className="text-[#303A4D]">Order not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <div className="w-full px-6 md:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#303A4D]">
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <p className="text-[#303A4D]/60">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Show Package button ONLY if payment completed and not yet packaged */}
            {order.payment_status === 'completed' && 
             (order.delivery_status === 'pending' || !order.delivery_status) && (
              <Button 
                onClick={handlePackageOrder}
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Package className="w-4 h-4 mr-2" />
                Mark as Packaged
              </Button>
            )}
            
            {/* Show info message if payment is still processing */}
            {order.payment_status === 'processing' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-yellow-800">Payment is being processed. Please wait before packaging.</span>
              </div>
            )}

            {/* Show Assign Rider button if packaged */}
            {order.delivery_status === 'packaged' && (
              <Button 
                onClick={() => setShowRiderModal(true)}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Truck className="w-4 h-4 mr-2" />
                Assign Rider & Send for Delivery
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#303A4D]/60">Customer Name</label>
                  <p className="font-medium text-[#303A4D]">
                    {order.user_name || order.user?.full_name || 'Guest User'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-[#303A4D]/60">Phone Number</label>
                  {(order.user_phone || order.user?.phone) ? (
                    <a 
                      href={`tel:${order.user_phone || order.user?.phone}`} 
                      className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      {order.user_phone || order.user?.phone}
                    </a>
                  ) : (
                    <p className="font-medium text-[#303A4D]">Not provided</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-sm text-[#303A4D]/60">Email</label>
                  {(order.user_email || order.user?.email) ? (
                    <a 
                      href={`mailto:${order.user_email || order.user?.email}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {order.user_email || order.user?.email}
                    </a>
                  ) : (
                    <p className="font-medium text-[#303A4D]">Not provided</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Delivery Address */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h2>
              
              <div className="space-y-3">
                {order.delivery_address ? (
                  <>
                    {typeof order.delivery_address === 'string' ? (
                      <p className="text-[#303A4D]">{order.delivery_address}</p>
                    ) : (
                      <>
                        <p className="text-[#303A4D]">
                          {order.delivery_address.address || order.delivery_address.street || JSON.stringify(order.delivery_address)}
                        </p>
                        {order.delivery_address.city && order.delivery_address.region && (
                          <p className="text-[#303A4D]">
                            {order.delivery_address.city}, {order.delivery_address.region}
                          </p>
                        )}
                        {order.delivery_address.gps_address && (
                          <p className="text-sm text-[#303A4D]/60">
                            GPS: {order.delivery_address.gps_address}
                          </p>
                        )}
                      </>
                    )}
                    
                    {/* Google Maps Button - Always show, check multiple locations for coordinates */}
                    <Button
                      onClick={() => {
                        const lat = order.delivery_address?.latitude || order.latitude
                        const lng = order.delivery_address?.longitude || order.longitude
                        
                        console.log("Coordinates check:", {
                          "delivery_address.latitude": order.delivery_address?.latitude,
                          "delivery_address.longitude": order.delivery_address?.longitude,
                          "order.latitude": order.latitude,
                          "order.longitude": order.longitude,
                          "final lat": lat,
                          "final lng": lng
                        })
                        
                        if (lat && lng) {
                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                        } else {
                          toast({
                            title: "No Coordinates",
                            description: "This order doesn't have GPS coordinates for the delivery address.",
                            variant: "destructive"
                          })
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </>
                ) : (
                  <p className="text-[#303A4D]/60">No delivery address provided</p>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-[#F4F2E6] rounded-lg">
                      {item.product?.images && item.product.images[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product_name || 'Product'}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-[#303A4D]">{item.product_name || item.product?.name}</p>
                        <p className="text-sm text-[#303A4D]/60">
                          Quantity: {item.quantity} {item.unit_type || 'pcs'}
                        </p>
                        {item.price_per_unit && (
                          <p className="text-sm text-[#303A4D]/60">
                            @ GH₵{Number(item.price_per_unit).toFixed(2)} per {item.unit_type || 'unit'}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-[#303A4D]">
                        GH₵{Number(item.price || item.total_price || (item.price_per_unit * item.quantity) || 0).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#303A4D]/60">No items found</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Status & Payment */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4">Order Status</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#303A4D]/60">Payment Status</label>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.payment_status || 'pending')}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#303A4D]/60">Delivery Status</label>
                  <div className="mt-1">
                    {getDeliveryStatusBadge(order.delivery_status || 'pending')}
                  </div>
                </div>

                {order.assigned_rider && (
                  <div>
                    <label className="text-sm text-[#303A4D]/60">Assigned Rider</label>
                    <p className="font-medium text-[#303A4D]">{order.assigned_rider.full_name}</p>
                    <p className="text-sm text-[#303A4D]/60">{order.assigned_rider.phone}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Information */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#303A4D]/60">Subtotal</span>
                  <span className="font-medium text-[#303A4D]">
                    GH₵{Number(order.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#303A4D]/60">Delivery Fee</span>
                  <span className="font-medium text-[#303A4D]">
                    GH₵{Number(order.delivery_fee || 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-[#303A4D]">Total</span>
                  <span className="font-bold text-[#303A4D] text-xl">
                    GH₵{Number(order.total || 0).toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#303A4D]/60">Payment Method</span>
                    <span className="font-medium text-[#303A4D]">
                      {order.payment_method || 'N/A'}
                    </span>
                  </div>

                  {order.transaction_id && (
                    <div className="flex justify-between mb-2">
                      <span className="text-[#303A4D]/60">Transaction ID</span>
                      <span className="font-mono text-sm text-[#303A4D]">
                        {order.transaction_id}
                      </span>
                    </div>
                  )}

                  {order.payment_completed_at && (
                    <div className="flex justify-between">
                      <span className="text-[#303A4D]/60">Payment Date</span>
                      <span className="text-sm text-[#303A4D]">
                        {new Date(order.payment_completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Order Timeline */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order Timeline
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#303A4D]">Order Placed</p>
                    <p className="text-sm text-[#303A4D]/60">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.payment_completed_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#303A4D]">Payment Confirmed</p>
                      <p className="text-sm text-[#303A4D]/60">
                        {new Date(order.payment_completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#303A4D]">Delivered</p>
                      <p className="text-sm text-[#303A4D]/60">
                        {new Date(order.delivered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Rider Modal */}
      <Dialog open={showRiderModal} onOpenChange={setShowRiderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider for Delivery</DialogTitle>
            <DialogDescription>
              Select a rider to deliver this order. The customer will receive an OTP via SMS and email.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-[#303A4D] mb-2 block">
              Select Rider
            </label>
            <Select value={selectedRider} onValueChange={setSelectedRider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a rider" />
              </SelectTrigger>
              <SelectContent>
                {riders.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{rider.full_name}</span>
                      <span className="text-sm text-gray-500">{rider.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRiderModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRider}
              disabled={actionLoading || !selectedRider}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning...</>
              ) : (
                <>Assign & Send for Delivery</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
