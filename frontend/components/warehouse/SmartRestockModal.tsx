"use client"

import { useState, useEffect } from "react"
import { X, Package, AlertTriangle, CheckCircle, TrendingUp, FileText, Loader2 } from "lucide-react"
import SupplierComparisonTable from "./SupplierComparisonTable"
import PriceComparisonChart from "./PriceComparisonChart"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  stock_quantity?: number
  unit_type: string
}

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_type: string
  unit_cost: number
  lead_time_days: number
  supply_capacity?: number
  minimum_order_quantity: number
  rating: number
  quality_rating: number
  on_time_delivery_rate: number
  is_preferred: boolean
  last_supply_date?: string
  phone: string
  email?: string
}

interface SmartRestockResponse {
  product_exists: boolean
  product_id: string
  product_name: string
  current_stock: number
  unit_type: string
  suppliers_available: SupplierInfo[]
  recommended_action: string
  recommended_supplier_id?: string
  total_suppliers: number
}

interface SmartRestockModalProps {
  product: Product
  onClose: () => void
}

export default function SmartRestockModal({ product, onClose }: SmartRestockModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [restockData, setRestockData] = useState<SmartRestockResponse | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>()
  const [quantityNeeded, setQuantityNeeded] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestockData()
  }, [product.id])

  const fetchRestockData = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/smart-restock?product_id=${product.id}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRestockData(data)
        setSelectedSupplierId(data.recommended_supplier_id)
      } else {
        setError("Failed to fetch restock data")
      }
    } catch (err) {
      console.error("Error fetching restock data:", err)
      setError("An error occurred while fetching restock data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDirectOrder = () => {
    if (!selectedSupplierId) {
      toast({
        title: "Supplier Required",
        description: "Please select a supplier before creating a direct order",
        variant: "destructive"
      })
      return
    }
    
    if (!quantityNeeded || parseFloat(quantityNeeded) <= 0) {
      toast({
        title: "Quantity Required",
        description: "Please enter the quantity you need to order",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Redirecting...",
      description: "Taking you to create a direct order",
    })
    
    // Navigate to direct order creation with pre-filled data
    const params = new URLSearchParams({
      product_id: product.id,
      supplier_id: selectedSupplierId,
      quantity: quantityNeeded || "0"
    })
    router.push(`/admin/procurement/direct-orders/new?${params.toString()}`)
  }

  const handleRequestQuotes = () => {
    if (!quantityNeeded || parseFloat(quantityNeeded) <= 0) {
      toast({
        title: "Quantity Required",
        description: "Please enter the quantity you need",
        variant: "destructive"
      })
      return
    }
    
    toast({
      title: "Creating Supply Request",
      description: `Requesting quotes for ${quantityNeeded} ${restockData?.unit_type} of ${product.name}`,
    })
    
    // Navigate to supply request creation
    const params = new URLSearchParams({
      product_id: product.id,
      product_name: product.name,
      quantity: quantityNeeded || "0"
    })
    router.push(`/admin/procurement/requests/new?${params.toString()}`)
  }

  const handleCreateSupplyRequest = () => {
    toast({
      title: "Creating Marketplace Request",
      description: "Suppliers will be notified about this request",
    })
    
    // Navigate to supply request creation for products with no suppliers
    const params = new URLSearchParams({
      product_id: product.id,
      product_name: product.name,
      quantity: quantityNeeded || "0",
      urgency: "high"
    })
    router.push(`/admin/procurement/requests/new?${params.toString()}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FED141] rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Smart Restock</h2>
              <p className="text-sm text-[#303A4D]/70">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-[#FED141] animate-spin mb-4" />
              <p className="text-[#303A4D] font-semibold">Analyzing suppliers...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <p className="text-red-900 font-bold mb-2">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          ) : restockData ? (
            <>
              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Product Name</p>
                    <p className="font-bold text-[#303A4D]">{restockData.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Current Stock</p>
                    <p className="font-bold text-[#303A4D]">
                      {restockData.current_stock} {restockData.unit_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Quantity Needed</p>
                    <input
                      type="number"
                      value={quantityNeeded}
                      onChange={(e) => setQuantityNeeded(e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Suppliers Available */}
              {restockData.suppliers_available.length > 0 ? (
                <>
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-green-900 mb-1">
                          {restockData.total_suppliers} Supplier{restockData.total_suppliers !== 1 ? 's' : ''} Available
                        </h3>
                        <p className="text-sm text-green-700">
                          Compare prices and select the best supplier for your needs
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Comparison Chart */}
                  {restockData.suppliers_available.length > 1 && (
                    <div className="mb-6">
                      <PriceComparisonChart
                        suppliers={restockData.suppliers_available.map(s => ({
                          supplier_id: s.supplier_id,
                          supplier_name: s.supplier_name,
                          unit_cost: s.unit_cost,
                          is_preferred: s.is_preferred,
                          rating: s.rating
                        }))}
                        unitType={restockData.unit_type}
                        currentPrice={product.stock_quantity ? undefined : undefined}
                      />
                    </div>
                  )}

                  {/* Supplier Comparison Table */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#303A4D] mb-4">Supplier Details</h3>
                    <SupplierComparisonTable
                      suppliers={restockData.suppliers_available}
                      unitType={restockData.unit_type}
                      onSelectSupplier={setSelectedSupplierId}
                      selectedSupplierId={selectedSupplierId}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCreateDirectOrder}
                      disabled={!selectedSupplierId || !quantityNeeded}
                      className="flex-1 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-lg font-bold hover:bg-[#FED141]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Create Direct Order
                    </button>
                    <button
                      onClick={handleRequestQuotes}
                      className="flex-1 px-6 py-3 bg-[#303A4D] text-white rounded-lg font-bold hover:bg-[#303A4D]/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Request Quotes from All
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* No Suppliers Available */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-yellow-900 mb-2">
                          No Suppliers Currently Stock This Product
                        </h3>
                        <p className="text-yellow-700 mb-4">
                          Don't worry! You can create a supply request and send it to the marketplace. 
                          Suppliers will be notified and can submit offers.
                        </p>
                        
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <h4 className="font-bold text-[#303A4D] mb-2">What happens next?</h4>
                          <ol className="space-y-2 text-sm text-[#303A4D]/70">
                            <li className="flex gap-2">
                              <span className="font-bold">1.</span>
                              <span>Your supply request is posted to the marketplace</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">2.</span>
                              <span>Matching suppliers are automatically notified</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">3.</span>
                              <span>Suppliers submit their offers with pricing</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="font-bold">4.</span>
                              <span>You compare offers and select the best one</span>
                            </li>
                          </ol>
                        </div>

                        <button
                          onClick={handleCreateSupplyRequest}
                          className="w-full px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-lg font-bold hover:bg-[#FED141]/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Create Supply Request
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
