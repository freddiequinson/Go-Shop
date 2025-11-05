"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package, MapPin, Phone, Navigation, Search, Filter
} from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ActiveDeliveriesPage() {
  const { toast } = useToast()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchDeliveries()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [searchTerm, statusFilter, deliveries])

  const fetchDeliveries = async () => {
    try {
      const response = await ridersService.getMyDeliveries()
      setDeliveries(response.data.deliveries || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load deliveries",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDeliveries = () => {
    let filtered = [...deliveries]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer_phone?.includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter)
    }

    setFilteredDeliveries(filtered)
  }

  const handleStartDelivery = async (orderId: string) => {
    try {
      await ridersService.startDelivery(orderId)
      toast({
        title: "Success",
        description: "Delivery started"
      })
      fetchDeliveries()
    } catch (error: any) {
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
          <p className="mt-4 text-[#303A4D]">Loading deliveries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Active Deliveries</h1>
        <p className="text-gray-600">Manage your ongoing deliveries</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by order number, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="all">All Status</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-[#303A4D]">{deliveries.length}</p>
            </div>
            <Package className="w-8 h-8 text-[#FED141]" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dispatched</p>
              <p className="text-2xl font-bold text-blue-600">
                {deliveries.filter(d => d.status === 'dispatched').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {deliveries.filter(d => d.status === 'delivered').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "No deliveries match your filters" 
              : "No active deliveries"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-[#FED141] text-[#303A4D]">
                      #{delivery.order_number}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={
                        delivery.status === 'delivered' 
                          ? 'border-green-500 text-green-700' 
                          : 'border-blue-500 text-blue-700'
                      }
                    >
                      {delivery.status}
                    </Badge>
                  </div>
                </div>
                <Package className="w-6 h-6 text-[#303A4D]" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{delivery.customer_name}</span>
                  <span className="text-gray-500">•</span>
                  <a href={`tel:${delivery.customer_phone}`} className="text-blue-600 hover:underline">
                    {delivery.customer_phone}
                  </a>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    {typeof delivery.delivery_address === 'object' 
                      ? delivery.delivery_address.address 
                      : delivery.delivery_address}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Fee: GH₵{delivery.delivery_fee}</span>
                  <span>•</span>
                  <span>Total: GH₵{delivery.total_amount}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {delivery.delivery_address?.latitude && delivery.delivery_address?.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${delivery.delivery_address.latitude},${delivery.delivery_address.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </Button>
                  </a>
                )}

                {delivery.status === 'dispatched' && (
                  <Button
                    size="sm"
                    onClick={() => handleStartDelivery(delivery.id)}
                    className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
                  >
                    Start
                  </Button>
                )}

                <Link href={`/rider/deliveries/${delivery.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">
                    Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
