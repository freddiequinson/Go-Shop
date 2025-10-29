"use client"

import { useEffect, useState } from "react"
import { Package, Plus, Search, Edit, Trash2, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number | string
  stock_quantity: number | string
  category_id: string
  is_active: boolean
  unit_type: string
  images?: string[]
}

export default function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return "0.00"
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return numPrice.toFixed(2)
  }

  const formatNumber = (num: number | string | undefined) => {
    if (!num) return 0
    return typeof num === 'string' ? parseFloat(num) : num
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/products?limit=100", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Products data:", data)
        // Handle different response formats
        if (Array.isArray(data)) {
          setProducts(data)
        } else if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        } else if (data.items && Array.isArray(data.items)) {
          setProducts(data.items)
        } else {
          setProducts([])
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/v1/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const activeProducts = products.filter(p => p.is_active)
  const lowStockProducts = products.filter(p => p.stock_quantity && formatNumber(p.stock_quantity) < 10)
  const outOfStockProducts = products.filter(p => formatNumber(p.stock_quantity) === 0)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Products</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your product inventory</p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                viewMode === 'card' ? 'bg-[#FED141] text-[#303A4D]' : 'text-[#303A4D]/60 hover:text-[#303A4D]'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#FED141] text-[#303A4D]' : 'text-[#303A4D]/60 hover:text-[#303A4D]'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <Link href="/admin/products/new">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors cursor-pointer">
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Products</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{products.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">Active</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{activeProducts.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[#303A4D]/60">Out of Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{outOfStockProducts.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
          />
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Link href={`/admin/products/${product.id}`} key={product.id}>
              <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#303A4D]/10 hover:border-[#FED141] transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="bg-[#FED141] p-3 rounded-2xl">
                      <Package className="w-6 h-6 text-[#303A4D]" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#303A4D]">{product.name}</h3>
                    <p className="text-sm text-[#303A4D]/60">{product.unit_type}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="text-[#303A4D]/70 mb-4 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#303A4D]/60">Price</p>
                  <p className="text-2xl font-bold text-[#303A4D]">GH₵{formatPrice(product.price_per_unit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#303A4D]/60">Stock</p>
                  <p className={`text-lg font-bold ${
                    formatNumber(product.stock_quantity) === 0 ? 'text-red-600' : 
                    formatNumber(product.stock_quantity) < 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatNumber(product.stock_quantity) || "Unlimited"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                  <button className="w-full bg-[#FED141]/20 hover:bg-[#FED141]/30 text-[#303A4D] rounded-full py-2 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </Link>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full py-2 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
            </Link>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4F2E6]">
                <tr>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Product</th>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Unit Type</th>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Price</th>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Stock</th>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Status</th>
                  <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#FED141] rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-[#303A4D]" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#303A4D]">{product.name}</p>
                          <p className="text-xs text-[#303A4D]/60">{product.description?.substring(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#303A4D]">{product.unit_type}</td>
                    <td className="py-4 px-6 font-bold text-[#303A4D]">GH₵{formatPrice(product.price_per_unit)}</td>
                    <td className="py-4 px-6 text-[#303A4D]">{formatNumber(product.stock_quantity) || "Unlimited"}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <button className="p-2 hover:bg-[#FED141]/20 rounded-full transition-colors cursor-pointer">
                            <Edit className="w-4 h-4 text-[#303A4D]" />
                          </button>
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center mt-6">
          <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-xl font-bold text-[#303A4D]">No Products Found</p>
          <p className="text-[#303A4D]/60">Try adjusting your search or add a new product</p>
        </div>
      )}
    </div>
  )
}
