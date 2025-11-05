"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, ArrowLeft, Package, Users, ShoppingCart, CheckCircle, Loader2, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { adminService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

export default function OrdersByProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("paid")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [approvingProduct, setApprovingProduct] = useState<string | null>(null)

  const getErrorMessage = (error: any, fallback: string): string => {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail)
    }
    return fallback
  }

  useEffect(() => {
    fetchProducts()
  }, [statusFilter, dateFrom, dateTo])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (statusFilter) {
        params.status_filter = statusFilter
      }
      if (dateFrom) {
        params.date_from = dateFrom
      }
      if (dateTo) {
        params.date_to = dateTo
      }
      
      const data = await adminService.getOrdersByProducts(params)
      setProducts(data.products)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to fetch products'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkApprove = async (productId: string, orders: any[]) => {
    // Filter orders that can be approved (paid and not yet approved)
    const orderIds = orders
      .filter(o => o.payment_status === 'completed' && !o.approved_at)
      .map(o => o.order_id)
    
    if (orderIds.length === 0) {
      toast({
        title: 'No Orders to Approve',
        description: 'All orders are either not paid or already approved',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Approve ${orderIds.length} orders for this product? This will deduct stock from inventory.`)) {
      return
    }

    try {
      setApprovingProduct(productId)
      const result = await adminService.bulkApproveOrders(orderIds)
      
      toast({
        title: 'Bulk Approval Complete',
        description: `${result.successful_count} orders approved successfully. ${result.failed_count} failed.`
      })
      
      // Refresh data
      fetchProducts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to approve orders'),
        variant: 'destructive'
      })
    } finally {
      setApprovingProduct(null)
    }
  }

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="by-products-header"]',
      title: 'Orders Grouped by Products',
      description: 'See which products are being ordered most. Analyze product demand and plan inventory restocking accordingly.',
      position: 'bottom'
    },
    {
      target: '[data-tour="date-filter"]',
      title: 'Filter by Date Range',
      description: 'Analyze product orders for specific time periods. Identify seasonal trends and popular products to optimize inventory.',
      position: 'bottom'
    },
    {
      target: '[data-tour="product-list"]',
      title: 'Product Performance',
      description: 'Products sorted by order volume. See total quantity ordered, number of orders, revenue, and average order size. Top products indicate high demand.',
      position: 'top'
    },
    {
      target: '[data-tour="bulk-approve"]',
      title: 'Bulk Approve Orders',
      description: 'Approve all paid orders for a product at once. This deducts stock from warehouse inventory automatically.',
      position: 'left'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="orders-by-products" steps={tourSteps} />
      <div className="min-h-screen bg-[#F4F2E6]">
      <div className="w-full px-6 md:px-8 py-12">
        {/* Header */}
        <div data-tour="by-products-header" className="mb-8">
          <h1 className="text-5xl font-bold text-[#303A4D] mb-4">Orders by Products</h1>
          <p className="text-xl text-[#303A4D]/70">View and manage orders grouped by product</p>
        </div>

        {/* Filters */}
        <Card data-tour="date-filter" className="p-6 mb-8 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">All Orders</option>
                <option value="paid">Paid Only</option>
                <option value="approved">Approved Only</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
              </select>
            </div>

            {/* Date From */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>

            {/* Date To */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">No products found with orders</p>
          </Card>
        ) : (
          <div data-tour="product-list" className="space-y-4">
            {products.map((product) => (
              <Card key={product.product_id} className="bg-white overflow-hidden">
                {/* Product Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={product.product_image || "/images/placeholder.png"}
                        alt={product.product_name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#303A4D] mb-2">{product.product_name}</h3>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-[#303A4D]" />
                          <span className="text-lg font-bold text-[#303A4D]">
                            {product.total_quantity} {product.unit_type}
                          </span>
                          <span className="text-sm text-gray-600">ordered</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                          <span className="text-lg font-bold text-blue-600">{product.total_orders}</span>
                          <span className="text-sm text-gray-600">orders</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">{product.unique_customers}</span>
                          <span className="text-sm text-gray-600">customers</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => toggleExpand(product.product_id)}
                          variant="outline"
                          className="rounded-full"
                        >
                          {expandedProduct === product.product_id ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Hide Orders
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              View Orders ({product.orders.length})
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleBulkApprove(product.product_id, product.orders)}
                          disabled={approvingProduct === product.product_id}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                        >
                          {approvingProduct === product.product_id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve All Paid Orders
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Orders List */}
                {expandedProduct === product.product_id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-bold text-[#303A4D] mb-4">Orders for this product:</h4>
                    <div className="space-y-2">
                      {product.orders.map((order: any) => (
                        <div
                          key={order.order_id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg"
                        >
                          <div className="flex-1">
                            <Link
                              href={`/admin/orders/${order.order_id}`}
                              className="font-medium text-[#303A4D] hover:text-[#FED141]"
                            >
                              #{order.order_id.slice(0, 8)}
                            </Link>
                            <p className="text-sm text-gray-600">{order.user_name}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-[#303A4D]">{order.quantity} {product.unit_type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="ml-4">
                            {order.approved_at ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                Approved
                              </span>
                            ) : order.payment_status === 'completed' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                Paid
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  )
}
