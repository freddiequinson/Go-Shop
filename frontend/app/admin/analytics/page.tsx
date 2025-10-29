"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, Users, ShoppingCart, Eye } from "lucide-react"

interface TopProduct {
  product_id: string
  product_name: string
  total_orders: number
}

interface MostViewed {
  product_id: string
  product_name: string
  total_views: number
}

interface CustomerAnalytics {
  total_customers: number
  new_customers: number
  active_customers: number
  inactive_customers: number
  average_order_value: number
  average_orders_per_customer: number
  customer_retention_rate: number
  customer_lifetime_value: number
}

export default function AnalyticsPage() {
  const [topSelling, setTopSelling] = useState<TopProduct[]>([])
  const [mostViewed, setMostViewed] = useState<MostViewed[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      
      // Fetch top selling products
      const topSellingRes = await fetch("http://localhost:8000/api/v1/admin/analytics/top-selling?limit=10", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (topSellingRes.ok) {
        const data = await topSellingRes.json()
        setTopSelling(data.products || [])
      }

      // Fetch most viewed products
      const mostViewedRes = await fetch("http://localhost:8000/api/v1/admin/analytics/most-viewed?limit=10", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (mostViewedRes.ok) {
        const data = await mostViewedRes.json()
        setMostViewed(data.products || [])
      }

      // Fetch customer analytics
      const customerRes = await fetch("http://localhost:8000/api/v1/admin/analytics/customers", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (customerRes.ok) {
        const data = await customerRes.json()
        setCustomerAnalytics(data)
      }

    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Analytics & Reports</h1>
        <p className="text-lg text-[#303A4D]/70">Insights into your business performance</p>
      </div>

      {/* Customer Analytics */}
      {customerAnalytics && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Customer Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-[#303A4D]/60">Total Customers</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">{customerAnalytics.total_customers}</p>
              <p className="text-sm text-green-600 mt-1">+{customerAnalytics.new_customers} new</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-[#303A4D]/60">Active Customers</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">{customerAnalytics.active_customers}</p>
              <p className="text-sm text-[#303A4D]/60 mt-1">{customerAnalytics.retention_rate.toFixed(1)}% retention</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-[#303A4D]/60">Avg Order Value</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">GH₵{customerAnalytics.average_order_value.toFixed(2)}</p>
              <p className="text-sm text-[#303A4D]/60 mt-1">{customerAnalytics.average_orders_per_customer.toFixed(1)} orders/customer</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-[#303A4D]/60">Customer LTV</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">GH₵{customerAnalytics.customer_lifetime_value.toFixed(2)}</p>
              <p className="text-sm text-[#303A4D]/60 mt-1">Lifetime value</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#303A4D]">Top Selling Products</h2>
          </div>

          {topSelling.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
              <p className="text-[#303A4D]/60">No sales data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSelling.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-4 p-4 bg-[#F4F2E6] rounded-2xl">
                  <div className="w-8 h-8 bg-[#FED141] rounded-full flex items-center justify-center font-bold text-[#303A4D]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#303A4D]">{product.product_name}</p>
                    <p className="text-sm text-[#303A4D]/60">Product ID: {product.product_id.substring(0, 8)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#303A4D]">{product.total_orders}</p>
                    <p className="text-xs text-[#303A4D]/60">orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Viewed Products */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#303A4D]">Most Viewed Products</h2>
          </div>

          {mostViewed.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
              <p className="text-[#303A4D]/60">No view data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mostViewed.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-4 p-4 bg-[#F4F2E6] rounded-2xl">
                  <div className="w-8 h-8 bg-[#FED141] rounded-full flex items-center justify-center font-bold text-[#303A4D]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#303A4D]">{product.product_name}</p>
                    <p className="text-sm text-[#303A4D]/60">Product ID: {product.product_id.substring(0, 8)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#303A4D]">{product.total_views}</p>
                    <p className="text-xs text-[#303A4D]/60">views</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
