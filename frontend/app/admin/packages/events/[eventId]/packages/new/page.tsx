"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Search, Package, Upload, X, PlusCircle } from "lucide-react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface Product {
  id: string
  name: string
  price: number
  unit: string
  image: string | null
  stock: number | null
}

interface SelectedItem {
  product_id: string
  product_name: string
  product_image: string | null
  product_price: number
  product_unit: string
  quantity: number
}

export default function NewPackagePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [noProductsFound, setNoProductsFound] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contents_description: "",  // What's included (for packages without linked products)
    image_url: "",
    package_price: "",
    stock_quantity: "",
    is_active: true,
    is_featured: true,
    show_savings: true,
    image_shape: "heart",
  })

  const shapeOptions = [
    { value: "heart", label: "Heart", icon: "❤️" },
    { value: "hexagons", label: "Grid Blocks", icon: "⬡" },
    { value: "pixels", label: "Pixel Grid", icon: "▦" },
    { value: "giftbox", label: "Gift Box", icon: "🎁" },
    { value: "star", label: "Star", icon: "⭐" },
    { value: "circle", label: "Circle", icon: "⬤" },
    { value: "diamond", label: "Diamond", icon: "◆" },
    { value: "flower", label: "Flower", icon: "🌸" },
    { value: "rounded", label: "Rounded Square", icon: "▢" },
  ]
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      setNoProductsFound(false)
      return
    }
    
    try {
      setSearching(true)
      setNoProductsFound(false)
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${getApiBaseUrl()}/packages/admin/available-products?search=${encodeURIComponent(query)}&limit=20`,
        { headers: { "Authorization": `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const data = await response.json()
        const productList = data.products || []
        setProducts(productList)
        setNoProductsFound(productList.length === 0 && query.trim().length > 0)
      }
    } catch (error) {
      console.error("Failed to search products:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const token = localStorage.getItem("access_token")
      
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        const response = await fetch(`${getApiBaseUrl()}/admin/upload-image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64,
            folder: "packages"
          })
        })

        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({ ...prev, image_url: data.url }))
        } else {
          setFormData(prev => ({ ...prev, image_url: base64 }))
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Upload failed:", err)
      setUploading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchProducts(searchTerm)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const addProduct = (product: Product) => {
    if (selectedItems.find(item => item.product_id === product.id)) {
      return
    }
    
    setSelectedItems([
      ...selectedItems,
      {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.price,
        product_unit: product.unit,
        quantity: 1,
      }
    ])
    setSearchTerm("")
    setProducts([])
    setShowProductSearch(false)
  }

  const removeProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ))
  }

  const calculateOriginalValue = () => {
    return selectedItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.name || !formData.package_price) {
      setError("Please fill in all required fields")
      return
    }

    // Either products OR contents_description is required
    if (selectedItems.length === 0 && !formData.contents_description?.trim()) {
      setError("Please add products OR provide a contents description")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/packages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: eventId,
          name: formData.name,
          description: formData.description || null,
          contents_description: formData.contents_description || null,
          image_url: formData.image_url || null,
          package_price: parseFloat(formData.package_price),
          original_value: calculateOriginalValue(),
          stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          show_savings: formData.show_savings,
          image_shape: formData.image_shape,
          items: selectedItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }))
        })
      })

      if (response.ok) {
        router.push(`/admin/packages/events/${eventId}`)
      } else {
        const errorData = await response.json()
        // Handle validation errors (422)
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map((err: { msg: string; loc: string[] }) => 
            `${err.loc?.join(' > ') || 'Field'}: ${err.msg}`
          ).join(', ')
          setError(messages)
        } else {
          setError(typeof errorData.detail === 'string' ? errorData.detail : "Failed to create package")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => price.toFixed(2)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/packages/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Package</h1>
        <p className="text-gray-500 mt-1">Add a new promotional package with products</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Package Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Romantic Dinner Package"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief marketing description of the package..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
          />
        </div>

        {/* Contents Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Contents
            <span className="text-gray-400 font-normal ml-2">(optional - use if not adding products below)</span>
          </label>
          <textarea
            value={formData.contents_description}
            onChange={(e) => setFormData({ ...formData, contents_description: e.target.value })}
            placeholder="e.g., 1x Bottle of Wine, 2x Chocolate Boxes, 1x Rose Bouquet, Romantic Dinner for 2..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe what's included in the package. Use this for packages that don't have products in our inventory.
          </p>
        </div>

        {/* Package Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="w-4 h-4 inline mr-2" />
            Package Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {formData.image_url ? (
            <div className="relative inline-block">
              <img
                src={formData.image_url}
                alt="Package"
                className="w-48 h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image_url: "" })}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Package Contents</h3>
            <button
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {/* Product Search */}
          {showProductSearch && (
            <div className="mb-4 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
                  autoFocus
                />
              </div>
              
              {/* Search Results */}
              {(products.length > 0 || searching || noProductsFound) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={selectedItems.some(item => item.product_id === product.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img 
                              src={product.image.startsWith('http') ? product.image : `${getApiBaseUrl()}${product.image}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">GH{formatPrice(product.price)} / {product.unit}</p>
                        </div>
                        {selectedItems.some(item => item.product_id === product.id) && (
                          <span className="text-xs text-green-600">Added</span>
                        )}
                      </button>
                    ))
                  ) : noProductsFound ? (
                    <div className="p-4">
                      <p className="text-gray-500 text-center mb-3">No products found for "{searchTerm}"</p>
                      <Link
                        href="/admin/products/new"
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Create New Product
                      </Link>
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Opens in new tab. Refresh search after creating.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Selected Products */}
          {selectedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No products added yet</p>
              <p className="text-sm">Click "Add Product" to search and add items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img 
                        src={item.product_image.startsWith('http') ? item.product_image : `${getApiBaseUrl()}${item.product_image}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-sm text-gray-500">GH{formatPrice(item.product_price)} / {item.product_unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                    />
                  </div>
                  <p className="font-medium text-gray-900 w-24 text-right">
                    GH{formatPrice(item.product_price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeProduct(item.product_id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-700">Original Value:</span>
                <span className="font-semibold text-gray-900">GH{formatPrice(calculateOriginalValue())}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Price (GH) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.package_price}
              onChange={(e) => setFormData({ ...formData, package_price: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
              required
            />
            {formData.package_price && calculateOriginalValue() > parseFloat(formData.package_price) && (
              <p className="text-sm text-green-600 mt-1">
                Savings: GH{formatPrice(calculateOriginalValue() - parseFloat(formData.package_price))}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              placeholder="Unlimited"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
          </div>
        </div>

        {/* Image Shape Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Shape
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {shapeOptions.map((shape) => (
              <button
                key={shape.value}
                type="button"
                onClick={() => setFormData({ ...formData, image_shape: shape.value })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  formData.image_shape === shape.value
                    ? "border-[#93C90F] bg-[#93C90F]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{shape.icon}</span>
                <span className="text-xs text-gray-600">{shape.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Select the shape for displaying the package image on landing/shop pages</p>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[#93C90F] rounded focus:ring-[#93C90F]"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-[#93C90F] rounded focus:ring-[#93C90F]"
            />
            <span className="text-sm text-gray-700">Featured on homepage</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.show_savings}
              onChange={(e) => setFormData({ ...formData, show_savings: e.target.checked })}
              className="w-4 h-4 text-[#93C90F] rounded focus:ring-[#93C90F]"
            />
            <span className="text-sm text-gray-700">Show savings on landing/shop pages</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Package"}
          </button>
          <Link
            href={`/admin/packages/events/${eventId}`}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
