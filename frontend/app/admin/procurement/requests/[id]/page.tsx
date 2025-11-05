"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Package, Calendar, MapPin, DollarSign, CheckCircle, XCircle, Star, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface SupplyOffer {
  id: string
  supplier_name: string
  supplier_rating: string
  supplier_on_time_rate: string
  offered_quantity: string
  unit_price: string
  total_price: string
  delivery_date: string
  delivery_time_hours: number
  delivery_fee: string
  quality_guarantee?: string
  notes?: string
  status: string
}

interface RequestDetails {
  id: string
  request_number: string
  product_name: string
  quantity_needed: string
  unit_type: string
  required_by_date: string
  delivery_location?: string
  max_budget?: string
  status: string
  is_open_request: boolean
  special_requirements?: string
  offers_count: number
}

export default function RequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [offers, setOffers] = useState<SupplyOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      fetchRequestDetails()
      fetchOffers()
    }
  }, [params.id])

  const fetchRequestDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supply-requests/${params.id}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRequest(data)
      }
    } catch (error) {
      console.error("Failed to fetch request:", error)
    }
  }

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supply-requests/${params.id}/offers`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

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

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supply-requests/${params.id}/accept-offer`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            offer_id: selectedOffer.id,
            admin_notes: adminNotes
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Offer accepted successfully"
        })
        setShowAcceptModal(false)
        setAdminNotes("")
        fetchRequestDetails()
        fetchOffers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to accept offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to accept offer:", error)
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive"
      })
    }
  }

  const handleRejectOffer = async () => {
    if (!selectedOffer || !rejectionReason) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supply-requests/${params.id}/reject-offer`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            offer_id: selectedOffer.id,
            rejection_reason: rejectionReason
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Offer rejected"
        })
        setShowRejectModal(false)
        setRejectionReason("")
        fetchOffers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to reject offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to reject offer:", error)
      toast({
        title: "Error",
        description: "Failed to reject offer",
        variant: "destructive"
      })
    }
  }

  const openAcceptModal = (offer: SupplyOffer) => {
    setSelectedOffer(offer)
    setShowAcceptModal(true)
  }

  const openRejectModal = (offer: SupplyOffer) => {
    setSelectedOffer(offer)
    setShowRejectModal(true)
  }

  if (!request) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/procurement/requests">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">{request.product_name}</h1>
            <p className="text-[#303A4D]/70">Request #{request.request_number}</p>
          </div>
          
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            request.status === 'completed' ? 'bg-green-100 text-green-700' :
            request.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
            request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {request.status}
          </span>
        </div>
      </div>

      {/* Request Details */}
      <Card className="p-6 mb-6 bg-white">
        <h2 className="text-xl font-bold text-[#303A4D] mb-4">Request Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium text-[#303A4D]">
                {request.quantity_needed} {request.unit_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Required By</p>
              <p className="font-medium text-[#303A4D]">
                {new Date(request.required_by_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {request.delivery_location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Delivery Location</p>
                <p className="font-medium text-[#303A4D]">{request.delivery_location}</p>
              </div>
            </div>
          )}

          {request.max_budget && (
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Max Budget</p>
                <p className="font-medium text-[#303A4D]">GH₵{request.max_budget}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Request Type</p>
              <p className="font-medium text-[#303A4D]">
                {request.is_open_request ? 'Open Marketplace' : 'Direct Request'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Offers Received</p>
              <p className="font-medium text-[#303A4D]">{request.offers_count}</p>
            </div>
          </div>
        </div>

        {request.special_requirements && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Special Requirements:</p>
            <p className="text-sm text-gray-600">{request.special_requirements}</p>
          </div>
        )}
      </Card>

      {/* Offers */}
      <div>
        <h2 className="text-2xl font-bold text-[#303A4D] mb-4">
          Supplier Offers ({offers.length})
        </h2>

        {loading ? (
          <div className="text-center py-12">Loading offers...</div>
        ) : offers.length === 0 ? (
          <Card className="p-12 bg-white text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Offers Yet</h3>
            <p className="text-gray-600">Waiting for suppliers to submit offers</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                {/* Supplier Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#303A4D] mb-2">
                      {offer.supplier_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{offer.supplier_rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span>{offer.supplier_on_time_rate}% on-time</span>
                      </div>
                    </div>
                  </div>
                  
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    offer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {offer.status}
                  </span>
                </div>

                {/* Offer Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="font-medium">{offer.offered_quantity} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unit Price:</span>
                    <span className="font-medium">GH₵{offer.unit_price}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Delivery Fee:</span>
                    <span className="font-medium">GH₵{offer.delivery_fee}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-bold">Total:</span>
                    <span className="text-lg font-bold text-[#303A4D]">GH₵{offer.total_price}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Delivery: {new Date(offer.delivery_date).toLocaleDateString()}
                      {offer.delivery_time_hours && ` (${offer.delivery_time_hours}h)`}
                    </span>
                  </div>

                  {offer.quality_guarantee && (
                    <div className="p-3 bg-green-50 rounded text-sm">
                      <strong>Quality:</strong> {offer.quality_guarantee}
                    </div>
                  )}

                  {offer.notes && (
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <strong>Notes:</strong> {offer.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {offer.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openAcceptModal(offer)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => openRejectModal(offer)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Offer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Accept offer from <strong>{selectedOffer?.supplier_name}</strong>?</p>
            <p className="text-sm text-gray-600">
              Total: <strong>GH₵{selectedOffer?.total_price}</strong>
            </p>

            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Any notes for this acceptance..."
                className="mt-2"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAcceptOffer}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAcceptModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Offer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Reject offer from <strong>{selectedOffer?.supplier_name}</strong>?</p>

            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason..."
                required
                className="mt-2"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleRejectOffer}
                variant="destructive"
                className="flex-1"
                disabled={!rejectionReason}
              >
                Confirm Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
