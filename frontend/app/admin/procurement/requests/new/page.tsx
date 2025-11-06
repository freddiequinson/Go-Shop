"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, Package, Calendar, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

function NewSupplyRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get pre-fill data from query parameters
  const productIdParam = searchParams.get("product_id")
  const productNameParam = searchParams.get("product_name")
  const quantityParam = searchParams.get("quantity")
  const urgencyParam = searchParams.get("urgency")

  const [formData, setFormData] = useState({
    product_id: productIdParam || "",
    product_name: productNameParam || "",
    quantity_needed: quantityParam || "",
    unit_type: "kg",
    required_by_date: "",
    urgency_level: urgencyParam || "medium",
    description: "",
    budget_per_unit: "",
    is_open_request: true,
    target_categories: [] as string[],
    supplier_id: ""
  })

  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()
    
    // Set default required date to 7 days from now
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 7)
    setFormData(prev => ({
      ...prev,
      required_by_date: defaultDate.toISOString().split('T')[0]
    }))
  }, [])

  useEffect(() => {
    // When product is selected, fetch its details
    if (formData.product_id && !formData.unit_type) {
      fetchProductDetails(formData.product_id)
    }
  }, [formData.product_id])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products?limit=1000`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const productList = Array.isArray(data) ? data : (data.items || [])
        setProducts(productList)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchProductDetails = async (productId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const product = await response.json()
        setFormData(prev => ({
          ...prev,
          unit_type: product.unit_type || "kg",
          product_name: product.name
        }))
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error)
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
        setSuppliers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      
      const payload = {
        product_id: formData.product_id || null,
        product_name: formData.product_name,
        quantity_needed: parseFloat(formData.quantity_needed),
        unit_type: formData.unit_type,
        required_by_date: formData.required_by_date,
        urgency_level: formData.urgency_level,
        description: formData.description || null,
        budget_per_unit: formData.budget_per_unit ? parseFloat(formData.budget_per_unit) : null,
        is_open_request: formData.is_open_request,
        target_categories: formData.is_open_request ? formData.target_categories : [],
        supplier_id: !formData.is_open_request && formData.supplier_id ? formData.supplier_id : null
      }

      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-requests/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Supply request created successfully! Request #${data.request_number}`)
        router.push("/admin/procurement/requests")
      } else {
        const error = await response.json()
        alert(`Failed to create supply request: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error("Error creating supply request:", error)
      alert("Error creating supply request")
    } finally {
      setLoading(false)
    }
  }

  const supplierCategories = [
    "fruits", "vegetables", "meat", "poultry", "seafood", "dairy",
    "grains", "beverages", "packaged_goods", "spices", "bakery",
    "frozen_foods", "snacks", "condiments", "oil_fats", "other"
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <Link href="/admin/procurement/requests" className="inline-flex items-center gap-2 text-[#303A4D] hover:text-[#FED141] mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Supply Requests</span>
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-2">Create Supply Request</h1>
        <p className="text-base md:text-lg text-[#303A4D]/70">
          Request products from suppliers or post to the marketplace
        </p>
      </div>

      {/* Info Box */}
      {(productNameParam || productIdParam) && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Pre-filled from Smart Restock</p>
              <p>This form has been pre-filled with product information. Review and adjust as needed.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Request Type */}
        <div>
          <label className="block text-[#303A4D] font-bold mb-3">Request Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_open_request: true, supplier_id: "" })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.is_open_request
                  ? 'border-[#FED141] bg-[#FED141]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-bold text-[#303A4D] mb-1">Open Marketplace Request</h3>
              <p className="text-sm text-[#303A4D]/70">Post to marketplace, all suppliers can bid</p>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_open_request: false, target_categories: [] })}
              className={`p-4 rounded-xl border-2 transition-all ${
                !formData.is_open_request
                  ? 'border-[#FED141] bg-[#FED141]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-bold text-[#303A4D] mb-1">Direct Supplier Request</h3>
              <p className="text-sm text-[#303A4D]/70">Send to specific supplier only</p>
            </button>
          </div>
        </div>

        {/* Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => {
                const selectedProduct = products.find(p => p.id === e.target.value)
                setFormData({
                  ...formData,
                  product_id: e.target.value,
                  product_name: selectedProduct?.name || "",
                  unit_type: selectedProduct?.unit_type || "kg"
                })
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.unit_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Or Enter Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value, product_id: "" })}
              placeholder="e.g., Fresh Tomatoes"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Quantity Needed <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity_needed}
              onChange={(e) => setFormData({ ...formData, quantity_needed: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Unit Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit_type}
              onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="piece">Piece</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Budget per Unit (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.budget_per_unit}
              onChange={(e) => setFormData({ ...formData, budget_per_unit: e.target.value })}
              placeholder="GH₵"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
            />
          </div>
        </div>

        {/* Date and Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Required By Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.required_by_date}
              onChange={(e) => setFormData({ ...formData, required_by_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Urgency Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.urgency_level}
              onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required
            >
              <option value="low">Low - Can wait</option>
              <option value="medium">Medium - Normal priority</option>
              <option value="high">High - Urgent</option>
            </select>
          </div>
        </div>

        {/* Conditional Fields */}
        {formData.is_open_request ? (
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Target Supplier Categories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {supplierCategories.map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.target_categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          target_categories: [...formData.target_categories, category]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          target_categories: formData.target_categories.filter(c => c !== category)
                        })
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#303A4D] capitalize">{category.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Select Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              required={!formData.is_open_request}
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.supplier_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-[#303A4D] font-bold mb-2">
            Additional Requirements (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Any specific requirements, quality standards, packaging needs, etc."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-lg font-bold hover:bg-[#FED141]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {loading ? "Creating..." : "Create Supply Request"}
          </button>
          
          <Link href="/admin/procurement/requests" className="flex-1">
            <button
              type="button"
              className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-[#303A4D] rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function NewSupplyRequestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NewSupplyRequestForm />
    </Suspense>
  )
}
