"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react"

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
  const [analytics, setAnalytics] = useState<WarehouseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/warehouse/analytics", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!analytics) {
    return <div className="p-8 text-center">No data available</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Analytics</h1>
        <p className="text-[#303A4D]/70">Inventory insights and trends</p>
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
          <p className="text-3xl font-bold text-[#303A4D]">GH₵{analytics.total_stock_value.toFixed(2)}</p>
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
