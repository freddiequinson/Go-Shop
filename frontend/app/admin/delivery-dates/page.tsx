"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Edit, Trash2, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import Link from "next/link"
import apiClient from "@/lib/api/client"

interface DeliveryDate {
  id: string
  date: string
  day_name: string
  is_available: boolean
  max_orders: number | null
  current_orders: number
  notes: string | null
}

export default function DeliveryDatesPage() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDate, setEditingDate] = useState<DeliveryDate | null>(null)
  const [isBulkCreating, setIsBulkCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    date: "",
    is_available: true,
    max_orders: "",
    notes: ""
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    if (user?.user_type?.toUpperCase() !== "ADMIN") {
      router.push("/")
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive"
      })
      return
    }
    
    loadDeliveryDates()
  }, [isAuthenticated, user])

  const loadDeliveryDates = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get("/delivery-dates/")
      setDeliveryDates(response.data)
    } catch (error) {
      console.error("Failed to load delivery dates:", error)
      toast({
        title: "Error",
        description: "Failed to load delivery dates",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkCreate = async () => {
    try {
      setIsBulkCreating(true)
      await apiClient.post("/delivery-dates/bulk-create", null, {
        params: { days: 30 }
      })
      toast({
        title: "Success",
        description: "Created delivery dates for next 30 days"
      })
      loadDeliveryDates()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to bulk create dates",
        variant: "destructive"
      })
    } finally {
      setIsBulkCreating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        date: formData.date,
        is_available: formData.is_available,
        max_orders: formData.max_orders ? parseInt(formData.max_orders) : null,
        notes: formData.notes || null
      }

      if (editingDate) {
        await apiClient.put(`/delivery-dates/${editingDate.id}`, payload)
        toast({
          title: "Success",
          description: "Delivery date updated"
        })
      } else {
        await apiClient.post("/delivery-dates/", payload)
        toast({
          title: "Success",
          description: "Delivery date created"
        })
      }
      
      setShowModal(false)
      setEditingDate(null)
      setFormData({ date: "", is_available: true, max_orders: "", notes: "" })
      loadDeliveryDates()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save delivery date",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (deliveryDate: DeliveryDate) => {
    setEditingDate(deliveryDate)
    setFormData({
      date: deliveryDate.date,
      is_available: deliveryDate.is_available,
      max_orders: deliveryDate.max_orders?.toString() || "",
      notes: deliveryDate.notes || ""
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery date?")) return
    
    try {
      await apiClient.delete(`/delivery-dates/${id}`)
      toast({
        title: "Success",
        description: "Delivery date deleted"
      })
      loadDeliveryDates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete delivery date",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div className="bg-[#303A4D] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Delivery Dates Management</h1>
              <p className="text-white/70">Manage available delivery dates for customer orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => {
              setEditingDate(null)
              setFormData({ date: "", is_available: true, max_orders: "", notes: "" })
              setShowModal(true)
            }}
            className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Delivery Date
          </Button>
          
          <Button
            onClick={handleBulkCreate}
            disabled={isBulkCreating}
            variant="outline"
            className="border-[#303A4D] text-[#303A4D] hover:bg-[#303A4D] hover:text-white"
          >
            {isBulkCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Bulk Create (30 Days)
              </>
            )}
          </Button>
        </div>

        {/* Delivery Dates Table */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#303A4D] text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Day</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Orders</th>
                  <th className="px-6 py-4 text-left">Notes</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryDates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#303A4D]/60">
                      No delivery dates found. Click "Add Delivery Date" or "Bulk Create" to get started.
                    </td>
                  </tr>
                ) : (
                  deliveryDates.map((deliveryDate) => (
                    <tr key={deliveryDate.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#303A4D]">
                          {new Date(deliveryDate.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#303A4D]">{deliveryDate.day_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {deliveryDate.is_available ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X className="w-3 h-3 mr-1" />
                            Unavailable
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[#303A4D]">
                          {deliveryDate.current_orders}
                          {deliveryDate.max_orders && (
                            <span className="text-[#303A4D]/60"> / {deliveryDate.max_orders}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#303A4D]/70">
                          {deliveryDate.notes || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleEdit(deliveryDate)}
                            size="sm"
                            variant="outline"
                            className="border-[#FED141] text-[#303A4D] hover:bg-[#FED141]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(deliveryDate.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6">
              {editingDate ? "Edit Delivery Date" : "Add Delivery Date"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                  required
                  disabled={!!editingDate}
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-[#303A4D]">Available for orders</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Max Orders (optional)
                </label>
                <input
                  type="number"
                  value={formData.max_orders}
                  onChange={(e) => setFormData({ ...formData, max_orders: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                  rows={3}
                  placeholder="e.g., Holiday, Peak season"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#303A4D] hover:bg-[#3B4559] text-white"
                >
                  {editingDate ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingDate(null)
                    setFormData({ date: "", is_available: true, max_orders: "", notes: "" })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
