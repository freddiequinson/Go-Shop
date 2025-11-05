"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Package, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface WarehouseAnalytics {
  total_products: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  movements_this_month: number
  top_moving_products: Array<{
    product_name: string
    total_movements: number
  }>
}

export default function WarehouseAnalyticsPage() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<WarehouseAnalytics | null>(null)
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
      
      const response = await fetch("http://localhost:8000/api/v1/warehouse/analytics", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        toast({
          title: "Success",
          description: "Warehouse analytics loaded successfully"
        })
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to load analytics")
        toast({
          title: "Error",
          description: errorData.detail || "Failed to load analytics",
          variant: "destructive"
        })
      }
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
      <div className="p-8 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#FED141] animate-spin mb-4" />
        <p className="text-lg text-[#303A4D]/70">Loading warehouse analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#303A4D]/60 mb-4">No data available</p>
        <Button onClick={fetchAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Load Analytics
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Analytics</h1>
          <p className="text-[#303A4D]/70">Inventory insights and trends</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-[#303A4D]/60 text-sm mb-1">Total Products</p>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.total_products}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
          <p className="text-[#303A4D]/60 text-sm mb-1">Stock Value</p>
          <p className="text-3xl font-bold text-[#303A4D]">GH₵{Number(analytics.total_stock_value || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-12 h-12 text-orange-600" />
          </div>
          <p className="text-[#303A4D]/60 text-sm mb-1">Low Stock Items</p>
          <p className="text-3xl font-bold text-orange-600">{analytics.low_stock_items}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-12 h-12 text-purple-600" />
          </div>
          <p className="text-[#303A4D]/60 text-sm mb-1">Movements (Month)</p>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.movements_this_month}</p>
        </div>
      </div>

      {/* Top Moving Products */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Top Moving Products</h2>
        <div className="space-y-4">
          {analytics.top_moving_products?.map((product, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-[#F4F2E6] rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-[#FED141] w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#303A4D]">
                  {idx + 1}
                </div>
                <p className="font-bold text-[#303A4D]">{product.product_name}</p>
              </div>
              <p className="text-lg font-bold text-[#303A4D]">{product.total_movements} movements</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
