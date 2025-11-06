"use client"

import { Button } from "@/components/ui/button"
import { Upload, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import ProductSearchInput from "@/components/products/ProductSearchInput"

export default function NewSupplierProduct() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [mode, setMode] = useState<"search" | "form">("search")
  
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
  })
  
  const [referenceImages, setReferenceImages] = useState<string[]>([]) // Admin's reference photos
  const [supplierImages, setSupplierImages] = useState<string[]>([]) // Supplier's own photos
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/products/categories/`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const organizeCategories = () => {
    const mainCategories = categories.filter(c => !c.parent_id)
    return mainCategories.map(main => ({
      ...main,
      subcategories: categories.filter(c => c.parent_id === main.id)
    }))
  }

  const handleSelectProduct = (product: any) => {
    // Pre-fill form with selected product details
    setFormData({
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      price_per_unit: "", // Supplier sets their own price
      price_per_quantity: "",
      unit_type: product.unit_type || "kg",
      stock_quantity: "", // Supplier sets their own stock
      minimum_quantity: "1",
      is_perishable: product.is_perishable || false,
      shelf_life_days: product.shelf_life_days?.toString() || "",
    })
    
    // Set admin's reference photos (read-only)
    if (product.images && product.images.length > 0) {
      setReferenceImages(product.images)
    } else {
      setReferenceImages([])
    }
    
    // Clear supplier's photos (they need to upload their own)
    setSupplierImages([])
    
    setMode("form")
    
    toast({
      title: "Product Selected",
      description: `${product.name} details loaded. Upload your product photos and set your pricing.`,
    })
  }

  const handleCreateNew = () => {
    setMode("form")
    toast({
      title: "Create New Product",
      description: "Fill in the product details below",
    })
  }

  const handleSupplierImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSupplierImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeSupplierImage = (index: number) => {
    setSupplierImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate supplier images
    if (supplierImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one photo of your product",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      
      const productData = {
        ...formData,
        price_per_unit: parseFloat(formData.price_per_unit),
        price_per_quantity: formData.price_per_quantity ? parseFloat(formData.price_per_quantity) : null,
        stock_quantity: parseFloat(formData.stock_quantity),
        minimum_quantity: parseFloat(formData.minimum_quantity),
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
        images: supplierImages  // Use supplier's photos
      }

      const response = await fetch(`${getApiBaseUrl()}/supplier/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product added to your catalog successfully"
        })
        router.push("/supplier/products")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to create product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 bg-[#F4F2E6] min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/supplier/products">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#303A4D]">Add Product to Catalog</h1>
            <p className="text-[#303A4D]/70 mt-1">
              Search existing products or create a new one
            </p>
          </div>
        </div>

        {/* Product Search Section */}
        {mode === "search" && (
          <div className="bg-white rounded-2xl p-6 md:p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Search Existing Products</h2>
              <p className="text-[#303A4D]/70">
                Check if the product already exists to avoid duplicates. Select an existing product to pre-fill details.
              </p>
            </div>
            
            <ProductSearchInput
              onSelectProduct={handleSelectProduct}
              onCreateNew={handleCreateNew}
              placeholder="Search by product name, SKU, or barcode..."
              autoFocus
            />
          </div>
        )}

        {/* Form */}
        {mode === "form" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-900">
                  Want to search for an existing product instead?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("search")}
                  className="text-blue-700 border-blue-300"
                >
                  Back to Search
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 space-y-6">
          {/* Reference Photos (Admin's) - Read Only */}
          {referenceImages.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-[#303A4D] mb-2 flex items-center gap-2">
                📸 Reference Photos (Set by Admin)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                These are the standard product photos. Use these as a guide for your own photos.
              </p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {referenceImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-blue-300"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Supplier's Product Photos - Upload Required */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2 flex items-center gap-2">
              📷 Your Product Photos *
              <span className="text-red-500">Required</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Upload photos of YOUR actual product. Admin will review these for quality verification. At least 1 photo required.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {supplierImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={image}
                    alt={`Your Product ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-[#FED141]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSupplierImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {supplierImages.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-[#FED141] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#FED141] hover:bg-[#FED141]/10 transition-colors">
                  <Upload className="w-8 h-8 text-[#FED141] mb-2" />
                  <span className="text-sm text-[#303A4D] font-medium">Upload Photo</span>
                  <span className="text-xs text-gray-500 mt-1">{supplierImages.length}/5</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSupplierImageUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
            {supplierImages.length === 0 && (
              <p className="text-sm text-red-500 mt-2">⚠️ Please upload at least one photo of your product</p>
            )}
          </div>

          {/* Basic Information */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Product Name *</label>
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
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[120px]"
              placeholder="Describe your product..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="">Select Category (Optional)</option>
              {organizeCategories().map((parent: any) => (
                <optgroup key={parent.id} label={parent.name}>
                  {parent.subcategories && parent.subcategories.length > 0 ? (
                    parent.subcategories.map((sub: any) => (
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

          {/* Unit Type */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Unit Type *</label>
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

          {/* Pricing */}
          <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#303A4D]">Pricing</h3>
            
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Price per {formData.unit_type} (GH₵) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., 5.00"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., GH₵5.00 per kg - Customer buying 2kg pays GH₵10.00'}
                {formData.unit_type === 'gram' && 'e.g., GH₵0.05 per gram - Customer buying 500g pays GH₵25.00'}
                {formData.unit_type === 'liter' && 'e.g., GH₵3.00 per liter - Customer buying 2L pays GH₵6.00'}
                {formData.unit_type === 'piece' && 'e.g., GH₵2.00 per piece - Customer buying 5 pieces pays GH₵10.00'}
                {formData.unit_type === 'pack' && 'e.g., GH₵15.00 per pack - Customer buying 3 packs pays GH₵45.00'}
              </p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
              <label className="block text-[#303A4D] font-bold mb-3">
                {(formData.unit_type === 'piece' || formData.unit_type === 'pack') 
                  ? 'Price per kg (GH₵) - Optional'
                  : 'Price per Piece/Unit (GH₵) - Optional'
                }
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
                {(formData.unit_type === 'piece' || formData.unit_type === 'pack')
                  ? '💡 Set this if customers can also buy by weight (kg). Example: Tomatoes at GH₵2/piece OR GH₵8/kg'
                  : '💡 Set this if customers can also buy by individual pieces/units. Example: Rice at GH₵8/kg OR GH₵2/pack'
                }
              </p>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Stock Quantity ({formData.unit_type}) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., 100"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., 100 (means 100kg in stock)'}
                {formData.unit_type === 'gram' && 'e.g., 5000 (means 5000 grams in stock)'}
                {formData.unit_type === 'liter' && 'e.g., 50 (means 50 liters in stock)'}
                {formData.unit_type === 'piece' && 'e.g., 200 (means 200 pieces in stock)'}
                {formData.unit_type === 'pack' && 'e.g., 50 (means 50 packs in stock)'}
              </p>
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Minimum Order ({formData.unit_type}) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minimum_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., 1"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., 0.5 (customers must buy at least 0.5kg)'}
                {formData.unit_type === 'gram' && 'e.g., 100 (customers must buy at least 100g)'}
                {formData.unit_type === 'liter' && 'e.g., 0.5 (customers must buy at least 0.5L)'}
                {formData.unit_type === 'piece' && 'e.g., 1 (customers must buy at least 1 piece)'}
                {formData.unit_type === 'pack' && 'e.g., 1 (customers must buy at least 1 pack)'}
              </p>
            </div>
          </div>

          {/* Perishable */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_perishable"
              checked={formData.is_perishable}
              onChange={(e) => setFormData({ ...formData, is_perishable: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-[#FED141] focus:ring-[#FED141]"
            />
            <label htmlFor="is_perishable" className="text-[#303A4D] font-medium">
              This product is perishable
            </label>
          </div>

          {formData.is_perishable && (
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Shelf Life (days)
              </label>
              <input
                type="number"
                value={formData.shelf_life_days}
                onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., 7"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Link href="/supplier/products" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl py-6 text-lg"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-2xl py-6 text-lg font-bold"
            >
              {loading ? "Adding Product..." : "Add to Catalog"}
            </Button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  )
}
