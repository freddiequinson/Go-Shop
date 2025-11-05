"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Phone, Package } from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Delivery {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  address: string
  latitude: number
  longitude: number
  status: string
  delivery_fee: number
  total_amount: number
  estimated_delivery_time: string | null
  delivery_notes: string | null
}

export default function RiderMapPage() {
  const { toast } = useToast()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState({ lat: 5.6037, lng: -0.1870 }) // Accra, Ghana

  useEffect(() => {
    fetchMapData()
  }, [])

  const fetchMapData = async () => {
    try {
      const response = await ridersService.getDeliveryMap()
      const data = response.data
      
      setDeliveries(data.deliveries || [])
      
      // Set map center to rider location or first delivery
      if (data.rider_location?.latitude && data.rider_location?.longitude) {
        setMapCenter({
          lat: data.rider_location.latitude,
          lng: data.rider_location.longitude
        })
      } else if (data.deliveries && data.deliveries.length > 0) {
        setMapCenter({
          lat: data.deliveries[0].latitude,
          lng: data.deliveries[0].longitude
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load map data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openInGoogleMaps = (delivery: Delivery) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.latitude},${delivery.longitude}`
    window.open(url, '_blank')
  }

  const getColorForIndex = (index: number) => {
    const colors = ['#FED141', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Delivery Map</h1>
        <p className="text-gray-600">
          View all your pending deliveries on the map ({deliveries.length} deliveries)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden h-[calc(100vh-12rem)]">
            {deliveries.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No deliveries with location data</p>
                </div>
              </div>
            ) : (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=[REDACTED_GOOGLE_API_KEY]&q=${mapCenter.lat},${mapCenter.lng}&zoom=12`}
              />
            )}
          </Card>
        </div>

        {/* Deliveries List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">
              Pending Deliveries
            </h2>

            {deliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No pending deliveries</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                {deliveries.map((delivery, index) => (
                  <Card
                    key={delivery.id}
                    className={`p-3 cursor-pointer transition-all border-l-4 ${
                      selectedDelivery?.id === delivery.id
                        ? 'bg-[#FED141]/10 border-[#FED141]'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ borderLeftColor: getColorForIndex(index) }}
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-[#FED141] text-[#303A4D]">
                        #{delivery.order_number}
                      </Badge>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getColorForIndex(index) }}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-500" />
                        <span className="font-medium">{delivery.customer_name}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3 h-3 text-gray-500 mt-0.5" />
                        <span className="text-gray-600 text-xs line-clamp-2">
                          {delivery.address}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">
                          Fee: GH₵{delivery.delivery_fee.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            openInGoogleMaps(delivery)
                          }}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Selected Delivery Details */}
          {selectedDelivery && (
            <Card className="p-4 mt-4">
              <h3 className="font-bold text-[#303A4D] mb-3">Delivery Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Order Number</p>
                  <p className="font-semibold">#{selectedDelivery.order_number}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Customer</p>
                  <p className="font-semibold">{selectedDelivery.customer_name}</p>
                  <p className="text-gray-600">{selectedDelivery.customer_phone}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Delivery Address</p>
                  <p className="text-gray-600">{selectedDelivery.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs">Delivery Fee</p>
                    <p className="font-semibold">GH₵{selectedDelivery.delivery_fee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total Amount</p>
                    <p className="font-semibold">GH₵{selectedDelivery.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                {selectedDelivery.delivery_notes && (
                  <div>
                    <p className="text-gray-500 text-xs">Notes</p>
                    <p className="text-gray-600">{selectedDelivery.delivery_notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
                    onClick={() => openInGoogleMaps(selectedDelivery)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                  <Link href={`/rider/deliveries/${selectedDelivery.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
