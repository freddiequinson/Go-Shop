"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Package, Plus, X, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price_per_unit: "",
    price_per_quantity: "",
    unit_type: "kg",
    stock_quantity: "",
    minimum_quantity: "1",
    is_perishable: false,
    shelf_life_days: "",
    cost_price: "",
    supplier_id: "",
  })

  interface Category {
    id: string
    name: string
    description?: string
    parent_id?: string | null
    subcategories?: Category[]
  }

  useEffect(() => {
    if (productId) {
      fetchProductData()
      fetchSuppliers()
      fetchCategories()
    }
  }, [productId])

  const fetchProductData = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const product = await response.json()
        setFormData({
          name: product.name || "",
          description: product.description || "",
          category_id: product.category_id || "",
          price_per_unit: product.price_per_unit?.toString() || "",
          price_per_quantity: product.price_per_quantity?.toString() || "",
          unit_type: product.unit_type || "kg",
          stock_quantity: product.stock_quantity?.toString() || "",
          minimum_quantity: product.minimum_quantity?.toString() || "1",
          is_perishable: product.is_perishable || false,
          shelf_life_days: product.shelf_life_days?.toString() || "",
          cost_price: product.cost_price?.toString() || "",
          supplier_id: product.supplier_id || "",
        })
        setImages(product.images || [])
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/categories/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const organizeCategories = () => {
    const mainCategories = categories.filter(c => !c.parent_id)
    return mainCategories.map(main => ({
      ...main,
      subcategories: categories.filter(sub => sub.parent_id === main.id)
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1)
    }
  }

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.cost_price)
    const price = parseFloat(formData.price_per_unit)
    if (cost && price && cost > 0) {
      const profit = price - cost
      const margin = (profit / cost) * 100
      return { profit, margin }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem("access_token")
      
      const payload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
        price_per_unit: parseFloat(formData.price_per_unit),
        price_per_quantity: formData.price_per_quantity ? parseFloat(formData.price_per_quantity) : null,
        unit_type: formData.unit_type,
        minimum_quantity: parseFloat(formData.minimum_quantity),
        stock_quantity: formData.stock_quantity ? parseFloat(formData.stock_quantity) : null,
        images: images.length > 0 ? [images[primaryImageIndex], ...images.filter((_, i) => i !== primaryImageIndex)] : [],
        supplier_id: formData.supplier_id || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        is_perishable: formData.is_perishable,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
      }
      
      console.log("Updating product:", payload)
      
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push(`/admin/products/${productId}`)
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        alert(`Failed to update product: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert("Error updating product")
    } finally {
      setSubmitting(false)
    }
  }

  const profitInfo = calculateProfitMargin()

  if (loading) {
    return <div className="p-8 text-center">Loading product...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/admin/products/${productId}`} className="inline-flex items-center text-[#303A4D]/70 hover:text-[#303A4D] mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Product
        </Link>
        <h1 className="text-5xl font-bold text-[#303A4D] mb-4">Edit Product</h1>
        <p className="text-xl text-[#303A4D]/70">Update product information</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="space-y-6">
          {/* Product Images */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Product Images</label>
            <p className="text-sm text-[#303A4D]/60 mb-3">Click the star to set primary image</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setPrimaryImageIndex(index)}
                    className={`absolute top-2 left-2 p-1 rounded-full ${
                      primaryImageIndex === index ? 'bg-[#FED141]' : 'bg-white/80'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${primaryImageIndex === index ? 'fill-[#303A4D] text-[#303A4D]' : 'text-[#303A4D]/40'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <label className="border-2 border-dashed border-[#FED141] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#FED141]/5 transition-colors h-32">
                <Plus className="w-8 h-8 text-[#FED141] mb-2" />
                <span className="text-sm text-[#303A4D]/60">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., Fresh Tomatoes"
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-32"
              placeholder="Describe your product..."
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="">Select Category (Optional)</option>
              {organizeCategories().map((parent: Category) => (
                <optgroup key={parent.id} label={parent.name}>
                  {parent.subcategories && parent.subcategories.length > 0 ? (
                    parent.subcategories.map((sub: Category) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))
                  ) : (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Unit Type</label>
            <select
              value={formData.unit_type}
              onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="piece">Piece</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          {/* Supplier Information */}
          <div className="bg-[#FED141]/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#303A4D]">Supplier Information (Optional)</h3>
            
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Cost Price per {formData.unit_type} (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="What you pay the supplier"
              />
            </div>
          </div>

          {/* Selling Price */}
          <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#303A4D]">Selling Price</h3>
            
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Price per {formData.unit_type} (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., 5.00"
                required
              />
            </div>

            {profitInfo && (
              <div className="bg-green-100 rounded-2xl p-4">
                <p className="text-green-900 font-bold">
                  Profit Margin: GH₵{profitInfo.profit.toFixed(2)} per {formData.unit_type} ({profitInfo.margin.toFixed(1)}%)
                </p>
              </div>
            )}

            {/* Optional: Price per Quantity (Piece) */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
              <label className="block text-[#303A4D] font-bold mb-3">
                Price per Piece/Unit (GH₵) - Optional
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_quantity}
                onChange={(e) => setFormData({ ...formData, price_per_quantity: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="e.g., 2.50"
              />
              <p className="text-sm text-purple-900/70 mt-2">
                💡 Set this if customers can also buy by individual pieces/units. Leave empty if only sold by weight/volume.
                Example: Rice at GH₵8/kg OR GH₵2/pack
              </p>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Stock Quantity ({formData.unit_type})</label>
            <input
              type="number"
              step="0.01"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Minimum Order Quantity ({formData.unit_type})</label>
            <input
              type="number"
              step="0.01"
              value={formData.minimum_quantity}
              onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_perishable}
                onChange={(e) => setFormData({ ...formData, is_perishable: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#303A4D]"
              />
              <span className="text-[#303A4D] font-medium">This product is perishable</span>
            </label>
          </div>

          {/* Shelf Life for Perishable Products */}
          {formData.is_perishable && (
            <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
              <label className="block text-[#303A4D] font-bold mb-3">
                ⏰ Shelf Life (Days)
              </label>
              <input
                type="number"
                value={formData.shelf_life_days}
                onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g., 7 for 7 days"
              />
              <p className="text-sm text-orange-900/70 mt-2">
                💡 Set how many days this product stays fresh. You'll be alerted when products are nearing expiry.
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-4 text-lg font-bold disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Product"}
            </Button>
            <Link href={`/admin/products/${productId}`} className="flex-1">
              <Button
                type="button"
                className="w-full bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-4 text-lg font-bold border-2 border-[#303A4D]"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
