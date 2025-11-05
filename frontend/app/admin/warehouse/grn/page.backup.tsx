"use client"

import { useEffect, useState } from "react"
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

export default function GRNPage() {
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
        fetch("http://localhost:8000/api/v1/warehouse/grn/", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/suppliers/", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/products/", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/warehouse/locations/", {
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
      const response = await fetch("http://localhost:8000/api/v1/warehouse/grn/", {
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
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/grn/${id}/approve`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/grn/${id}/reject?reason=${encodeURIComponent(reason)}`, {
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

      {/* GRNs List */}
      <div className="space-y-4">
        {filteredGRNs.map((grn) => (
          <Card key={grn.id} className="p-6 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[#303A4D]">{grn.grn_number}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grn.quality_check_status)}`}>
                    {grn.quality_check_status}
                  </span>
                  {grn.is_perishable && grn.days_until_expiry !== null && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      grn.days_until_expiry <= 3 ? 'bg-red-100 text-red-700' :
                      grn.days_until_expiry <= 7 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {grn.days_until_expiry > 0 ? `${grn.days_until_expiry} days left` : 'Expired'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Batch</p>
                    <p className="font-medium">{grn.batch_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">
                      {grn.quantity_received_pieces && `${grn.quantity_received_pieces} pcs`}
                      {grn.quantity_received_pieces && grn.quantity_received_weight && ' / '}
                      {grn.quantity_received_weight && `${grn.quantity_received_weight} ${grn.weight_unit}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost</p>
                    <p className="font-medium">GH₵{typeof grn.total_cost === 'string' ? parseFloat(grn.total_cost).toFixed(2) : grn.total_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Date</p>
                    <p className="font-medium">{new Date(grn.delivery_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {grn.images && grn.images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <ImageIcon className="w-4 h-4" />
                    <span>{grn.images.length} image(s) attached</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {grn.quality_check_status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(grn.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(grn.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedGRN(grn)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
