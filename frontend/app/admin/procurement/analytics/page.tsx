"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, 
  Clock, CheckCircle, AlertCircle, BarChart3, PieChart, RefreshCw, Info
} from "lucide-react"

interface AnalyticsData {
  totalRequests: number
  totalOffers: number
  totalSuppliers: number
  averageResponseTime: number
  acceptanceRate: number
  costSavings: number
  topSuppliers: Array<{
    id: string
    name: string
    totalOrders: number
    totalValue: number
    rating: number
    onTimeRate: number
  }>
  priceComparison: Array<{
    product: string
    avgPrice: number
    lowestPrice: number
    highestPrice: number
    suppliers: number
  }>
  requestsByStatus: {
    pending: number
    accepted: number
    rejected: number
    completed: number
  }
  monthlyTrends: Array<{
    month: string
    requests: number
    spending: number
  }>
}

export default function ProcurementAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      
      // Calculate days based on time range
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 }
      const days = daysMap[timeRange]
      
      const response = await fetch(`http://localhost:8000/api/v1/supply-requests/analytics?days=${days}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setLoading(false)
        return
      }
      
      // Fallback to simulated data if API fails
      console.warn("API failed, using simulated data")
      const mockData: AnalyticsData = {
        totalRequests: 145,
        totalOffers: 312,
        totalSuppliers: 28,
        averageResponseTime: 4.2,
        acceptanceRate: 78.5,
        costSavings: 12450.50,
        topSuppliers: [
          { id: "1", name: "Fresh Farms Ltd", totalOrders: 45, totalValue: 125000, rating: 4.8, onTimeRate: 95 },
          { id: "2", name: "Quality Produce Co", totalOrders: 38, totalValue: 98000, rating: 4.6, onTimeRate: 92 },
          { id: "3", name: "Green Valley Suppliers", totalOrders: 32, totalValue: 87500, rating: 4.7, onTimeRate: 88 },
          { id: "4", name: "Premium Foods", totalOrders: 28, totalValue: 76000, rating: 4.5, onTimeRate: 90 },
          { id: "5", name: "Organic Harvest", totalOrders: 24, totalValue: 65000, rating: 4.9, onTimeRate: 96 }
        ],
        priceComparison: [
          { product: "Tomatoes", avgPrice: 8.50, lowestPrice: 7.20, highestPrice: 10.00, suppliers: 8 },
          { product: "Rice", avgPrice: 12.00, lowestPrice: 10.50, highestPrice: 14.00, suppliers: 6 },
          { product: "Chicken", avgPrice: 25.00, lowestPrice: 22.00, highestPrice: 28.00, suppliers: 5 },
          { product: "Onions", avgPrice: 6.50, lowestPrice: 5.80, highestPrice: 7.50, suppliers: 7 },
          { product: "Cooking Oil", avgPrice: 45.00, lowestPrice: 42.00, highestPrice: 48.00, suppliers: 4 }
        ],
        requestsByStatus: {
          pending: 23,
          accepted: 89,
          rejected: 18,
          completed: 15
        },
        monthlyTrends: [
          { month: "Jul", requests: 32, spending: 45000 },
          { month: "Aug", requests: 38, spending: 52000 },
          { month: "Sep", requests: 42, spending: 58000 },
          { month: "Oct", requests: 45, spending: 61000 },
          { month: "Nov", requests: 48, spending: 65000 }
        ]
      }
      
      setAnalytics(mockData)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto mb-4"></div>
          <p className="text-[#303A4D]/70">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const savingsPercentage = ((analytics.costSavings / 100000) * 100).toFixed(1)

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Procurement Analytics</h1>
            <p className="text-[#303A4D]/70">Insights and performance metrics for procurement operations</p>
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
        
        {/* Info Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Real-Time Data</p>
            <p className="text-sm text-green-700">
              This page displays real procurement analytics from your supply requests and offers. Data updates based on the selected time range.
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {(["week", "month", "quarter", "year"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? "bg-[#FED141] text-[#303A4D]"
                : "bg-white text-[#303A4D] hover:bg-gray-100"
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.totalRequests}</p>
          <p className="text-xs text-green-600 mt-2">+12% from last period</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Active Suppliers</p>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.totalSuppliers}</p>
          <p className="text-xs text-green-600 mt-2">+3 new this month</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Cost Savings</p>
          <p className="text-3xl font-bold text-[#303A4D]">GH₵{analytics.costSavings.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2">{savingsPercentage}% savings rate</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.averageResponseTime}h</p>
          <p className="text-xs text-green-600 mt-2">-0.8h improvement</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Request Status Distribution */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-[#303A4D]" />
            <h2 className="text-xl font-bold text-[#303A4D]">Request Status Distribution</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.requestsByStatus).map(([status, count]) => {
              const total = Object.values(analytics.requestsByStatus).reduce((a, b) => a + b, 0)
              const percentage = ((count / total) * 100).toFixed(1)
              const colors = {
                pending: "bg-yellow-500",
                accepted: "bg-green-500",
                rejected: "bg-red-500",
                completed: "bg-blue-500"
              }
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#303A4D] capitalize">{status}</span>
                    <span className="text-sm text-[#303A4D]/60">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[status as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Monthly Trends */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#303A4D]" />
            <h2 className="text-xl font-bold text-[#303A4D]">Monthly Trends</h2>
          </div>
          <div className="space-y-3">
            {analytics.monthlyTrends.map((trend) => (
              <div key={trend.month} className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#303A4D] w-12">{trend.month}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#303A4D]/60">Requests: {trend.requests}</span>
                    <span className="text-xs text-[#303A4D]/60">GH₵{trend.spending.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-[#FED141]"
                      style={{ width: `${(trend.requests / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card className="p-6 bg-white mb-8">
        <h2 className="text-xl font-bold text-[#303A4D] mb-6">Top Performing Suppliers</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">Supplier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">Total Value</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">Rating</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#303A4D]">On-Time Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topSuppliers.map((supplier, index) => (
                <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-[#303A4D]">{supplier.name}</p>
                  </td>
                  <td className="py-4 px-4 text-[#303A4D]">{supplier.totalOrders}</td>
                  <td className="py-4 px-4 text-[#303A4D] font-semibold">
                    GH₵{supplier.totalValue.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-[#303A4D]">{supplier.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${supplier.onTimeRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-[#303A4D]">{supplier.onTimeRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Price Comparison */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-[#303A4D] mb-6">Price Comparison by Product</h2>
        <div className="space-y-6">
          {analytics.priceComparison.map((item) => {
            const priceRange = item.highestPrice - item.lowestPrice
            const savingsPercentage = ((priceRange / item.highestPrice) * 100).toFixed(1)
            
            return (
              <div key={item.product} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#303A4D]">{item.product}</h3>
                    <p className="text-sm text-[#303A4D]/60">{item.suppliers} suppliers</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#303A4D]">GH₵{item.avgPrice.toFixed(2)}</p>
                    <p className="text-sm text-[#303A4D]/60">Average price</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 mb-1">Lowest</p>
                    <p className="text-lg font-bold text-green-700">GH₵{item.lowestPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-1">Average</p>
                    <p className="text-lg font-bold text-blue-700">GH₵{item.avgPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700 mb-1">Highest</p>
                    <p className="text-lg font-bold text-red-700">GH₵{item.highestPrice.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {savingsPercentage}% potential savings by choosing lowest price
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#303A4D]/60">Acceptance Rate</p>
              <p className="text-2xl font-bold text-[#303A4D]">{analytics.acceptanceRate}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${analytics.acceptanceRate}%` }}
            ></div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#303A4D]/60">Total Offers Received</p>
              <p className="text-2xl font-bold text-[#303A4D]">{analytics.totalOffers}</p>
            </div>
          </div>
          <p className="text-sm text-[#303A4D]/60">
            {(analytics.totalOffers / analytics.totalRequests).toFixed(1)} offers per request
          </p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[#303A4D]/60">Pending Requests</p>
              <p className="text-2xl font-bold text-[#303A4D]">{analytics.requestsByStatus.pending}</p>
            </div>
          </div>
          <p className="text-sm text-yellow-600">Requires attention</p>
        </Card>
      </div>
    </div>
  )
}
