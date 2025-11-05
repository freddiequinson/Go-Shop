"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package, TrendingUp, Star, Coins, MapPin, Phone
} from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RiderDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startingDelivery, setStartingDelivery] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, deliveriesRes] = await Promise.all([
        ridersService.getMyStats(),
        ridersService.getMyDeliveries('pending')
      ])
      
      setStats(statsRes.data)
      setDeliveries(deliveriesRes.data.deliveries || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartDelivery = async (delivery: any) => {
    try {
      setStartingDelivery(delivery.id)
      
      // Start the delivery
      await ridersService.startDelivery(delivery.id)
      
      // Remove this delivery from the list immediately
      setDeliveries(prev => prev.filter(d => d.id !== delivery.id))
      
      toast({
        title: "Success",
        description: "Delivery started! Opening navigation..."
      })
      
      // Open Google Maps with directions
      if (delivery.delivery_address?.latitude && delivery.delivery_address?.longitude) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${delivery.delivery_address.latitude},${delivery.delivery_address.longitude}`
        window.open(mapsUrl, '_blank')
      }
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        // Navigate to delivery detail page
        router.push(`/rider/deliveries/${delivery.id}`)
      }, 500)
    } catch (error: any) {
      setStartingDelivery(null)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to start delivery",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#303A4D] mb-4 sm:mb-6 md:mb-8">Dashboard</h1>

      <div className="w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-3xl font-bold text-[#303A4D] mt-2">
                  {stats?.total_deliveries || 0}
                </p>
              </div>
              <Package className="w-12 h-12 text-[#FED141]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-3xl font-bold text-[#FED141] mt-2">
                  {typeof stats?.rating === 'number' ? stats.rating.toFixed(1) : '0.0'} ⭐
                </p>
              </div>
              <Star className="w-12 h-12 text-[#FED141]" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="text-3xl font-bold text-[#303A4D] mt-2">
                  GH₵{typeof stats?.today_earnings === 'number' ? stats.today_earnings.toFixed(2) : '0.00'}
                </p>
              </div>
              <Coins className="w-12 h-12 text-[#303A4D]" />
            </div>
          </Card>
        </div>

        {/* Pending Deliveries */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#303A4D]">
              Pending Deliveries ({deliveries?.length || 0})
            </h2>
            <Link href="/rider/deliveries">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
            </Link>
          </div>

          {deliveries.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {deliveries.map((delivery) => (
                <Card key={delivery.id} className="p-3 sm:p-4 border-l-4 border-[#FED141]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className="bg-[#FED141] text-[#303A4D] text-xs">
                          #{delivery.order_number}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{delivery.status}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium">{delivery.customer_name}</span>
                          <span className="text-gray-500">•</span>
                          <a href={`tel:${delivery.customer_phone}`} className="text-blue-600 hover:underline">
                            {delivery.customer_phone}
                          </a>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 line-clamp-2">
                            {typeof delivery.delivery_address === 'object' 
                              ? delivery.delivery_address.address 
                              : delivery.delivery_address}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600">
                          <span className="text-xs">Fee: GH₵{delivery.delivery_fee}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-xs">Total: GH₵{delivery.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleStartDelivery(delivery)}
                        disabled={startingDelivery === delivery.id}
                        className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 disabled:opacity-50 flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        {startingDelivery === delivery.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-[#303A4D] mr-1 sm:mr-2"></div>
                            <span className="hidden sm:inline">Starting...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Start & Navigate</span>
                            <span className="sm:hidden">Start</span>
                          </>
                        )}
                      </Button>

                      <Link href={`/rider/deliveries/${delivery.id}`} className="flex-1 sm:flex-none">
                        <Button size="sm" variant="outline" className="w-full text-xs sm:text-sm">
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
