"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Calendar, MapPin, DollarSign, Send, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface SupplyRequest {
  id: string
  request_number: string
  product_name: string
  quantity_needed: string
  unit_type: string
  required_by_date: string
  delivery_location: string
  max_budget: string
  status: string
  is_open_request: boolean
  offers_count: number
}

export default function SupplierRequests() {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null)
  const [includeOpen, setIncludeOpen] = useState(true)
  const { toast } = useToast()

  const [offerData, setOfferData] = useState({
    offered_quantity: "",
    unit_price: "",
    delivery_date: "",
    delivery_time_hours: "",
    delivery_fee: "0",
    quality_guarantee: "",
    sample_available: false,
    notes: ""
  })

  useEffect(() => {
    fetchRequests()
  }, [includeOpen])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${getApiBaseUrl()}/supplier/requests?include_open=${includeOpen}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRequest) return

    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${getApiBaseUrl()}/supplier/requests/${selectedRequest.id}/offer`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            supply_request_id: selectedRequest.id,
            offered_quantity: parseFloat(offerData.offered_quantity),
            unit_price: parseFloat(offerData.unit_price),
            delivery_date: new Date(offerData.delivery_date).toISOString(),
            delivery_time_hours: offerData.delivery_time_hours ? parseInt(offerData.delivery_time_hours) : null,
            delivery_fee: parseFloat(offerData.delivery_fee),
            quality_guarantee: offerData.quality_guarantee,
            sample_available: offerData.sample_available,
            notes: offerData.notes
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your offer has been submitted"
        })
        setShowOfferModal(false)
        setOfferData({
          offered_quantity: "",
          unit_price: "",
          delivery_date: "",
          delivery_time_hours: "",
          delivery_fee: "0",
          quality_guarantee: "",
          sample_available: false,
          notes: ""
        })
        fetchRequests()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to submit offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to submit offer:", error)
      toast({
        title: "Error",
        description: "Failed to submit offer",
        variant: "destructive"
      })
    }
  }

  const openOfferModal = (request: SupplyRequest) => {
    setSelectedRequest(request)
    setOfferData({
      ...offerData,
      offered_quantity: request.quantity_needed,
      unit_price: ""
    })
    setShowOfferModal(true)
  }

  const calculateTotal = () => {
    const quantity = parseFloat(offerData.offered_quantity) || 0
    const price = parseFloat(offerData.unit_price) || 0
    const fee = parseFloat(offerData.delivery_fee) || 0
    return (quantity * price + fee).toFixed(2)
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="requests-header"]',
      title: 'Supply Requests from GoShop',
      description: 'This page shows all supply requests from GoShop. These are products they need you to supply. Review details and submit competitive offers to win contracts.',
      position: 'bottom'
    },
    {
      target: '[data-tour="filter-toggle"]',
      title: 'Filter Requests',
      description: 'Toggle this to include open marketplace requests. Open requests are visible to all suppliers, while direct requests are sent specifically to you.',
      position: 'left'
    },
    {
      target: '[data-tour="request-card"]',
      title: 'Request Details',
      description: 'Each card shows product name, quantity needed, delivery deadline, location, and budget. Click "Submit Offer" to bid on any request you can fulfill.',
      position: 'top'
    }
  ]

  return (
    <>
      {!loading && <OnboardingTour tourId="supplier-requests" steps={tourSteps} />}
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div data-tour="requests-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Supply Requests</h1>
          <p className="text-[#303A4D]/70">View and respond to supply requests</p>
        </div>
        
        <div data-tour="filter-toggle" className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOpen}
              onChange={(e) => setIncludeOpen(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Include Open Marketplace</span>
          </label>
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="text-center py-12">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Requests Available</h3>
          <p className="text-gray-600">Check back later for new supply requests</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request, index) => (
            <Card 
              key={request.id} 
              data-tour={index === 0 ? "request-card" : undefined}
              className="p-6 bg-white hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#303A4D] mb-1">
                    {request.product_name}
                  </h3>
                  <p className="text-sm text-gray-500">#{request.request_number}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    request.is_open_request 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {request.is_open_request ? 'Open Market' : 'Direct Request'}
                  </span>
                  <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {request.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">
                    <strong>Quantity:</strong> {request.quantity_needed} {request.unit_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    <strong>Required By:</strong> {new Date(request.required_by_date).toLocaleDateString()}
                  </span>
                </div>

                {request.delivery_location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      <strong>Location:</strong> {request.delivery_location}
                    </span>
                  </div>
                )}

                {request.max_budget && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">
                      <strong>Budget:</strong> GH₵{request.max_budget}
                    </span>
                  </div>
                )}

                {request.offers_count > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>{request.offers_count}</strong> offer(s) submitted
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => openOfferModal(request)}
                className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
                disabled={request.status !== 'sent' && request.status !== 'responded'}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Offer
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Offer Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">Submit Offer</DialogTitle>
            {selectedRequest && (
              <p className="text-sm text-gray-500 mt-2">
                For: {selectedRequest.product_name} • #{selectedRequest.request_number}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmitOffer} className="space-y-6">
            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Offered Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={offerData.offered_quantity}
                  onChange={(e) => setOfferData({ ...offerData, offered_quantity: e.target.value })}
                  required
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Requested: {selectedRequest?.quantity_needed} {selectedRequest?.unit_type}
                </p>
              </div>

              <div>
                <Label>Unit Price (GH₵) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={offerData.unit_price}
                  onChange={(e) => setOfferData({ ...offerData, unit_price: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            {/* Delivery */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={offerData.delivery_date}
                  onChange={(e) => setOfferData({ ...offerData, delivery_date: e.target.value })}
                  required
                  className="mt-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label>Delivery Time (hours)</Label>
                <Input
                  type="number"
                  value={offerData.delivery_time_hours}
                  onChange={(e) => setOfferData({ ...offerData, delivery_time_hours: e.target.value })}
                  placeholder="e.g., 24"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Delivery Fee */}
            <div>
              <Label>Delivery Fee (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                value={offerData.delivery_fee}
                onChange={(e) => setOfferData({ ...offerData, delivery_fee: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Quality Guarantee */}
            <div>
              <Label>Quality Guarantee</Label>
              <Textarea
                value={offerData.quality_guarantee}
                onChange={(e) => setOfferData({ ...offerData, quality_guarantee: e.target.value })}
                placeholder="Describe your quality standards..."
                className="mt-2"
              />
            </div>

            {/* Sample Available */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sample"
                checked={offerData.sample_available}
                onChange={(e) => setOfferData({ ...offerData, sample_available: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="sample" className="cursor-pointer">
                Sample available for inspection
              </Label>
            </div>

            {/* Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={offerData.notes}
                onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="mt-2"
              />
            </div>

            {/* Total */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Offer:</span>
                <span className="text-[#303A4D]">GH₵{calculateTotal()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ({offerData.offered_quantity || 0} × GH₵{offerData.unit_price || 0}) + GH₵{offerData.delivery_fee || 0} delivery
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
              >
                Submit Offer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOfferModal(false)}
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
