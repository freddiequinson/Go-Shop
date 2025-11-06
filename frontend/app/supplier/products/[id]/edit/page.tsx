"use client"

import { Button } from "@/components/ui/button"
import { Upload, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function EditSupplierProduct() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
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
  
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
    fetchProductDetails()
  }, [])

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/supplier/products/${params.id}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

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
        })
        setImages(product.images || [])
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive"
      })
    } finally {
      setFetching(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/categories/")
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        images: images
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/supplier/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully!"
        })
        router.push(`/supplier/products/${params.id}`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to update product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-[#F4F2E6] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/supplier/products/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#303A4D]">Edit Product</h1>
            <p className="text-[#303A4D]/70">Update your product details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Product Images</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-[#FED141] text-[#303A4D] text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FED141] transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Upload Images</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., Fresh Tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Describe your product..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">Select Category (Optional)</option>
                {organizeCategories().map(main => (
                  <optgroup key={main.id} label={main.name}>
                    {main.subcategories.length > 0 ? (
                      main.subcategories.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    ) : (
                      <option value={main.id}>{main.name}</option>
                    )}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Unit */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Pricing & Unit</h2>
            
            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                Unit Type *
              </label>
              <select
                required
                value={formData.unit_type}
                onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram</option>
                <option value="liter">Liter</option>
                <option value="piece">Piece</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Price per {formData.unit_type} *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Price per {formData.unit_type === 'piece' || formData.unit_type === 'pack' ? 'kg' : 'piece'} (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_quantity}
                  onChange={(e) => setFormData({...formData, price_per_quantity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#303A4D] mb-4">Stock Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Minimum Order Quantity *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_perishable"
                checked={formData.is_perishable}
                onChange={(e) => setFormData({...formData, is_perishable: e.target.checked})}
                className="w-4 h-4 text-[#FED141] border-gray-300 rounded focus:ring-[#FED141]"
              />
              <label htmlFor="is_perishable" className="text-sm font-medium text-[#303A4D]">
                This is a perishable product
              </label>
            </div>

            {formData.is_perishable && (
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Shelf Life (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.shelf_life_days}
                  onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., 7"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Link href={`/supplier/products/${params.id}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
            >
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
