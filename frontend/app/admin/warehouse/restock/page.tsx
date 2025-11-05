"use client"

import { useEffect, useState } from "react"
import { Package, Plus, Check, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import CreateSupplyRequestModal from "@/components/procurement/CreateSupplyRequestModal"

interface RestockOrder {
  id: string
  supplier_id: string
  product_id: string
  quantity_ordered: number
  unit_cost: number
  total_cost: number
  expected_delivery_date: string
  status: string
  notes?: string
  created_at: string
  supplier?: { name: string }
  product?: { name: string }
}

export default function RestockOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<RestockOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/warehouse/restock-orders", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch restock orders:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/restock-orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
    }
  }

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase())

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    approved: orders.filter(o => o.status === 'APPROVED').length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    totalValue: orders.reduce((sum, o) => sum + o.total_cost, 0)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Restock Orders</h1>
          <p className="text-[#303A4D]/70">Manage inventory restock orders and create supply requests</p>
        </div>
        <Button
          onClick={() => setShowRequestModal(true)}
          className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
        >
          <FileText className="w-4 h-4 mr-2" />
          Create Supply Request
        </Button>
      </div>

      {/* Supply Request Modal */}
      <CreateSupplyRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          setShowRequestModal(false)
          toast({
            title: "Success",
            description: "Supply request created! It will appear here once accepted and delivered."
          })
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-[#303A4D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Received</p>
          <p className="text-2xl font-bold text-green-600">{stats.received}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Total Value</p>
          <p className="text-2xl font-bold text-[#303A4D]">GH₵{stats.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Product</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Supplier</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Total Cost</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Expected</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303A4D]/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-[#303A4D]">{order.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#303A4D]">{order.product?.name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">{order.supplier?.name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">{order.quantity_ordered}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#303A4D]">GH₵{order.total_cost.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">
                      {new Date(order.expected_delivery_date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'APPROVED')}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full px-3 py-1 text-xs font-bold"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      {order.status === 'APPROVED' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'RECEIVED')}
                          className="bg-green-100 hover:bg-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-bold"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Mark Received
                        </Button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'APPROVED') && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          className="bg-red-100 hover:bg-red-200 text-red-700 rounded-full px-3 py-1 text-xs font-bold"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
            <p className="text-[#303A4D]/60">No restock orders found</p>
          </div>
        )}
      </div>
    </div>
  )
}
