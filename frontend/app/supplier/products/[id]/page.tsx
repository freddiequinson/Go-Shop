"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Package, Edit, Trash2, Power, PowerOff, 
  ShoppingCart, TrendingUp, AlertCircle, CheckCircle, Clock, Plus, Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number
  price_per_quantity: number | null
  unit_type: string
  stock_quantity: number | null
  minimum_quantity: number
  is_active: boolean
  is_perishable: boolean
  shelf_life_days: number | null
  primary_image_url: string | null
  images: string[]
  category_name: string | null
  created_at: string
  in_warehouse: boolean
  is_published: boolean
}

interface SupplyRequest {
  id: string
  request_number: string
  product_name: string
  quantity_needed: number
  unit_type: string
  status: string
  created_at: string
  deadline: string | null
}

export default function SupplierProductDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAction, setStockAction] = useState<'add' | 'reduce'>('add')
  const [stockAmount, setStockAmount] = useState('')
  const [stockReason, setStockReason] = useState('')

  useEffect(() => {
    fetchProductDetails()
    fetchSupplyRequests()
  }, [params.id])

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supplier/products/${params.id}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplyRequests = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supplier/requests?product_id=${params.id}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSupplyRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch supply requests:", error)
    }
  }

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supplier/products/${params.id}/toggle-status`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product status updated"
        })
        fetchProductDetails()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/supplier/products/${params.id}`,
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully"
        })
        router.push("/supplier/products")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  const handleStockUpdate = async () => {
    if (!stockAmount || parseFloat(stockAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    if (stockAction === 'reduce' && !stockReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reducing stock",
        variant: "destructive"
      })
      return
    }

    const currentStock = parseFloat(product?.stock_quantity?.toString() || '0')
    const amount = parseFloat(stockAmount)
    const newStock = stockAction === 'add' ? currentStock + amount : Math.max(0, currentStock - amount)

    try {
      const token = localStorage.getItem("access_token")
      
      // Build URL with reason parameter
      let url = `http://localhost:8000/api/v1/supplier/products/${params.id}/stock?stock_quantity=${newStock}`
      if (stockReason.trim()) {
        url += `&reason=${encodeURIComponent(stockReason)}`
      }
      url += `&action=${stockAction}`
      
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Stock ${stockAction === 'add' ? 'increased' : 'reduced'} successfully`
        })
        setShowStockModal(false)
        setStockAmount('')
        setStockReason('')
        fetchProductDetails()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to update stock",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Product Not Found</h2>
          <p className="text-[#303A4D]/70 mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/supplier/products">
            <Button className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90">
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      approved: { color: "bg-blue-100 text-blue-700", label: "Approved" },
      completed: { color: "bg-green-100 text-green-700", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
    }
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="p-4 md:p-8 bg-[#F4F2E6] min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/supplier/products">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#303A4D]">{product.name}</h1>
              <p className="text-[#303A4D]/70">Product Details</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/supplier/products/${product.id}/edit`}>
              <Button className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              className={product.is_active ? "text-orange-600" : "text-green-600"}
            >
              {product.is_active ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4">Product Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-[#FED141] text-[#303A4D]">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </Card>

            {/* Product Details */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4">Product Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#303A4D]/60">Description</label>
                  <p className="text-[#303A4D] mt-1">
                    {product.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#303A4D]/60">Price per {product.unit_type}</label>
                    <p className="text-2xl font-bold text-[#303A4D] mt-1">
                      GH₵{Number(product.price_per_unit).toFixed(2)}
                    </p>
                  </div>
                  {product.price_per_quantity && (
                    <div>
                      <label className="text-sm text-[#303A4D]/60">
                        {product.unit_type === 'piece' || product.unit_type === 'pack' 
                          ? 'Price per kg' 
                          : 'Price per piece'}
                      </label>
                      <p className="text-2xl font-bold text-[#303A4D] mt-1">
                        GH₵{Number(product.price_per_quantity).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#303A4D]/60">Stock Quantity</label>
                    <p className="font-bold text-[#303A4D] mt-1">
                      {product.stock_quantity} {product.unit_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-[#303A4D]/60">Minimum Order</label>
                    <p className="font-bold text-[#303A4D] mt-1">
                      {product.minimum_quantity} {product.unit_type}
                    </p>
                  </div>
                </div>

                {product.is_perishable && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="font-bold text-orange-900">Perishable Product</span>
                    </div>
                    {product.shelf_life_days && (
                      <p className="text-sm text-orange-700 mt-1">
                        Shelf Life: {product.shelf_life_days} days
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Supply Requests */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#303A4D]">Supply Requests</h2>
                <Badge>{supplyRequests.length}</Badge>
              </div>

              {supplyRequests.length === 0 ? (
                <div className="text-center py-8 text-[#303A4D]/60">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-[#303A4D]/20" />
                  <p>No supply requests for this product yet</p>
                  <p className="text-sm mt-2">Admin will create requests when they need this product</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplyRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-[#F4F2E6] rounded-lg p-4 hover:border-[#FED141] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#303A4D]">{request.request_number}</p>
                          <p className="text-sm text-[#303A4D]/60">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#303A4D]/60">Quantity Needed:</span>
                        <span className="font-bold text-[#303A4D]">
                          {request.quantity_needed} {request.unit_type}
                        </span>
                      </div>
                      {request.deadline && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                          <Clock className="w-4 h-4" />
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <Link href={`/supplier/requests`}>
                        <Button size="sm" className="w-full mt-3 bg-[#FED141] text-[#303A4D]">
                          View All Requests
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Stock Management & Stats */}
          <div className="space-y-6">
            {/* Stock Management Card */}
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold text-[#303A4D] mb-4">Stock Management</h2>
              <div className="space-y-4">
                <div className="text-center p-4 bg-[#F4F2E6] rounded-lg">
                  <p className="text-sm text-[#303A4D]/60 mb-1">Current Stock</p>
                  <p className="text-3xl font-bold text-[#303A4D]">
                    {product.stock_quantity} {product.unit_type}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setStockAction('add')
                      setShowStockModal(true)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button
                    onClick={() => {
                      setStockAction('reduce')
                      setShowStockModal(true)
                    }}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Reduce
                  </Button>
                </div>
              </div>
            </Card>

            {/* Category */}
            {product.category_name && (
              <Card className="p-6 bg-white">
                <h2 className="text-lg font-bold text-[#303A4D] mb-4">Category</h2>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {product.category_name}
                </Badge>
              </Card>
            )}

            {/* Created Date */}
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold text-[#303A4D] mb-4">Created</h2>
              <p className="text-[#303A4D]">
                {new Date(product.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </Card>
          </div>
        </div>

        {/* Stock Update Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 bg-white m-4">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4">
                {stockAction === 'add' ? 'Add Stock' : 'Reduce Stock'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#303A4D]/60 mb-2 block">
                    Current Stock: {product.stock_quantity} {product.unit_type}
                  </label>
                  <input
                    type="number"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                    placeholder={`Enter amount to ${stockAction}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#303A4D]/60 mb-2 block">
                    Reason {stockAction === 'reduce' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    placeholder={stockAction === 'add' ? 'e.g., New harvest, Restocked from farm' : 'e.g., Damaged goods, Sold locally, Expired'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141] resize-none"
                    rows={3}
                    required={stockAction === 'reduce'}
                  />
                </div>

                {stockAmount && (
                  <div className="p-3 bg-[#F4F2E6] rounded-lg">
                    <p className="text-sm text-[#303A4D]/60">New Stock:</p>
                    <p className="text-xl font-bold text-[#303A4D]">
                      {(() => {
                        const currentStock = parseFloat(product.stock_quantity?.toString() || '0')
                        const amount = parseFloat(stockAmount)
                        const newStock = stockAction === 'add' 
                          ? currentStock + amount
                          : Math.max(0, currentStock - amount)
                        return newStock.toFixed(2)
                      })()} {product.unit_type}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowStockModal(false)
                      setStockAmount('')
                      setStockReason('')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStockUpdate}
                    className={`flex-1 ${stockAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                  >
                    {stockAction === 'add' ? 'Add' : 'Reduce'} Stock
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
