"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, DollarSign, Edit, Trash2, CheckCircle, XCircle, Clock, FileText, Inbox } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface SupplyOffer {
  id: string
  request_number?: string
  product_name: string
  product_image?: string
  offered_quantity: string
  unit_price: string
  total_price: string
  delivery_date: string
  delivery_fee: string
  status: string
  rejection_reason?: string
  notes?: string
  created_at: string
  is_direct_order?: boolean
  order_source?: string
  supply_request_id?: string
}

interface SupplyRequest {
  id: string
  request_number: string
  product_name: string
  quantity_needed: string
  unit_type: string
  required_by_date: string
  deadline?: string
  max_budget?: string
  special_requirements?: string
  is_open_request: boolean
  status: string
}

export default function SupplierOffers() {
  const [offers, setOffers] = useState<SupplyOffer[]>([])
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all") // all, direct, request
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null)
  const [activeTab, setActiveTab] = useState<"offers" | "requests">("offers")
  const { toast } = useToast()

  const [editData, setEditData] = useState({
    offered_quantity: "",
    unit_price: "",
    delivery_date: "",
    delivery_fee: "",
    notes: ""
  })

  useEffect(() => {
    if (activeTab === "offers") {
      fetchOffers()
    }
  }, [statusFilter, activeTab])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const url = statusFilter 
        ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/offers?status=${statusFilter}`
        : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/offers`
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setOffers(data)
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOffer) return

    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/offers/${selectedOffer.id}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            offered_quantity: parseFloat(editData.offered_quantity),
            unit_price: parseFloat(editData.unit_price),
            delivery_date: new Date(editData.delivery_date).toISOString(),
            delivery_fee: parseFloat(editData.delivery_fee),
            notes: editData.notes
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Offer updated successfully"
        })
        setShowEditModal(false)
        fetchOffers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to update offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to update offer:", error)
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive"
      })
    }
  }

  const handleConfirmOrder = async (offerId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-offers/${offerId}/confirm`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Order confirmed and sent to admin"
        })
        fetchOffers() // Refresh list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to confirm order",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm order",
        variant: "destructive"
      })
    }
  }

  const handleWithdrawOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId)
    const isDirectOrder = offer?.is_direct_order
    
    const confirmMessage = isDirectOrder 
      ? "Are you sure you want to decline this direct order? The admin will be notified."
      : "Are you sure you want to withdraw this offer?"
    
    if (!confirm(confirmMessage)) return

    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supplier/offers/${offerId}`,
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        toast({
          title: "Success!",
          description: isDirectOrder ? "Direct order declined" : "Offer withdrawn successfully"
        })
        fetchOffers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to withdraw offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to withdraw offer:", error)
      toast({
        title: "Error",
        description: "Failed to withdraw offer",
        variant: "destructive"
      })
    }
  }

  const openEditModal = (offer: SupplyOffer) => {
    setSelectedOffer(offer)
    setEditData({
      offered_quantity: offer.offered_quantity,
      unit_price: offer.unit_price,
      delivery_date: offer.delivery_date.split('T')[0],
      delivery_fee: offer.delivery_fee,
      notes: offer.notes || ""
    })
    setShowEditModal(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'withdrawn':
        return <Trash2 className="w-5 h-5 text-gray-600" />
      default:
        return <Clock className="w-5 h-5 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'withdrawn':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-orange-100 text-orange-700'
    }
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="offers-header"]',
      title: 'Your Submitted Offers',
      description: 'Track all offers you\'ve submitted to GoShop. Monitor their status, edit pending offers, or withdraw if needed.',
      position: 'bottom'
    },
    {
      target: '[data-tour="offer-filters"]',
      title: 'Filter Your Offers',
      description: 'Filter by order type (Direct Orders vs Request Offers) and status (Pending, Accepted, Rejected). This helps you focus on what matters most.',
      position: 'bottom'
    },
    {
      target: '[data-tour="offer-card"]',
      title: 'Offer Details & Actions',
      description: 'Each card shows your offer details, current status, and pricing. Edit pending offers or withdraw them if you can no longer fulfill.',
      position: 'top'
    }
  ]

  return (
    <>
      {!loading && <OnboardingTour tourId="supplier-offers" steps={tourSteps} />}
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div data-tour="offers-header" className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">My Offers</h1>
        <p className="text-[#303A4D]/70">Track and manage your submitted offers</p>
      </div>

      {/* Filters */}
      <div data-tour="offer-filters" className="mb-6 space-y-3">
        {/* Order Type Filter */}
        <div className="flex gap-3">
          <Button
            variant={orderTypeFilter === "all" ? "default" : "outline"}
            onClick={() => setOrderTypeFilter("all")}
            className={orderTypeFilter === "all" ? "bg-[#FED141] text-[#303A4D]" : ""}
          >
            All Orders
          </Button>
          <Button
            variant={orderTypeFilter === "direct" ? "default" : "outline"}
            onClick={() => setOrderTypeFilter("direct")}
            className={orderTypeFilter === "direct" ? "bg-blue-600 text-white" : ""}
          >
            🛒 Direct Orders
          </Button>
          <Button
            variant={orderTypeFilter === "request" ? "default" : "outline"}
            onClick={() => setOrderTypeFilter("request")}
            className={orderTypeFilter === "request" ? "bg-purple-600 text-white" : ""}
          >
            📋 Request Offers
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-3">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            onClick={() => setStatusFilter("")}
            className={statusFilter === "" ? "bg-[#303A4D] text-white" : ""}
          >
            All Status
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className={statusFilter === "pending" ? "bg-orange-500 text-white" : ""}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "accepted" ? "default" : "outline"}
            onClick={() => setStatusFilter("accepted")}
            className={statusFilter === "accepted" ? "bg-green-600 text-white" : ""}
          >
            Accepted
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => setStatusFilter("rejected")}
            className={statusFilter === "rejected" ? "bg-red-600 text-white" : ""}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Offers Table */}
      {loading ? (
        <div className="text-center py-12">Loading offers...</div>
      ) : offers.filter(offer => {
        // Filter by order type
        if (orderTypeFilter === "direct" && !offer.is_direct_order) return false
        if (orderTypeFilter === "request" && offer.is_direct_order) return false
        return true
      }).length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Offers Found</h3>
          <p className="text-gray-600">
            {statusFilter ? `No ${statusFilter} offers` : "You haven't submitted any offers yet"}
          </p>
        </Card>
      ) : (
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offers.filter(offer => {
                  // Filter by order type
                  if (orderTypeFilter === "direct" && !offer.is_direct_order) return false
                  if (orderTypeFilter === "request" && offer.is_direct_order) return false
                  return true
                }).map((offer, index) => (
                  <tr 
                    key={offer.id} 
                    data-tour={index === 0 ? "offer-card" : undefined}
                    className="hover:bg-gray-50"
                  >
                    {/* Product */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {offer.product_image ? (
                          <img 
                            src={offer.product_image} 
                            alt={offer.product_name}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <Package className={`w-5 h-5 text-gray-400 mr-2 ${offer.product_image ? 'hidden' : ''}`} />
                        <div>
                          <div className="text-sm font-medium text-[#303A4D]">{offer.product_name}</div>
                          {offer.request_number && (
                            <div className="text-xs text-gray-500">#{offer.request_number}</div>
                          )}
                          {offer.notes && (
                            <div className="text-xs text-gray-500 truncate max-w-xs" title={offer.notes}>
                              Note: {offer.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {offer.is_direct_order ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          🛒 Direct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          📋 Request
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {offer.offered_quantity} units
                    </td>

                    {/* Unit Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      GH₵{offer.unit_price}
                    </td>

                    {/* Delivery Fee */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      GH₵{offer.delivery_fee}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#303A4D]">
                      GH₵{offer.total_price}
                    </td>

                    {/* Delivery Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(offer.delivery_date).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                      {offer.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1" title={offer.rejection_reason}>
                          Reason: {offer.rejection_reason.substring(0, 20)}...
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {offer.status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          {offer.is_direct_order ? (
                            // Direct Order: Show Confirm and Decline buttons
                            <>
                              <Button
                                onClick={() => handleConfirmOrder(offer.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                onClick={() => handleWithdrawOffer(offer.id)}
                                size="sm"
                                variant="destructive"
                                className="w-full"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            // Request Offer: Show Edit/Withdraw
                            <>
                              <Button
                                onClick={() => openEditModal(offer)}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleWithdrawOffer(offer.id)}
                                size="sm"
                                variant="destructive"
                                className="w-full"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Withdraw
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                      )}
                      {offer.status === 'rejected' && (
                        <span className="text-xs text-red-600 font-medium">✗ Rejected</span>
                      )}
                      {offer.status === 'received' && (
                        <span className="text-xs text-blue-600 font-medium">✓ Received</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Offer Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">Edit Offer</DialogTitle>
            {selectedOffer && (
              <p className="text-sm text-gray-500 mt-2">
                For: {selectedOffer.product_name} • #{selectedOffer.request_number}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleUpdateOffer} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Offered Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.offered_quantity}
                  onChange={(e) => setEditData({ ...editData, offered_quantity: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Unit Price (GH₵) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.unit_price}
                  onChange={(e) => setEditData({ ...editData, unit_price: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={editData.delivery_date}
                  onChange={(e) => setEditData({ ...editData, delivery_date: e.target.value })}
                  required
                  className="mt-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label>Delivery Fee (GH₵)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.delivery_fee}
                  onChange={(e) => setEditData({ ...editData, delivery_fee: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="mt-2"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>New Total:</span>
                <span className="text-[#303A4D]">
                  GH₵{((parseFloat(editData.offered_quantity) || 0) * (parseFloat(editData.unit_price) || 0) + (parseFloat(editData.delivery_fee) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
              >
                Update Offer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}
