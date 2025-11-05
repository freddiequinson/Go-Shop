"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package, MapPin, Phone, Calendar, Coins, CheckCircle, Search
} from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"

export default function CompletedDeliveriesPage() {
  const { toast } = useToast()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    fetchCompletedDeliveries()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [searchTerm, dateFilter, deliveries])

  const fetchCompletedDeliveries = async () => {
    try {
      const response = await ridersService.getMyDeliveries('completed')
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
        d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter(d => {
        const deliveredDate = new Date(d.delivered_at)
        const diffDays = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dateFilter === "today") return diffDays === 0
        if (dateFilter === "week") return diffDays <= 7
        if (dateFilter === "month") return diffDays <= 30
        return true
      })
    }

    setFilteredDeliveries(filtered)
  }

  const calculateTotalEarnings = () => {
    return filteredDeliveries.reduce((sum, d) => sum + (parseFloat(d.delivery_fee) || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Completed Deliveries</h1>
        <p className="text-gray-600">View your delivery history and earnings</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Completed</p>
              <p className="text-3xl font-bold text-[#303A4D] mt-2">
                {filteredDeliveries.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-[#303A4D] mt-2">
                GH₵{calculateTotalEarnings().toFixed(2)}
              </p>
            </div>
            <Coins className="w-12 h-12 text-[#FED141]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Earnings</p>
              <p className="text-3xl font-bold text-[#303A4D] mt-2">
                GH₵{filteredDeliveries.length > 0 
                  ? (calculateTotalEarnings() / filteredDeliveries.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <Coins className="w-12 h-12 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || dateFilter !== "all" 
              ? "No deliveries match your filters" 
              : "No completed deliveries yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-[#FED141] text-[#303A4D]">
                      #{delivery.order_number}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Delivered
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{delivery.customer_name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{delivery.customer_phone}</span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-600">
                          {typeof delivery.delivery_address === 'object' 
                            ? delivery.delivery_address.address 
                            : delivery.delivery_address}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(delivery.delivered_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-[#FED141]" />
                          <span className="font-semibold text-[#303A4D]">
                            GH₵{delivery.delivery_fee}
                          </span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">
                          Total: GH₵{delivery.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
