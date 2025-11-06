"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Calendar, MapPin, Eye, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import CreateSupplyRequestModal from "@/components/procurement/CreateSupplyRequestModal"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface SupplyRequest {
  id: string
  request_number: string
  product_name: string
  quantity_needed: string
  unit_type: string
  required_by_date: string
  status: string
  is_open_request: boolean
  offers_count: number
  supplier_name?: string
}

interface Product {
  id: string
  name: string
  unit_type: string
}

interface Supplier {
  id: string
  name: string
}

export default function AdminSupplyRequests() {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity_needed: "",
    unit_type: "",
    supplier_id: "",
    is_open_request: false,
    target_categories: [] as string[],
    required_by_date: "",
    delivery_location: "",
    max_budget: "",
    special_requirements: "",
    deadline: ""
  })

  useEffect(() => {
    fetchRequests()
    fetchProducts()
    fetchSuppliers()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-requests`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

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

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : (data.items || []))
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSuppliers(Array.isArray(data) ? data : (data.items || []))
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-requests`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          quantity_needed: parseFloat(formData.quantity_needed),
          max_budget: formData.max_budget ? parseFloat(formData.max_budget) : null,
          supplier_id: formData.supplier_id || null,
          deadline: formData.deadline || null
        })
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Supply request created successfully"
        })
        setShowCreateModal(false)
        setFormData({
          product_id: "",
          quantity_needed: "",
          unit_type: "",
          supplier_id: "",
          is_open_request: false,
          target_categories: [],
          required_by_date: "",
          delivery_location: "",
          max_budget: "",
          special_requirements: "",
          deadline: ""
        })
        fetchRequests()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to create request",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to create request:", error)
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      })
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setFormData({
      ...formData,
      product_id: productId,
      unit_type: product?.unit_type || ""
    })
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="procurement-header"]',
      title: 'Supply Requests',
      description: 'Create and manage supply requests to order products from suppliers. Track request status from creation to delivery.',
      position: 'bottom'
    },
    {
      target: '[data-tour="create-request"]',
      title: 'Create Supply Request',
      description: 'Request products from suppliers. Choose direct (specific supplier) or open marketplace (multiple suppliers can bid).',
      position: 'left'
    },
    {
      target: '[data-tour="request-list"]',
      title: 'Request List',
      description: 'All supply requests with status, offers received, and delivery dates. Click to view details and supplier offers.',
      position: 'bottom'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="procurement-requests" steps={tourSteps} />
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div data-tour="procurement-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Supply Requests</h1>
          <p className="text-[#303A4D]/70">Manage procurement requests</p>
        </div>
        
        <Button
          data-tour="create-request"
          onClick={() => setShowCreateModal(true)}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="text-center py-12">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Requests Yet</h3>
          <p className="text-gray-600 mb-4">Create your first supply request</p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Request
          </Button>
        </Card>
      ) : (
        <div data-tour="request-list" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
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
                    {request.is_open_request ? 'Open Market' : 'Direct'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    request.status === 'completed' ? 'bg-green-100 text-green-700' :
                    request.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                    request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">
                    {request.quantity_needed} {request.unit_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(request.required_by_date).toLocaleDateString()}
                  </span>
                </div>

                {request.supplier_name && (
                  <div className="text-sm text-gray-600">
                    <strong>Supplier:</strong> {request.supplier_name}
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-sm font-medium">
                    {request.offers_count} offer(s) received
                  </span>
                </div>
              </div>

              {/* Actions */}
              <Link href={`/admin/procurement/requests/${request.id}`}>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <CreateSupplyRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchRequests()
          toast({
            title: "Success",
            description: "Supply request created successfully!"
          })
        }}
      />
      </div>
    </>
  )
}
