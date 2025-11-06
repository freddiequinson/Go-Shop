"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, TrendingDown, Package, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  unit_price: number
  rating: number
  lead_time_days: number
  available_quantity: string
}

interface ProductComparison {
  product_id: string
  product_name: string
  product_image: string
  category: string
  suppliers_count: number
  lowest_price: number
  highest_price: number
  price_difference: number
  lowest_price_supplier: SupplierInfo
  highest_price_supplier: SupplierInfo
  all_suppliers: SupplierInfo[]
}

export default function PriceComparisonPage() {
  const [products, setProducts] = useState<ProductComparison[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchAllProducts()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  const fetchAllProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/price-comparison/all-products`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load price comparison data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const goToSupplierMarketplace = (productId: string, supplierId: string) => {
    router.push(`/admin/procurement/marketplace?product=${productId}&supplier=${supplierId}`)
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="price-header"]',
      title: 'Price Comparison Table',
      description: 'Compare prices from different suppliers for all products. See the lowest and highest prices at a glance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="search-bar"]',
      title: 'Search Products',
      description: 'Filter products by name or category to quickly find what you need.',
      position: 'bottom'
    },
    {
      target: '[data-tour="price-table"]',
      title: 'Product Pricing Table',
      description: 'View all products with supplier count, lowest price, highest price, and price difference. Click on a row to see all suppliers.',
      position: 'top'
    }
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#FED141] animate-spin mx-auto mb-4" />
          <p className="text-lg text-[#303A4D]">Loading price comparison...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <OnboardingTour tourId="price-comparison" steps={tourSteps} />
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
        {/* Header */}
        <div data-tour="price-header" className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Price Comparison</h1>
            <p className="text-[#303A4D]/70">Compare supplier prices across all products</p>
          </div>
          <Button onClick={fetchAllProducts} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <Card data-tour="search-bar" className="p-4 mb-6 bg-white">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or category..."
              className="border-none shadow-none focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-[#303A4D]">{filteredProducts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Lowest Price</p>
                <p className="text-2xl font-bold text-green-600">
                  GH₵{filteredProducts.length > 0 
                    ? (filteredProducts.reduce((sum, p) => sum + p.lowest_price, 0) / filteredProducts.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Price Difference</p>
                <p className="text-2xl font-bold text-orange-600">
                  GH₵{filteredProducts.length > 0 
                    ? (filteredProducts.reduce((sum, p) => sum + p.price_difference, 0) / filteredProducts.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Price Comparison Table */}
        <Card data-tour="price-table" className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Category</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Suppliers</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-green-600">Lowest Price</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-orange-600">Highest Price</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-[#303A4D]">Difference</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <>
                      <tr 
                        key={product.product_id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(expandedRow === product.product_id ? null : product.product_id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.product_image && (
                              <img 
                                src={product.product_image} 
                                alt={product.product_name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <span className="font-medium text-[#303A4D]">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {product.suppliers_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div>
                            <p className="font-bold text-green-600">GH₵{product.lowest_price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{product.lowest_price_supplier?.supplier_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div>
                            <p className="font-bold text-orange-600">GH₵{product.highest_price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{product.highest_price_supplier?.supplier_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-[#303A4D]">
                            GH₵{product.price_difference.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedRow(expandedRow === product.product_id ? null : product.product_id)
                            }}
                          >
                            {expandedRow === product.product_id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                      
                      {/* Expanded Row - All Suppliers */}
                      {expandedRow === product.product_id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-bold text-[#303A4D] mb-3">All Suppliers for {product.product_name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {product.all_suppliers.map((supplier) => (
                                  <Card 
                                    key={supplier.supplier_id}
                                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => goToSupplierMarketplace(product.product_id, supplier.supplier_id)}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="font-bold text-[#303A4D]">{supplier.supplier_name}</p>
                                        <p className="text-xs text-gray-500">{supplier.supplier_code}</p>
                                      </div>
                                      <ExternalLink className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Price:</span>
                                        <span className="font-bold text-[#303A4D]">GH₵{supplier.unit_price.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Rating:</span>
                                        <span className="text-sm font-medium">{supplier.rating.toFixed(1)}/5</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Lead Time:</span>
                                        <span className="text-sm font-medium">{supplier.lead_time_days} days</span>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="w-full mt-3 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        goToSupplierMarketplace(product.product_id, supplier.supplier_id)
                                      }}
                                    >
                                      Select & Order
                                    </Button>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
