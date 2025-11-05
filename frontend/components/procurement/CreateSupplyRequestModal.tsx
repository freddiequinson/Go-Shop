"use client"

import { useState, useEffect } from "react"
import { X, Package, Calendar, DollarSign, MapPin, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/error-handler"

interface CreateSupplyRequestModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId?: string  // Pre-fill if from supplier page
  productId?: string   // Pre-fill if from product page
  onSuccess?: () => void
}

interface Supplier {
  id: string
  name: string
  supplier_type: string
  specialization?: string[]
}

interface Product {
  id: string
  name: string
  unit_type: string
  price_per_unit: number
  supplier_id?: string
}

export default function CreateSupplyRequestModal({
  isOpen,
  onClose,
  supplierId,
  productId,
  onSuccess
}: CreateSupplyRequestModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>(supplierId || "")
  const [requestType, setRequestType] = useState<"direct" | "open">("direct")

  const [formData, setFormData] = useState({
    product_id: productId || "",
    quantity_needed: "",
    unit_type: "kg",
    supplier_id: supplierId || "",
    is_open_request: false,
    target_categories: [] as string[],
    required_by_date: "",
    estimated_unit_price: "",
    special_requirements: ""
  })

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      if (selectedSupplier) {
        fetchSupplierProducts(selectedSupplier)
      }
    }
  }, [isOpen, selectedSupplier])

  useEffect(() => {
    if (supplierId) {
      setSelectedSupplier(supplierId)
      setFormData(prev => ({ ...prev, supplier_id: supplierId }))
    }
  }, [supplierId])

  useEffect(() => {
    if (productId) {
      setFormData(prev => ({ ...prev, product_id: productId }))
    }
  }, [productId])

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/suppliers?limit=100", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Suppliers API response:", data)
        console.log("Is array?", Array.isArray(data))
        console.log("Has suppliers?", data.suppliers)
        console.log("Has items?", data.items)
        console.log("Total suppliers:", data.total)
        
        // Handle paginated response - API returns 'suppliers' not 'items'
        let suppliersList = Array.isArray(data) ? data : (data.suppliers || data.items || [])
        console.log("Suppliers list:", suppliersList)
        console.log("Suppliers count:", suppliersList.length)
        
        setSuppliers(suppliersList)
      } else {
        console.error("Failed to fetch suppliers, status:", response.status)
        setSuppliers([])
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
      setSuppliers([]) // Set empty array on error
    }
  }

  const fetchSupplierProducts = async (suppId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/suppliers/${suppId}/catalog`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        // Handle array response
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setProducts([]) // Set empty array on error
    }
  }

  const handleSupplierChange = (suppId: string) => {
    setSelectedSupplier(suppId)
    setFormData(prev => ({ 
      ...prev, 
      supplier_id: suppId,
      product_id: "" // Reset product when supplier changes
    }))
    if (suppId) {
      fetchSupplierProducts(suppId)
    } else {
      setProducts([])
    }
  }

  const handleProductChange = (prodId: string) => {
    const product = products.find(p => p.id === prodId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: prodId,
        unit_type: product.unit_type,
        estimated_unit_price: product.price_per_unit.toString()
      }))
    } else {
      setFormData(prev => ({ ...prev, product_id: prodId }))
    }
  }

  const handleRequestTypeChange = (type: "direct" | "open") => {
    setRequestType(type)
    setFormData(prev => ({
      ...prev,
      is_open_request: type === "open",
      supplier_id: type === "open" ? "" : selectedSupplier
    }))
  }

  const calculateEstimatedCost = () => {
    const quantity = parseFloat(formData.quantity_needed)
    const unitPrice = parseFloat(formData.estimated_unit_price)
    if (quantity && unitPrice) {
      return (quantity * unitPrice).toFixed(2)
    }
    return "0.00"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      
      // Prepare payload
      const payload = {
        product_id: formData.product_id,
        quantity_needed: parseFloat(formData.quantity_needed),
        unit_type: formData.unit_type,
        supplier_id: formData.is_open_request ? null : formData.supplier_id || null,
        is_open_request: formData.is_open_request,
        target_categories: formData.is_open_request ? formData.target_categories : null,
        required_by_date: new Date(formData.required_by_date).toISOString(),
        delivery_location: "Main Warehouse",
        max_budget: null,
        estimated_unit_price: formData.estimated_unit_price ? parseFloat(formData.estimated_unit_price) : null,
        special_requirements: formData.special_requirements || null,
        internal_notes: null,
        deadline: null
      }

      const response = await fetch("http://localhost:8000/api/v1/supply-requests/", {
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
          description: "Supply request created successfully! Supplier has been notified."
        })
        onSuccess?.()
        onClose()
        // Reset form
        setFormData({
          product_id: "",
          quantity_needed: "",
          unit_type: "kg",
          supplier_id: "",
          is_open_request: false,
          target_categories: [],
          required_by_date: "",
          estimated_unit_price: "",
          special_requirements: ""
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: getErrorMessage(error, "Failed to create supply request"),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create supply request",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#303A4D]">Create Supply Request</h2>
            <p className="text-sm text-[#303A4D]/60 mt-1">
              Request products from suppliers or create an open marketplace request
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-bold text-[#303A4D] mb-3">Request Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRequestTypeChange("direct")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  requestType === "direct"
                    ? "border-[#FED141] bg-[#FED141]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-[#303A4D] mb-1">Direct Request</div>
                <div className="text-sm text-[#303A4D]/60">
                  Send request to a specific supplier
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRequestTypeChange("open")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  requestType === "open"
                    ? "border-[#FED141] bg-[#FED141]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-[#303A4D] mb-1">Open Marketplace</div>
                <div className="text-sm text-[#303A4D]/60">
                  Open to all relevant suppliers
                </div>
              </button>
            </div>
          </div>

          {/* Supplier Selection (Direct Request Only) */}
          {requestType === "direct" && (
            <div>
              <label className="block text-sm font-bold text-[#303A4D] mb-3">
                Supplier * {suppliers.length > 0 && (
                  <span className="text-xs font-normal text-[#303A4D]/60">
                    ({suppliers.length} available)
                  </span>
                )}
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                required={requestType === "direct"}
                disabled={!!supplierId}
              >
                <option value="">
                  {suppliers.length === 0 ? "Loading suppliers..." : "Select Supplier"}
                </option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.supplier_type})
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  No suppliers found. Please add suppliers first.
                </p>
              )}
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-bold text-[#303A4D] mb-3">
              Product *
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              required
              disabled={requestType === "direct" && !selectedSupplier}
            >
              <option value="">
                {requestType === "direct" && !selectedSupplier
                  ? "Select supplier first"
                  : "Select Product"}
              </option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (GH₵{product.price_per_unit}/{product.unit_type})
                </option>
              ))}
            </select>
            {requestType === "direct" && selectedSupplier && products.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                This supplier has no products in their catalog yet
              </p>
            )}
          </div>

          {/* Quantity, Unit, and Date in one row - optimized widths */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-[#303A4D] mb-3">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity_needed}
                onChange={(e) => setFormData({ ...formData, quantity_needed: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="100"
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-[#303A4D] mb-3">
                Unit *
              </label>
              <select
                value={formData.unit_type}
                onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                required
              >
                <option value="kg">kg</option>
                <option value="gram">gram</option>
                <option value="liter">liter</option>
                <option value="piece">piece</option>
                <option value="pack">pack</option>
              </select>
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm font-bold text-[#303A4D] mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Required By *
              </label>
              <input
                type="date"
                value={formData.required_by_date}
                onChange={(e) => setFormData({ ...formData, required_by_date: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Supplier Price and Estimated Cost in one row - optimized widths */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-bold text-[#303A4D] mb-3">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Unit Price
              </label>
              <input
                type="text"
                value={formData.estimated_unit_price ? `GH₵${formData.estimated_unit_price}` : "Select product"}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#303A4D] cursor-not-allowed text-sm"
                readOnly
                disabled
              />
              <p className="text-xs text-[#303A4D]/60 mt-1">
                Set by supplier
              </p>
            </div>
            {formData.quantity_needed && formData.estimated_unit_price && (
              <div className="md:col-span-7 flex items-end">
                <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-900">Estimated Total:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      GH₵{calculateEstimatedCost()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-bold text-[#303A4D] mb-3">
              Special Requirements (Optional)
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[100px]"
              placeholder="Quality standards, packaging requirements, delivery instructions, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#303A4D] mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Create Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
