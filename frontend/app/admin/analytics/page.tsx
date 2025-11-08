"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Package, Users, ShoppingCart, Eye, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserAnalytics from "@/components/admin/UserAnalytics"

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
  retention_rate: number
  customer_lifetime_value: number
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [topSelling, setTopSelling] = useState<TopProduct[]>([])
  const [mostViewed, setMostViewed] = useState<MostViewed[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        setError("Not authenticated")
        toast({
          title: "Error",
          description: "Please login to view analytics",
          variant: "destructive"
        })
        return
      }
      
      // Fetch top selling products
      const topSellingRes = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/analytics/top-selling?limit=10`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (topSellingRes.ok) {
        const data = await topSellingRes.json()
        setTopSelling(data.products || [])
      } else {
        console.error("Failed to fetch top selling:", await topSellingRes.text())
      }

      // Fetch most viewed products
      const mostViewedRes = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/analytics/most-viewed?limit=10`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (mostViewedRes.ok) {
        const data = await mostViewedRes.json()
        setMostViewed(data.products || [])
      } else {
        console.error("Failed to fetch most viewed:", await mostViewedRes.text())
      }

      // Fetch customer analytics
      const customerRes = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/analytics/customers`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (customerRes.ok) {
        const data = await customerRes.json()
        setCustomerAnalytics(data)
      } else {
        console.error("Failed to fetch customer analytics:", await customerRes.text())
      }

      toast({
        title: "Success",
        description: "Analytics data loaded successfully"
      })

    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      setError("Failed to load analytics data")
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-[#FED141] animate-spin mb-4" />
        <p className="text-lg text-[#303A4D]/70">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Analytics & Reports</h1>
          <p className="text-lg text-[#303A4D]/70">Insights into your business performance</p>
        </div>
        <Button 
          onClick={fetchAnalytics} 
          variant="outline"
          className="border-[#FED141] text-[#303A4D] hover:bg-[#FED141]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#FED141] data-[state=active]:text-[#303A4D]">
            <Package className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#FED141] data-[state=active]:text-[#303A4D]">
            <Users className="w-4 h-4 mr-2" />
            User Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
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
              <p className="text-sm text-[#303A4D]/60 mt-1">{Number(customerAnalytics.retention_rate || 0).toFixed(1)}% retention</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-[#303A4D]/60">Avg Order Value</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">GH₵{Number(customerAnalytics.average_order_value || 0).toFixed(2)}</p>
              <p className="text-sm text-[#303A4D]/60 mt-1">{Number(customerAnalytics.average_orders_per_customer || 0).toFixed(1)} orders/customer</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-[#303A4D]/60">Avg Customer Value</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">GH₵{Number(customerAnalytics.customer_lifetime_value || 0).toFixed(2)}</p>
              <p className="text-sm text-[#303A4D]/60 mt-1">Total spent per customer</p>
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
        </TabsContent>

        <TabsContent value="users">
          <UserAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
