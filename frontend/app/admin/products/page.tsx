"use client"

import { useEffect, useState } from "react"
import { Package, Plus, Search, Edit, Trash2, LayoutGrid, List, Warehouse } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number | string
  stock_quantity: number | string
  category_id: string
  is_active: boolean
  is_published: boolean
  unit_type: string
  images?: string[]
}

export default function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [stats, setStats] = useState({ active: 0, published: 0, lowStock: 0, outOfStock: 0 })
  const perPage = 20

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return "0.00"
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return numPrice.toFixed(2)
  }

  const formatNumber = (num: number | string | undefined) => {
    if (!num) return 0
    return typeof num === 'string' ? parseFloat(num) : num
  }

  // Debounce search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [currentPage, debouncedSearchTerm])

  useEffect(() => {
    fetchStats()
  }, [])

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (currentPage !== 1 && debouncedSearchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      // Admin sees all products (admin-created and supplier products that are in warehouse)
      let url = `${getApiBaseUrl()}/products?page=${currentPage}&per_page=${perPage}`
      
      // Add search query if exists (using debounced value)
      if (debouncedSearchTerm.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`
      }
      
      const response = await fetch(url, {
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
          setTotalPages(data.pages || 1)
          setTotalProducts(data.total || data.products.length)
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
      const response = await fetch(`${getApiBaseUrl()}/products/${productId}`, {
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

  const togglePublish = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("access_token")
      const endpoint = currentStatus ? "unpublish" : "publish"
      const response = await fetch(`${getApiBaseUrl()}/products/${productId}/${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error("Failed to toggle publish status:", error)
    }
  }

  // Filter by publish status only (search is handled by backend)
  const filteredProducts = products.filter(product => {
    const matchesPublish = publishFilter === 'all' || 
      (publishFilter === 'published' && product.is_published) ||
      (publishFilter === 'unpublished' && !product.is_published)
    return matchesPublish
  })

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token")
      let allProducts: any[] = []
      let currentPage = 1
      let totalPages = 1
      
      // Fetch all products in batches (max 100 per page)
      while (currentPage <= totalPages) {
        const response = await fetch(`${getApiBaseUrl()}/products?page=${currentPage}&per_page=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const products = Array.isArray(data) ? data : data.products || []
          allProducts = [...allProducts, ...products]
          
          // Update total pages from first response
          if (currentPage === 1 && data.pages) {
            totalPages = data.pages
          }
          
          currentPage++
        } else {
          break
        }
      }
      
      // Calculate stats from all products
      setStats({
        active: allProducts.filter((p: any) => p.is_active).length,
        published: allProducts.filter((p: any) => p.is_published).length,
        lowStock: allProducts.filter((p: any) => p.stock_quantity && formatNumber(p.stock_quantity) < 10).length,
        outOfStock: allProducts.filter((p: any) => formatNumber(p.stock_quantity) === 0).length
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="products-header"]',
      title: 'Product Management',
      description: 'This page shows all products you\'ve created as admin. Supplier products are managed in the Suppliers section and flow through procurement to warehouse.',
      position: 'bottom'
    },
    {
      target: '[data-tour="products-stats"]',
      title: 'Product Statistics',
      description: 'Quick overview of your product inventory: total products, active products, published to shop, low stock alerts, and out of stock items.',
      position: 'bottom'
    },
    {
      target: '[data-tour="add-product"]',
      title: 'Add New Product',
      description: 'Click here to create a new product. You\'ll add images, set pricing, configure stock levels, and link to suppliers for cost tracking.',
      position: 'left'
    },
    {
      target: '[data-tour="view-toggle"]',
      title: 'View Modes',
      description: 'Switch between card view (visual grid) and table view (detailed list). Choose what works best for you!',
      position: 'left'
    },
    {
      target: '[data-tour="search-filter"]',
      title: 'Search & Filter',
      description: 'Search products by name and filter by publish status. Find exactly what you need quickly.',
      position: 'bottom'
    },
    {
      target: '[data-tour="publish-status"]',
      title: 'Publishing to Shop',
      description: 'Products must be PUBLISHED to appear in the customer shop. Unpublished products are drafts. Toggle publish status with one click.',
      position: 'top'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="products" steps={tourSteps} />
      <div>
      <div data-tour="products-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Admin Products</h1>
          <p className="text-lg text-[#303A4D]/70">Manage products created by admin (Supplier products are in Suppliers section)</p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div data-tour="view-toggle" className="flex bg-white rounded-full p-1 shadow-sm">
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
            <button data-tour="add-product" className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors cursor-pointer">
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div data-tour="products-stats" className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Products</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">In Shop</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats.published}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-[#303A4D]/60">Active</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[#303A4D]/60">Out of Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div data-tour="search-filter" className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
          />
        </div>
        
        {/* Publish Status Filter */}
        <div data-tour="publish-status" className="flex gap-3">
          <button
            onClick={() => setPublishFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              publishFilter === 'all' ? 'bg-[#303A4D] text-white' : 'bg-gray-100 text-[#303A4D] hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setPublishFilter('published')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              publishFilter === 'published' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            📢 Published to Shop
          </button>
          <button
            onClick={() => setPublishFilter('unpublished')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              publishFilter === 'unpublished' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            📦 Warehouse Only
          </button>
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
              
              <div className="space-y-2">
                <Link href={`/admin/warehouse?product_id=${product.id}`} className="block">
                  <div className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg py-2 px-3 text-sm font-medium transition-colors flex items-center justify-between cursor-pointer">
                    <span>📦 View in Warehouse</span>
                    <Warehouse className="w-4 h-4" />
                  </div>
                </Link>
                
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    togglePublish(product.id, product.is_published)
                  }}
                  className={`w-full rounded-lg py-2 px-3 text-sm font-medium transition-colors ${
                    product.is_published 
                      ? 'bg-green-50 hover:bg-green-100 text-green-700' 
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                  }`}
                >
                  {product.is_published ? '📢 Published to Shop' : '📦 Warehouse Only - Click to Publish'}
                </button>
                
                <div className="flex gap-2">
                  <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                    <button className="w-full bg-[#FED141]/20 hover:bg-[#FED141]/30 text-[#303A4D] rounded-full py-2 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      deleteProduct(product.id)
                    }}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full py-2 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
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

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-3xl p-6">
          <div className="text-sm text-[#303A4D]/60">
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalProducts)} of {totalProducts} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#303A4D] hover:bg-[#FED141] border border-[#303A4D]/20'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-full font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#303A4D] text-white'
                        : 'bg-white text-[#303A4D] hover:bg-[#FED141] border border-[#303A4D]/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#303A4D] hover:bg-[#FED141] border border-[#303A4D]/20'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
