"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, CheckCircle, Clock, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import SupplierRatingModal from "@/components/supplier-rating-modal"

interface DirectOrder {
  id: string
  product_name: string
  supplier_name: string
  offered_quantity: string
  unit_price: string
  total_price: string
  delivery_date: string
  status: string
  is_direct_order: boolean
  order_source: string
  notes?: string
  created_at: string
}

export default function AdminDirectOrders() {
  const [orders, setOrders] = useState<DirectOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("accepted") // Show confirmed orders
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DirectOrder | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDirectOrders()
  }, [statusFilter])

  const fetchDirectOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      // Fetch all offers and filter for direct orders
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-offers/admin/all-offers`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log("All offers received:", data)
        console.log("Total offers:", data.length)
        
        // Filter for direct orders only
        const directOrders = data.filter((offer: DirectOrder) => {
          console.log(`Offer ${offer.id}: is_direct_order=${offer.is_direct_order}, status=${offer.status}`)
          return offer.is_direct_order && 
                 (statusFilter === "" || offer.status === statusFilter)
        })
        
        console.log("Filtered direct orders:", directOrders)
        console.log("Direct orders count:", directOrders.length)
        setOrders(directOrders)
      }
    } catch (error) {
      console.error("Failed to fetch direct orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveOrder = async (orderId: string) => {
    // Find the order to get supplier name
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setShowRatingModal(true)
    }
  }

  const handleSubmitRating = async (rating: number, feedback: string, locationId: string) => {
    if (!selectedOrder) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-offers/${selectedOrder.id}/receive`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rating_data: {
            rating: rating,
            feedback: feedback,
            warehouse_location_id: locationId
          }
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Order received, GRN created, and supplier rated ${rating} stars!`
        })
        setShowRatingModal(false)
        setSelectedOrder(null)
        fetchDirectOrders() // Refresh the list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to receive order",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to receive order",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Truck className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-orange-100 text-orange-700'
      case 'received':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Direct Orders</h1>
        <p className="text-[#303A4D]/70">Manage orders from supplier marketplace</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          onClick={() => setStatusFilter("")}
          className={statusFilter === "" ? "bg-[#303A4D] text-white" : ""}
        >
          All Orders
        </Button>
        <Button
          variant={statusFilter === "accepted" ? "default" : "outline"}
          onClick={() => setStatusFilter("accepted")}
          className={statusFilter === "accepted" ? "bg-green-600 text-white" : ""}
        >
          Confirmed Orders
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
          className={statusFilter === "pending" ? "bg-orange-500 text-white" : ""}
        >
          Pending Confirmation
        </Button>
        <Button
          variant={statusFilter === "received" ? "default" : "outline"}
          onClick={() => setStatusFilter("received")}
          className={statusFilter === "received" ? "bg-blue-600 text-white" : ""}
        >
          Received Orders
        </Button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : orders.length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Direct Orders Found</h3>
          <p className="text-gray-600">
            {statusFilter === "accepted" 
              ? "No confirmed orders waiting to be received" 
              : "No direct orders yet"}
          </p>
        </Card>
      ) : (
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-[#303A4D]">{order.product_name}</div>
                          {order.notes && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{order.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.offered_quantity} units</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GH₵{order.unit_price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#303A4D]">GH₵{order.total_price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.status === 'accepted' && (
                        <Button
                          onClick={() => handleReceiveOrder(order.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Receive
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <span className="text-xs text-orange-600">⏳ Awaiting confirmation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Rating Modal */}
      <SupplierRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false)
          setSelectedOrder(null)
        }}
        onSubmit={handleSubmitRating}
        supplierName={selectedOrder?.supplier_name || "Supplier"}
      />
    </div>
  )
}
