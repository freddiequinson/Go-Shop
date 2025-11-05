"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Package, Truck, User, MapPin, Phone, Clock, 
  CheckCircle, Loader2, Search, Filter
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface Assignment {
  id: string
  order_id: string
  rider_id: string
  rider_name: string
  rider_phone: string
  customer_name: string
  delivery_address: string
  status: string
  assigned_at: string
  picked_up_at?: string
  delivered_at?: string
  order_total: number
}

export default function RiderAssignmentsPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/orders?status=dispatched", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform orders to assignments
        const assignmentsData = data.map((order: any) => ({
          id: order.id,
          order_id: order.id,
          rider_id: order.rider_id,
          rider_name: order.rider_name || "N/A",
          rider_phone: order.rider_phone || "N/A",
          customer_name: order.customer_name || "Customer",
          delivery_address: order.delivery_address || "N/A",
          status: order.status,
          assigned_at: order.dispatched_at || order.created_at,
          picked_up_at: order.dispatched_at,
          delivered_at: order.delivered_at,
          order_total: order.total_cedis || 0
        }))
        setAssignments(assignmentsData)
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
      toast({
        title: "Error",
        description: "Failed to load rider assignments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "dispatched":
        return <Badge className="bg-blue-100 text-blue-700">Out for Delivery</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-700">Delivered</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    const matchesSearch = 
      assignment.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === "dispatched").length,
    delivered: assignments.filter(a => a.status === "delivered").length,
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/riders" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Back to Riders</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-[#303A4D]">Rider Assignments</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Assignments</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#FED141]/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-[#303A4D]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Out for Delivery</p>
                <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivered</p>
                <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, rider, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-[#303A4D]" : ""}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "dispatched" ? "default" : "outline"}
                onClick={() => setStatusFilter("dispatched")}
                className={statusFilter === "dispatched" ? "bg-blue-600" : ""}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "delivered" ? "default" : "outline"}
                onClick={() => setStatusFilter("delivered")}
                className={statusFilter === "delivered" ? "bg-green-600" : ""}
              >
                Delivered
              </Button>
            </div>
          </div>
        </Card>

        {/* Assignments List */}
        {loading ? (
          <Card className="p-12 bg-white text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#303A4D] mx-auto mb-4" />
            <p className="text-[#303A4D] text-lg font-medium">Loading assignments...</p>
          </Card>
        ) : filteredAssignments.length === 0 ? (
          <Card className="p-12 bg-white text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#303A4D] mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {assignments.length === 0 
                ? "No orders have been assigned to riders yet" 
                : "Try adjusting your search or filters"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-bold text-[#303A4D]">
                        Order #{assignment.order_id.slice(0, 8)}
                      </h3>
                      {getStatusBadge(assignment.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-[#303A4D]">{assignment.customer_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Delivery Address</p>
                          <p className="font-medium text-[#303A4D] text-sm">
                            {assignment.delivery_address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Assigned</p>
                          <p className="font-medium text-[#303A4D]">
                            {new Date(assignment.assigned_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Order Total</p>
                          <p className="font-medium text-[#303A4D]">
                            GH₵{(assignment.order_total / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Rider Info */}
                  <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#FED141] rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-[#303A4D]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rider</p>
                        <p className="font-bold text-[#303A4D]">{assignment.rider_name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{assignment.rider_phone}</span>
                      </div>

                      {assignment.delivered_at && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Delivered {new Date(assignment.delivered_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link href={`/admin/orders/${assignment.order_id}`} className="block mt-4">
                      <Button variant="outline" className="w-full border-[#303A4D]/20 hover:bg-[#FED141]/10">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
