"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Package, ArrowLeft, Edit, Trash2, TrendingUp, ShoppingCart, 
  DollarSign, AlertCircle, Calendar, User, Tag, Truck, BarChart3,
  Star, Clock, CheckCircle, XCircle
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ExpiryCountdown from "@/components/ExpiryCountdown"

interface Product {
  id: string
  name: string
  description: string
  price_cedis: number
  price_per_unit: number | string
  unit_type: string
  stock_quantity: number | string
  minimum_quantity: number | string
  category_id: string
  supplier_id?: string
  cost_price?: number | string
  is_perishable: boolean
  shelf_life_days?: number
  is_active: boolean
  images?: string[]
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  parent_id?: string
}

interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  company_name?: string
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoData, setPromoData] = useState({
    discount_percentage: "",
    free_delivery: false,
    promo_start: "",
    promo_end: ""
  })

  useEffect(() => {
    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      
      // Fetch product
      const productResponse = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (productResponse.ok) {
        const productData = await productResponse.json()
        console.log("Product data received:", productData)
        console.log("is_perishable value:", productData.is_perishable)
        setProduct(productData)
        
        // Fetch category if exists
        if (productData.category_id) {
          const categoryResponse = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/categories/${productData.category_id}/`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (categoryResponse.ok) {
            setCategory(await categoryResponse.json())
          }
        }
        
        // Fetch supplier if exists
        if (productData.supplier_id) {
          const supplierResponse = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${productData.supplier_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (supplierResponse.ok) {
            setSupplier(await supplierResponse.json())
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Redirect immediately after successful deletion
        window.location.href = "/admin/products"
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Delete failed:", errorData)
        alert("Failed to delete product")
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      alert("Error deleting product")
    }
  }

  const calculateProfitMargin = () => {
    if (!product?.cost_price || !product?.price_per_unit) return null
    const costPrice = typeof product.cost_price === 'string' ? parseFloat(product.cost_price) : product.cost_price
    const sellingPrice = typeof product.price_per_unit === 'string' ? parseFloat(product.price_per_unit) : product.price_per_unit
    const profit = sellingPrice - costPrice
    const margin = (profit / costPrice) * 100
    return { profit, margin }
  }

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return "0.00"
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return numPrice.toFixed(2)
  }

  const formatNumber = (num: number | string | undefined) => {
    if (!num) return 0
    return typeof num === 'string' ? parseFloat(num) : num
  }

  if (loading) {
    return <div className="p-8 text-center">Loading product details...</div>
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
        <p className="text-xl font-bold text-[#303A4D]">Product Not Found</p>
        <Link href="/admin/products">
          <Button className="mt-4 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
            Back to Products
          </Button>
        </Link>
      </div>
    )
  }

  const profitInfo = calculateProfitMargin()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/products" className="inline-flex items-center text-[#303A4D]/70 hover:text-[#303A4D] mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Products
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">{product.name}</h1>
            <p className="text-lg text-[#303A4D]/70">{product.description}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/admin/products/${productId}/edit`}>
              <Button className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
                <Edit className="w-5 h-5 mr-2" />
                Edit Product
              </Button>
            </Link>
            <Button 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Product Images</h2>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-2xl"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 right-2 bg-[#FED141] text-[#303A4D] px-2 py-1 rounded-full text-xs font-bold">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-[#F4F2E6] rounded-2xl">
                <Package className="w-12 h-12 text-[#303A4D]/40" />
              </div>
            )}
          </div>

          {/* Pricing & Stock Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Pricing & Stock</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-900/70">Selling Price</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  GH₵{formatPrice(product.price_per_unit)}
                </p>
                <p className="text-xs text-blue-900/60">per {product.unit_type}</p>
              </div>

              {product.cost_price && (
                <div className="bg-orange-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-orange-900/70">Cost Price</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    GH₵{formatPrice(product.cost_price)}
                  </p>
                  <p className="text-xs text-orange-900/60">per {product.unit_type}</p>
                </div>
              )}

              {profitInfo && (
                <div className="bg-green-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-900/70">Profit Margin</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {profitInfo.margin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-900/60">GH₵{formatPrice(profitInfo.profit)} profit</p>
                </div>
              )}

              <div className={`rounded-2xl p-4 ${
                formatNumber(product.stock_quantity) === 0 ? 'bg-red-50' :
                formatNumber(product.stock_quantity) < 10 ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className={`w-5 h-5 ${
                    formatNumber(product.stock_quantity) === 0 ? 'text-red-600' :
                    formatNumber(product.stock_quantity) < 10 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <span className={`text-sm ${
                    formatNumber(product.stock_quantity) === 0 ? 'text-red-900/70' :
                    formatNumber(product.stock_quantity) < 10 ? 'text-yellow-900/70' : 'text-green-900/70'
                  }`}>Stock</span>
                </div>
                <p className={`text-2xl font-bold ${
                  formatNumber(product.stock_quantity) === 0 ? 'text-red-900' :
                  formatNumber(product.stock_quantity) < 10 ? 'text-yellow-900' : 'text-green-900'
                }`}>
                  {formatNumber(product.stock_quantity)}
                </p>
                <p className={`text-xs ${
                  formatNumber(product.stock_quantity) === 0 ? 'text-red-900/60' :
                  formatNumber(product.stock_quantity) < 10 ? 'text-yellow-900/60' : 'text-green-900/60'
                }`}>
                  Min: {formatNumber(product.minimum_quantity)} {product.unit_type}
                </p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Product Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Category</p>
                  <p className="font-bold text-[#303A4D]">{category?.name || "Uncategorized"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Unit Type</p>
                  <p className="font-bold text-[#303A4D]">{product.unit_type}</p>
                </div>
              </div>

              {supplier && (
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Supplier</p>
                    <p className="font-bold text-[#303A4D]">{supplier.name}</p>
                    {supplier.contact_person && (
                      <p className="text-xs text-[#303A4D]/60">{supplier.contact_person}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                {product.is_perishable ? (
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                )}
                <div>
                  <p className="text-sm text-[#303A4D]/60">Perishable</p>
                  <p className="font-bold text-[#303A4D]">
                    {product.is_perishable ? "Yes" : "No"}
                  </p>
                  {product.is_perishable && product.shelf_life_days && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⏰ {product.shelf_life_days} days shelf life
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                {product.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-1" />
                )}
                <div>
                  <p className="text-sm text-[#303A4D]/60">Status</p>
                  <p className="font-bold text-[#303A4D]">
                    {product.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Created</p>
                  <p className="font-bold text-[#303A4D]">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Countdown for Perishable Products */}
          {product.is_perishable && product.shelf_life_days && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Expiry Countdown</h2>
              <ExpiryCountdown 
                createdAt={product.created_at} 
                shelfLifeDays={product.shelf_life_days} 
              />
            </div>
          )}

          {/* Supplier Information */}
          {supplier && (
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#303A4D]">Supplier Information</h2>
                <Link href={`/admin/suppliers/${supplier.id}`}>
                  <Button className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] text-sm">
                    View Supplier
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F4F2E6] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-[#303A4D]/60" />
                    <span className="text-sm text-[#303A4D]/60">Supplier Name</span>
                  </div>
                  <p className="font-bold text-[#303A4D]">{supplier.name}</p>
                  {supplier.company_name && (
                    <p className="text-xs text-[#303A4D]/60 mt-1">{supplier.company_name}</p>
                  )}
                </div>

                {supplier.contact_person && (
                  <div className="bg-[#F4F2E6] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-[#303A4D]/60" />
                      <span className="text-sm text-[#303A4D]/60">Contact Person</span>
                    </div>
                    <p className="font-bold text-[#303A4D]">{supplier.contact_person}</p>
                  </div>
                )}

                {supplier.phone && (
                  <div className="bg-[#F4F2E6] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-[#303A4D]/60">📞 Phone</span>
                    </div>
                    <p className="font-bold text-[#303A4D]">{supplier.phone}</p>
                  </div>
                )}

                {supplier.email && (
                  <div className="bg-[#F4F2E6] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-[#303A4D]/60">✉️ Email</span>
                    </div>
                    <p className="font-bold text-[#303A4D] text-sm break-all">{supplier.email}</p>
                  </div>
                )}

                {supplier.address && (
                  <div className="bg-[#F4F2E6] rounded-2xl p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-[#303A4D]/60">📍 Address</span>
                    </div>
                    <p className="font-bold text-[#303A4D]">{supplier.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Promo Section - Coming Soon */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 shadow-sm border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Promotions</h2>
                <p className="text-[#303A4D]/70">Create special offers for this product</p>
              </div>
              <Button 
                onClick={() => setShowPromoModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Star className="w-5 h-5 mr-2" />
                Create Promo
              </Button>
            </div>
            <div className="bg-white/50 rounded-2xl p-4 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-[#303A4D]/60">No active promotions</p>
            </div>
          </div>
        </div>

        {/* Right Column - Analytics & Quick Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#303A4D] mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-900">Total Sales</span>
                </div>
                <span className="font-bold text-blue-900">0</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-900">Revenue</span>
                </div>
                <span className="font-bold text-green-900">GH₵0.00</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-900">Rating</span>
                </div>
                <span className="font-bold text-purple-900">N/A</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-orange-900">Views</span>
                </div>
                <span className="font-bold text-orange-900">0</span>
              </div>
            </div>
          </div>

          {/* Analytics Placeholder */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#303A4D] mb-4">Sales Analytics</h3>
            <div className="flex items-center justify-center h-48 bg-[#F4F2E6] rounded-2xl">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-[#303A4D]/40 mx-auto mb-2" />
                <p className="text-sm text-[#303A4D]/60">Analytics coming soon</p>
              </div>
            </div>
          </div>

          {/* Recent Orders Placeholder */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#303A4D] mb-4">Recent Orders</h3>
            <div className="space-y-3">
              <div className="text-center py-8 text-[#303A4D]/60 text-sm">
                No orders yet
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Create Promotion</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Discount Percentage</label>
                <input
                  type="number"
                  value={promoData.discount_percentage}
                  onChange={(e) => setPromoData({ ...promoData, discount_percentage: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoData.free_delivery}
                    onChange={(e) => setPromoData({ ...promoData, free_delivery: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-[#303A4D]"
                  />
                  <span className="text-[#303A4D] font-medium">Free Delivery</span>
                </label>
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Start Date</label>
                <input
                  type="date"
                  value={promoData.promo_start}
                  onChange={(e) => setPromoData({ ...promoData, promo_start: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                />
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">End Date</label>
                <input
                  type="date"
                  value={promoData.promo_end}
                  onChange={(e) => setPromoData({ ...promoData, promo_end: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                />
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> Promotion feature is coming soon. This form is for demonstration purposes.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    alert("Promotion feature coming soon!")
                    setShowPromoModal(false)
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-3 font-bold"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
