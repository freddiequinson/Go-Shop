"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Package, Plus, Check, X, Eye, Image as ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GRN {
  id: string
  grn_number: string
  supplier_id: string
  product_id: string
  supplier_name?: string
  product_name?: string
  batch_number: string | null
  quantity_received_pieces: number | null
  quantity_received_weight: number | null
  weight_unit: string | null
  unit_cost: number
  total_cost: number
  delivery_date: string
  expiry_date: string | null
  warehouse_location_id: string
  quality_check_status: string
  images: string[] | null
  notes: string | null
  is_perishable: boolean
  days_until_expiry: number | null
  created_at: string
}

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  code: string
}

function GRNContent() {
  const searchParams = useSearchParams()
  const supplierIdFromUrl = searchParams.get('supplier_id')
  
  const [grns, setGrns] = useState<GRN[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  const [formData, setFormData] = useState({
    supplier_id: supplierIdFromUrl || "",
    product_id: "",
    batch_number: "",
    quantity_received_pieces: "",
    quantity_received_weight: "",
    weight_unit: "kg",
    unit_cost: "",
    delivery_date: new Date().toISOString().split('T')[0],
    manufacturing_date: "",
    expiry_date: "",
    warehouse_location_id: "",
    notes: "",
    images: [] as string[]
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-open modal if supplier_id is in URL
  useEffect(() => {
    if (supplierIdFromUrl && suppliers.length > 0) {
      setShowModal(true)
    }
  }, [supplierIdFromUrl, suppliers])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const [grnsRes, suppliersRes, productsRes, locationsRes] = await Promise.all([
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/grn/`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/locations/`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      if (grnsRes.ok) {
        const data = await grnsRes.json()
        setGrns(Array.isArray(data) ? data : (data.items || []))
      }
      if (suppliersRes.ok) {
        const data = await suppliersRes.json()
        setSuppliers(Array.isArray(data) ? data : (data.items || []))
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(Array.isArray(data) ? data : (data.items || []))
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json()
        setLocations(Array.isArray(data) ? data : (data.items || []))
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.quantity_received_pieces && !formData.quantity_received_weight) {
      toast({
        title: "Error",
        description: "Please enter either pieces or weight quantity",
        variant: "destructive"
      })
      return
    }

    const token = localStorage.getItem("access_token")
    
    const payload = {
      supplier_id: formData.supplier_id,
      product_id: formData.product_id,
      batch_number: formData.batch_number || null,
      quantity_received_pieces: formData.quantity_received_pieces ? parseFloat(formData.quantity_received_pieces) : null,
      quantity_received_weight: formData.quantity_received_weight ? parseFloat(formData.quantity_received_weight) : null,
      weight_unit: formData.weight_unit || null,
      unit_cost: parseFloat(formData.unit_cost),
      delivery_date: new Date(formData.delivery_date).toISOString(),
      manufacturing_date: formData.manufacturing_date ? new Date(formData.manufacturing_date).toISOString() : null,
      expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
      warehouse_location_id: formData.warehouse_location_id,
      images: formData.images.length > 0 ? formData.images : null,
      notes: formData.notes || null
    }

    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/grn/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "GRN created successfully"
        })
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to create GRN",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create GRN",
        variant: "destructive"
      })
    }
  }

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem("access_token")
    
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/grn/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "GRN approved and inventory updated"
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve GRN",
        variant: "destructive"
      })
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason:")
    if (!reason) return

    const token = localStorage.getItem("access_token")
    
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/grn/${id}/reject?reason=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "GRN rejected"
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject GRN",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      product_id: "",
      batch_number: "",
      quantity_received_pieces: "",
      quantity_received_weight: "",
      weight_unit: "kg",
      unit_cost: "",
      delivery_date: new Date().toISOString().split('T')[0],
      manufacturing_date: "",
      expiry_date: "",
      warehouse_location_id: "",
      notes: "",
      images: []
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "approved": return "bg-green-100 text-green-700"
      case "rejected": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const filteredGRNs = grns.filter(grn => {
    if (activeTab === "all") return true
    return grn.quality_check_status === activeTab
  })

  if (loading) {
    return <div className="p-8 text-center">Loading GRNs...</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Goods Received Notes</h1>
          <p className="text-[#303A4D]/70">Record and manage incoming stock</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create GRN
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({grns.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({grns.filter(g => g.quality_check_status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({grns.filter(g => g.quality_check_status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({grns.filter(g => g.quality_check_status === "rejected").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* GRNs Table */}
      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6] border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">GRN #</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Product</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Supplier</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Cost</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#303A4D]/60">
                    <Package className="w-12 h-12 mx-auto mb-3 text-[#303A4D]/20" />
                    <p>No GRNs found</p>
                  </td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => {
                  const supplier = suppliers.find(s => s.id === grn.supplier_id)
                  const product = products.find(p => p.id === grn.product_id)
                  const supplierName = grn.supplier_name || supplier?.name || 'Unknown'
                  const productName = grn.product_name || product?.name || 'Unknown'
                  
                  return (
                    <tr key={grn.id} className="border-b hover:bg-[#F4F2E6]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-[#303A4D]">{grn.grn_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#303A4D]">{productName}</p>
                        {grn.batch_number && (
                          <p className="text-xs text-[#303A4D]/60">Batch: {grn.batch_number}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#303A4D]">{supplierName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#303A4D]">
                          {grn.quantity_received_pieces && `${grn.quantity_received_pieces} pcs`}
                          {grn.quantity_received_pieces && grn.quantity_received_weight && ' / '}
                          {grn.quantity_received_weight && `${grn.quantity_received_weight} ${grn.weight_unit}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#303A4D]">
                          GH₵{typeof grn.total_cost === 'string' ? parseFloat(grn.total_cost).toFixed(2) : grn.total_cost.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block w-fit ${getStatusColor(grn.quality_check_status)}`}>
                            {grn.quality_check_status}
                          </span>
                          {grn.is_perishable && grn.days_until_expiry !== null && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium inline-block w-fit ${
                              grn.days_until_expiry <= 3 ? 'bg-red-100 text-red-700' :
                              grn.days_until_expiry <= 7 ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {grn.days_until_expiry > 0 ? `${grn.days_until_expiry}d left` : 'Expired'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#303A4D]">{new Date(grn.delivery_date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {grn.quality_check_status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(grn.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(grn.id)}
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedGRN(grn)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View GRN Modal */}
      <Dialog open={!!selectedGRN} onOpenChange={() => setSelectedGRN(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">GRN Details</DialogTitle>
          </DialogHeader>

          {selectedGRN && (
            <div className="space-y-6 mt-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F4F2E6] rounded-lg">
                <div>
                  <p className="text-sm text-[#303A4D]/60">GRN Number</p>
                  <p className="font-bold text-lg text-[#303A4D]">{selectedGRN.grn_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(selectedGRN.quality_check_status)}`}>
                    {selectedGRN.quality_check_status}
                  </span>
                </div>
              </div>

              {/* Product & Supplier Info */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-bold text-[#303A4D] mb-3">Product Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-[#303A4D]/60">Product Name</p>
                      <p className="font-medium text-[#303A4D]">
                        {selectedGRN.product_name || products.find(p => p.id === selectedGRN.product_id)?.name || 'Unknown'}
                      </p>
                    </div>
                    {selectedGRN.batch_number && (
                      <div>
                        <p className="text-sm text-[#303A4D]/60">Batch Number</p>
                        <p className="font-medium text-[#303A4D]">{selectedGRN.batch_number}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-bold text-[#303A4D] mb-3">Supplier Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-[#303A4D]/60">Supplier Name</p>
                      <p className="font-medium text-[#303A4D]">
                        {selectedGRN.supplier_name || suppliers.find(s => s.id === selectedGRN.supplier_id)?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quantity & Cost */}
              <Card className="p-4">
                <h3 className="font-bold text-[#303A4D] mb-3">Quantity & Cost</h3>
                <div className="grid grid-cols-4 gap-4">
                  {selectedGRN.quantity_received_pieces && (
                    <div>
                      <p className="text-sm text-[#303A4D]/60">Pieces</p>
                      <p className="font-medium text-[#303A4D]">{selectedGRN.quantity_received_pieces} pcs</p>
                    </div>
                  )}
                  {selectedGRN.quantity_received_weight && (
                    <div>
                      <p className="text-sm text-[#303A4D]/60">Weight</p>
                      <p className="font-medium text-[#303A4D]">{selectedGRN.quantity_received_weight} {selectedGRN.weight_unit}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Unit Cost</p>
                    <p className="font-medium text-[#303A4D]">GH₵{typeof selectedGRN.unit_cost === 'string' ? parseFloat(selectedGRN.unit_cost).toFixed(2) : selectedGRN.unit_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Total Cost</p>
                    <p className="font-bold text-lg text-[#303A4D]">GH₵{typeof selectedGRN.total_cost === 'string' ? parseFloat(selectedGRN.total_cost).toFixed(2) : selectedGRN.total_cost.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              {/* Dates */}
              <Card className="p-4">
                <h3 className="font-bold text-[#303A4D] mb-3">Important Dates</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Delivery Date</p>
                    <p className="font-medium text-[#303A4D]">{new Date(selectedGRN.delivery_date).toLocaleDateString()}</p>
                  </div>
                  {selectedGRN.expiry_date && (
                    <div>
                      <p className="text-sm text-[#303A4D]/60">Expiry Date</p>
                      <p className="font-medium text-[#303A4D]">{new Date(selectedGRN.expiry_date).toLocaleDateString()}</p>
                      {selectedGRN.days_until_expiry !== null && (
                        <p className={`text-xs mt-1 ${
                          selectedGRN.days_until_expiry <= 3 ? 'text-red-600' :
                          selectedGRN.days_until_expiry <= 7 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {selectedGRN.days_until_expiry > 0 ? `${selectedGRN.days_until_expiry} days left` : 'Expired'}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Created At</p>
                    <p className="font-medium text-[#303A4D]">{new Date(selectedGRN.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>

              {/* Location */}
              <Card className="p-4">
                <h3 className="font-bold text-[#303A4D] mb-3">Warehouse Location</h3>
                <p className="text-[#303A4D]">
                  {locations.find(l => l.id === selectedGRN.warehouse_location_id)?.name || 'Unknown'}
                  {locations.find(l => l.id === selectedGRN.warehouse_location_id)?.code && 
                    ` (${locations.find(l => l.id === selectedGRN.warehouse_location_id)?.code})`
                  }
                </p>
              </Card>

              {/* Images */}
              {selectedGRN.images && selectedGRN.images.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-bold text-[#303A4D] mb-3">Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedGRN.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`GRN Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {selectedGRN.notes && (
                <Card className="p-4">
                  <h3 className="font-bold text-[#303A4D] mb-3">Notes</h3>
                  <p className="text-[#303A4D] whitespace-pre-wrap">{selectedGRN.notes}</p>
                </Card>
              )}

              {/* Actions */}
              {selectedGRN.quality_check_status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleApprove(selectedGRN.id)
                      setSelectedGRN(null)
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve GRN
                  </Button>
                  <Button
                    onClick={() => {
                      handleReject(selectedGRN.id)
                      setSelectedGRN(null)
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject GRN
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create GRN Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">Create Goods Received Note</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Record incoming stock from supplier
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Batch Number</Label>
              <Input
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="e.g., BATCH-2025-001"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity (Pieces)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity_received_pieces}
                  onChange={(e) => setFormData({ ...formData, quantity_received_pieces: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label>Quantity (Weight)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity_received_weight}
                  onChange={(e) => setFormData({ ...formData, quantity_received_weight: e.target.value })}
                  placeholder="50.5"
                />
              </div>

              <div>
                <Label>Unit</Label>
                <Select
                  value={formData.weight_unit}
                  onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Cost (GH₵) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  placeholder="10.00"
                  required
                />
              </div>

              <div>
                <Label>Warehouse Location *</Label>
                <Select
                  value={formData.warehouse_location_id}
                  onValueChange={(value) => setFormData({ ...formData, warehouse_location_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Manufacturing Date</Label>
                <Input
                  type="date"
                  value={formData.manufacturing_date}
                  onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
              >
                Create GRN
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function GRNPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#FED141] mx-auto mb-4 animate-pulse" />
          <p className="text-[#303A4D] font-medium">Loading GRN...</p>
        </div>
      </div>
    }>
      <GRNContent />
    </Suspense>
  )
}
