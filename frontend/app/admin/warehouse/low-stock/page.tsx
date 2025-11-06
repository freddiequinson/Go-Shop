"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Package, TrendingDown } from "lucide-react"
import Link from "next/link"
import SmartRestockModal from "@/components/warehouse/SmartRestockModal"

interface LowStockProduct {
  id: string
  product_id: string
  product_name: string | null
  product_description?: string | null
  quantity_available: string
  reorder_level: string
  price_per_unit?: string
  location_name?: string
  zone_type?: string
  batch_number?: string
  expiry_date?: string
}

interface ProductDetails {
  [key: string]: {
    name: string
    unit_type: string
  }
}

export default function LowStockPage() {
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [productDetails, setProductDetails] = useState<ProductDetails>({})
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showRestockModal, setShowRestockModal] = useState(false)

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchProductDetails = async (productIds: string[]) => {
    try {
      const token = localStorage.getItem("access_token")
      const details: ProductDetails = {}
      
      // Fetch each product's details
      for (const productId of productIds) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/${productId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
          
          if (response.ok) {
            const product = await response.json()
            details[productId] = {
              name: product.name || 'Unknown Product',
              unit_type: product.unit_type || 'units'
            }
          }
        } catch (err) {
          console.error(`Failed to fetch product ${productId}:`, err)
        }
      }
      
      setProductDetails(details)
    } catch (error) {
      console.error("Failed to fetch product details:", error)
    }
  }

  const fetchLowStockProducts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/low-stock`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Low stock API response:", data)
        
        let productList: LowStockProduct[] = []
        
        // Handle different possible response formats
        if (Array.isArray(data)) {
          productList = data
        } else if (data.items && Array.isArray(data.items)) {
          productList = data.items
        } else if (data.products && Array.isArray(data.products)) {
          productList = data.products
        } else {
          console.error("Unexpected data format:", data)
        }
        
        setProducts(productList)
        
        // Fetch product details for each product_id
        if (productList.length > 0) {
          await fetchProductDetails(productList.map(p => p.product_id))
        }
      } else {
        console.error("API error:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch low stock products:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (product: { stock_quantity: number; minimum_stock_level: number }) => {
    if (product.stock_quantity === 0) {
      return { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-300" }
    } else if (product.stock_quantity <= product.minimum_stock_level) {
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700 border-yellow-300" }
    }
    return { label: "In Stock", color: "bg-green-100 text-green-700 border-green-300" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#FED141] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-semibold text-[#303A4D]">Loading products...</div>
        </div>
      </div>
    )
  }

  const outOfStock = products.filter(p => parseFloat(p.quantity_available) === 0)
  const lowStock = products.filter(p => {
    const qty = parseFloat(p.quantity_available) || 0
    const minLevel = parseFloat(p.reorder_level) || 0
    return qty > 0 && qty <= minLevel
  })

  return (
    <div className="px-4 md:px-0">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-[#303A4D] mb-1 md:mb-2">Low Stock Products</h1>
        <p className="text-sm md:text-lg text-[#303A4D]/70">Products that need restocking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-[#303A4D]" />
            <span className="text-xs md:text-sm text-[#303A4D]/70 font-medium">Total Low Stock</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-[#303A4D]">{products.length}</p>
        </div>
        <div className="bg-white border-2 border-red-200 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            <span className="text-xs md:text-sm text-red-900 font-medium">Out of Stock</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            <span className="text-xs md:text-sm text-yellow-900 font-medium">Low Stock</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-yellow-600">{lowStock.length}</p>
        </div>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 text-center border-2 border-gray-100">
          <Package className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-3 md:mb-4" />
          <p className="text-lg md:text-xl font-bold text-[#303A4D]">All Products Well Stocked!</p>
          <p className="text-sm md:text-base text-[#303A4D]/60">No products need restocking at the moment.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {products.map((product) => {
              const productInfo = productDetails[product.product_id]
              const productName = productInfo?.name || product.product_name || product.product_description || 'Loading...'
              const stockQty = parseFloat(product.quantity_available) || 0
              const minLevel = parseFloat(product.reorder_level) || 0
              const unitType = productInfo?.unit_type || 'units'
              const status = getStockStatus({ stock_quantity: stockQty, minimum_stock_level: minLevel })
              
              return (
                <div key={product.id} className="bg-white rounded-xl border-2 border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-[#303A4D] mb-1">{productName}</p>
                      <p className="text-xs text-[#303A4D]/60">ID: {product.product_id.substring(0, 8)}...</p>
                      {product.location_name && (
                        <p className="text-xs text-[#303A4D]/60">Location: {product.location_name}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 ${status.color} whitespace-nowrap`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-[#303A4D]/60 mb-1">Current Stock</p>
                      <p className={`text-xl font-bold ${stockQty === 0 ? 'text-red-600' : 'text-[#303A4D]'}`}>
                        {stockQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#303A4D]/60 mb-1">Minimum Level</p>
                      <p className="text-xl font-bold text-[#303A4D]">{minLevel}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-[#303A4D]/60 mb-1">Unit Type</p>
                    <p className="text-sm text-[#303A4D] capitalize">{unitType}</p>
                    {product.batch_number && (
                      <p className="text-xs text-[#303A4D]/60">Batch: {product.batch_number}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedProduct({
                        id: product.product_id,
                        name: productName,
                        stock_quantity: stockQty,
                        unit_type: unitType
                      })
                      setShowRestockModal(true)
                    }}
                    className="w-full px-4 py-2 bg-[#FED141] text-[#303A4D] rounded-lg font-semibold hover:bg-[#FED141]/90 transition-colors"
                  >
                    Smart Restock
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Product Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Current Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Minimum Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Unit Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#303A4D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  // Parse warehouse inventory fields
                  const productInfo = productDetails[product.product_id]
                  const productName = productInfo?.name || product.product_name || product.product_description || 'Loading...'
                  const stockQty = parseFloat(product.quantity_available) || 0
                  const minLevel = parseFloat(product.reorder_level) || 0
                  const unitType = productInfo?.unit_type || 'units'
                  
                  const status = getStockStatus({ stock_quantity: stockQty, minimum_stock_level: minLevel })
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#303A4D]">{productName}</p>
                        <p className="text-sm text-[#303A4D]/60">Product ID: {product.product_id.substring(0, 8)}...</p>
                        {product.location_name && (
                          <p className="text-sm text-[#303A4D]/60">Location: {product.location_name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-lg font-bold ${stockQty === 0 ? 'text-red-600' : 'text-[#303A4D]'}`}>
                          {stockQty}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#303A4D]">{minLevel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[#303A4D] capitalize">{unitType}</p>
                          {product.batch_number && (
                            <p className="text-xs text-[#303A4D]/60">Batch: {product.batch_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedProduct({
                              id: product.product_id,
                              name: productName,
                              stock_quantity: stockQty,
                              unit_type: unitType
                            })
                            setShowRestockModal(true)
                          }}
                          className="px-4 py-2 bg-[#FED141] text-[#303A4D] rounded-lg font-semibold hover:bg-[#FED141]/90 transition-colors"
                        >
                          Smart Restock
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Smart Restock Modal */}
      {showRestockModal && selectedProduct && (
        <SmartRestockModal
          product={selectedProduct}
          onClose={() => {
            setShowRestockModal(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
