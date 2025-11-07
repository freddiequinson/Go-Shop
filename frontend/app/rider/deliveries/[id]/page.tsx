"use client"

import { useEffect, useState, use, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft, MapPin, Phone, Mail, Package, User,
  ExternalLink, Loader2, CheckCircle, Navigation
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useGeolocation } from "@/hooks/useGeolocation"
import { ridersService } from "@/lib/services/riders"

export default function DeliveryDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const unwrappedParams = use(params)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [locationSharing, setLocationSharing] = useState(false)
  const lastUpdateRef = useRef<number>(0)

  // Track location when delivery is active
  const { latitude, longitude, accuracy, error: geoError } = useGeolocation({
    watch: true,
    enableHighAccuracy: true
  })

  useEffect(() => {
    fetchOrderDetails()
  }, [])

  // Send location updates when delivery is active
  useEffect(() => {
    if (!latitude || !longitude || !order) return
    
    // Only share location for dispatched orders
    if (order.status !== 'dispatched') {
      setLocationSharing(false)
      return
    }
    
    setLocationSharing(true)
    
    const now = Date.now()
    // Update every 10 seconds
    if (now - lastUpdateRef.current < 10000) return
    
    lastUpdateRef.current = now
    
    ridersService.updateLocation(latitude, longitude, order.id, accuracy || undefined)
      .catch(err => console.error('Failed to update location:', err))
  }, [latitude, longitude, order?.id, order?.status, accuracy])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/deliveries/${unwrappedParams.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch delivery details",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = () => {
    // Check multiple possible locations for coordinates
    let lat, lng

    if (order?.delivery_address) {
      const address = order.delivery_address
      if (typeof address === 'object') {
        lat = address.latitude
        lng = address.longitude
      }
    }
    
    // Fallback to order-level coordinates
    if (!lat || !lng) {
      lat = order?.latitude
      lng = order?.longitude
    }

    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      window.open(url, '_blank')
    } else {
      toast({
        title: "Error",
        description: "Location coordinates not available for this delivery",
        variant: "destructive"
      })
    }
  }

  const handleRequestOTP = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/deliveries/${unwrappedParams.id}/request-otp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast({
          title: "OTP Sent!",
          description: "Verification code sent to customer via SMS and Email"
        })
        setShowOTPDialog(true)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to send OTP",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request OTP",
        variant: "destructive"
      })
    }
  }

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a 6-digit code",
        variant: "destructive"
      })
      return
    }

    try {
      setVerifying(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/riders/deliveries/${unwrappedParams.id}/complete?otp_code=${otpCode}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery completed successfully!"
        })
        setShowOTPDialog(false)
        router.push("/rider")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Invalid OTP code",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete delivery",
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
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
      <div className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/rider">
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#303A4D]">
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-blue-500 text-xs">Out for Delivery</Badge>
                {locationSharing && (
                  <Badge className="bg-green-500 flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">Sharing Location</span>
                    <span className="sm:hidden">Live</span>
                  </Badge>
                )}
                {geoError && (
                  <Badge variant="destructive" className="text-xs">
                    GPS Error
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <Card className="p-4 sm:p-6 bg-white">
            <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Customer Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm text-[#303A4D]/60">Name</label>
                <p className="font-medium text-sm sm:text-base text-[#303A4D]">{order.customer_name || "N/A"}</p>
              </div>

              <div>
                <label className="text-xs sm:text-sm text-[#303A4D]/60">Phone</label>
                <a 
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline font-medium text-sm sm:text-base"
                >
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                  {order.customer_phone || "N/A"}
                </a>
              </div>

              {order.customer_email && (
                <div>
                  <label className="text-xs sm:text-sm text-[#303A4D]/60">Email</label>
                  <a 
                    href={`mailto:${order.customer_email}`}
                    className="flex items-center gap-2 text-blue-600 hover:underline text-sm sm:text-base break-all"
                  >
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {order.customer_email}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-4 sm:p-6 bg-white">
            <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              Delivery Address
            </h2>

            <div className="space-y-3">
              {order.delivery_address && (
                <>
                  {typeof order.delivery_address === 'string' ? (
                    <p className="text-[#303A4D]">{order.delivery_address}</p>
                  ) : (
                    <>
                      <p className="text-[#303A4D]">
                        {order.delivery_address.address || order.delivery_address.street}
                      </p>
                      <p className="text-[#303A4D]">
                        {order.delivery_address.city}, {order.delivery_address.region}
                      </p>
                      {order.delivery_address.gps_address && (
                        <p className="text-sm text-[#303A4D]/60">
                          GPS: {order.delivery_address.gps_address}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}


              <Button 
                onClick={handleNavigate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 text-sm sm:text-base py-5 sm:py-6"
              >
                <MapPin className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Navigate to Customer</span>
                <span className="sm:hidden">Navigate</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-4 sm:p-6 bg-white">
            <h2 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Order Items
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#F4F2E6] rounded-lg">
                    {item.product?.images && item.product.images[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product_name || 'Product'}
                        width={50}
                        height={50}
                        className="rounded-lg object-cover sm:w-[60px] sm:h-[60px]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base text-[#303A4D] truncate">{item.product_name || item.product?.name}</p>
                      <p className="text-xs sm:text-sm text-[#303A4D]/60">
                        Qty: {item.quantity} {item.unit_type || 'pcs'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm sm:text-base text-[#303A4D]/60">No items found</p>
              )}
            </div>
          </Card>

          {/* Complete Delivery Button */}
          {(order.status === 'dispatched' || order.delivery_status === 'out_for_delivery') && (
            <Button 
              onClick={handleRequestOTP}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-5 sm:py-6 text-base sm:text-lg"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Complete Delivery
            </Button>
          )}
        </div>
      </div>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
            <DialogDescription>
              Ask the customer for their 6-digit delivery code
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-bold"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOTPDialog(false)
                setOtpCode("")
              }}
              disabled={verifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOTP}
              disabled={verifying || otpCode.length !== 6}
              className="bg-green-600 hover:bg-green-700"
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                <>Verify & Complete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
