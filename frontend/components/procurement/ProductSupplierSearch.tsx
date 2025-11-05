"use client"

import { useState } from "react"
import { Search, TrendingUp, Star, Package, DollarSign, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatSupplierType, getStatusColor, formatSupplierStatus } from "@/utils/supplierHelpers"
import CreateSupplyRequestModal from "./CreateSupplyRequestModal"

interface SupplierProduct {
  product_id: string
  product_name: string
  price_per_unit: number
  price_per_quantity: number | null
  unit_type: string
  stock_quantity: number
  minimum_quantity: number
  in_warehouse: boolean
  is_published: boolean
}

interface SupplierResult {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  supplier_type: string
  rating: number
  on_time_delivery_rate: number
  quality_rating: number
  verification_status: string
  products: SupplierProduct[]
}

interface SearchResponse {
  search_term: string
  total_suppliers: number
  total_products: number
  suppliers: SupplierResult[]
}

export default function ProductSupplierSearch() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name to search",
        variant: "destructive"
      })
      return
    }

    setSearching(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `http://localhost:8000/api/v1/suppliers/by-product/${encodeURIComponent(searchTerm)}`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setResults(data)
        
        if (data.total_suppliers === 0) {
          toast({
            title: "No Results",
            description: `No suppliers found selling "${searchTerm}"`,
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to search for suppliers",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for suppliers",
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
  }

  const handleCreateRequest = (supplierId: string, productId: string) => {
    setSelectedSupplier(supplierId)
    setSelectedProduct(productId)
    setShowRequestModal(true)
  }

  const getBestPrice = (products: SupplierProduct[]) => {
    if (products.length === 0) return null
    const prices = products.map(p => p.price_per_unit)
    return Math.min(...prices)
  }

  const getAveragePrice = () => {
    if (!results || results.suppliers.length === 0) return 0
    const allPrices = results.suppliers.flatMap(s => s.products.map(p => p.price_per_unit))
    return allPrices.reduce((a, b) => a + b, 0) / allPrices.length
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card className="p-6 bg-white">
        <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Find Suppliers by Product</h2>
        <p className="text-[#303A4D]/70 mb-6">
          Search for a product and see all suppliers who have it in their catalog with pricing comparison
        </p>

        {/* Search Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter product name (e.g., Tomatoes, Rice, Chicken...)"
              className="w-full pl-12 pr-4 py-4 bg-[#F4F2E6] rounded-xl text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 px-8"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60">Suppliers Found</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{results.total_suppliers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60">Total Products</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{results.total_products}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60">Average Price</p>
                  <p className="text-2xl font-bold text-[#303A4D]">
                    GH₵{getAveragePrice().toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Suppliers List */}
          <div className="space-y-4">
            {results.suppliers.map((supplier) => (
              <Card key={supplier.supplier_id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                {/* Supplier Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#303A4D]">{supplier.supplier_name}</h3>
                      <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                        {formatSupplierType(supplier.supplier_type)}
                      </Badge>
                      <Badge className={`border ${getStatusColor(supplier.verification_status)}`}>
                        {formatSupplierStatus(supplier.verification_status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#303A4D]/60">{supplier.supplier_code}</p>
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{supplier.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-[#303A4D]/60">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{supplier.on_time_delivery_rate.toFixed(0)}%</p>
                      <p className="text-xs text-[#303A4D]/60">On-Time</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{supplier.quality_rating.toFixed(1)}</p>
                      <p className="text-xs text-[#303A4D]/60">Quality</p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-3">
                  <p className="font-semibold text-[#303A4D]">
                    Products ({supplier.products.length})
                  </p>
                  {supplier.products.map((product) => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between p-4 bg-[#F4F2E6] rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#303A4D]">{product.product_name}</p>
                          {product.in_warehouse && (
                            <Badge className="bg-green-100 text-green-700 text-xs">In Warehouse</Badge>
                          )}
                          {product.is_published && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Published</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#303A4D]/70">
                          <span>Stock: {product.stock_quantity} {product.unit_type}</span>
                          <span>Min Order: {product.minimum_quantity} {product.unit_type}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#303A4D]">
                            GH₵{product.price_per_unit.toFixed(2)}
                          </p>
                          <p className="text-sm text-[#303A4D]/60">per {product.unit_type}</p>
                          {product.price_per_quantity && (
                            <p className="text-xs text-[#303A4D]/60">
                              or GH₵{product.price_per_quantity.toFixed(2)}/piece
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={() => handleCreateRequest(supplier.supplier_id, product.product_id)}
                          className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Best Price Indicator */}
                {getBestPrice(supplier.products) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Best price from this supplier: <span className="font-bold">GH₵{getBestPrice(supplier.products)?.toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {results && results.total_suppliers === 0 && (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Suppliers Found</h3>
          <p className="text-[#303A4D]/70 mb-6">
            No suppliers have "{results.search_term}" in their catalog yet.
          </p>
          <p className="text-sm text-[#303A4D]/60">
            Try searching for a different product or check back later.
          </p>
        </Card>
      )}

      {/* Create Request Modal */}
      {selectedSupplier && selectedProduct && (
        <CreateSupplyRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedSupplier(null)
            setSelectedProduct(null)
          }}
          supplierId={selectedSupplier}
          productId={selectedProduct}
          onSuccess={() => {
            setShowRequestModal(false)
            setSelectedSupplier(null)
            setSelectedProduct(null)
            toast({
              title: "Success",
              description: "Supply request created successfully!"
            })
          }}
        />
      )}
    </div>
  )
}
