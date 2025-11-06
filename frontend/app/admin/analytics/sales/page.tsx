"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, 
  Calendar, BarChart3, RefreshCw, Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface SalesData {
  total_sales: number
  total_revenue: number
  average_order_value: number
  total_orders: number
  sales_today: number
  sales_this_week: number
  sales_this_month: number
  revenue_today: number
  revenue_this_week: number
  revenue_this_month: number
  top_selling_products: Array<{
    product_id: string
    product_name: string
    quantity_sold: number
    revenue: number
  }>
  sales_by_category: Array<{
    category: string
    quantity: number
    revenue: number
  }>
  daily_sales: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export default function SalesAnalyticsPage() {
  const { toast } = useToast()
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")

  useEffect(() => {
    fetchSalesAnalytics()
  }, [timeRange])

  const fetchSalesAnalytics = async () => {
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
      
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 }
      const days = daysMap[timeRange]
      
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/analytics/sales?days=${days}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSalesData(data)
        toast({
          title: "Success",
          description: "Sales analytics loaded successfully"
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
      console.error("Failed to fetch sales analytics:", error)
      setError("Failed to load sales data")
      toast({
        title: "Error",
        description: "Failed to load sales data",
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
        <p className="text-lg text-[#303A4D]/70">Loading sales analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchSalesAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!salesData) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#303A4D]/60 mb-4">No sales data available</p>
        <Button onClick={fetchSalesAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Load Analytics
        </Button>
      </div>
    )
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="sales-header"]',
      title: 'Sales Analytics',
      description: 'Comprehensive sales performance dashboard. Track revenue, orders, top products, and trends over time.',
      position: 'bottom'
    },
    {
      target: '[data-tour="time-range"]',
      title: 'Time Range Filter',
      description: 'View sales data for different periods: week, month, quarter, or year. Analyze trends and seasonality.',
      position: 'bottom'
    },
    {
      target: '[data-tour="key-metrics"]',
      title: 'Key Metrics',
      description: 'Total revenue, orders, average order value, and top products. Monitor your business performance at a glance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="sales-chart"]',
      title: 'Sales Trends',
      description: 'Daily sales and revenue trends. Identify peak days and plan inventory accordingly.',
      position: 'top'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="sales-analytics" steps={tourSteps} />
      <div className="p-8">
      {/* Header */}
      <div data-tour="sales-header" className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Sales Analytics</h1>
          <p className="text-[#303A4D]/70">Comprehensive sales performance and trends</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchSalesAnalytics} 
            variant="outline"
            className="border-[#FED141] text-[#303A4D] hover:bg-[#FED141]/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            className="border-[#303A4D] text-[#303A4D]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div data-tour="time-range" className="flex gap-2 mb-6">
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
      <div data-tour="key-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-[#303A4D]">
            GH₵{Number(salesData.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
          <p className="text-xs text-green-600 mt-2">
            GH₵{Number(salesData.revenue_this_month || 0).toFixed(2)} this month
          </p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-[#303A4D]">{salesData.total_orders}</p>
          <p className="text-xs text-blue-600 mt-2">
            {salesData.sales_this_month || 0} this month
          </p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold text-[#303A4D]">
            GH₵{Number(salesData.average_order_value || 0).toFixed(2)}
          </p>
          <p className="text-xs text-[#303A4D]/60 mt-2">Per transaction</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-[#303A4D]/60 mb-1">Today's Sales</p>
          <p className="text-3xl font-bold text-[#303A4D]">
            GH₵{Number(salesData.revenue_today || 0).toFixed(2)}
          </p>
          <p className="text-xs text-[#303A4D]/60 mt-2">
            {salesData.sales_today || 0} orders
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Products */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-6">Top Selling Products</h2>
          {salesData.top_selling_products && salesData.top_selling_products.length > 0 ? (
            <div className="space-y-4">
              {salesData.top_selling_products.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-4 bg-[#F4F2E6] rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[#303A4D]">{product.product_name}</p>
                      <p className="text-sm text-[#303A4D]/60">{product.quantity_sold} units sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-[#303A4D]">
                    GH₵{Number(product.revenue || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
              <p className="text-[#303A4D]/60">No sales data available</p>
            </div>
          )}
        </Card>

        {/* Sales by Category */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-6">Sales by Category</h2>
          {salesData.sales_by_category && salesData.sales_by_category.length > 0 ? (
            <div className="space-y-4">
              {salesData.sales_by_category.map((category, index) => {
                const total = salesData.sales_by_category.reduce((sum, cat) => sum + Number(cat.revenue || 0), 0)
                const percentage = total > 0 ? ((Number(category.revenue || 0) / total) * 100).toFixed(1) : 0
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#303A4D]">{category.category}</span>
                      <span className="text-sm text-[#303A4D]/60">
                        GH₵{Number(category.revenue || 0).toFixed(2)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-[#FED141]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
              <p className="text-[#303A4D]/60">No category data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Daily Sales Trend - Area Chart */}
      {salesData.daily_sales && salesData.daily_sales.length > 0 && (
        <Card data-tour="sales-chart" className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-6">Daily Sales Trend</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={salesData.daily_sales}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `GH₵${value}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'revenue') {
                    return [`GH₵${Number(value).toFixed(2)}`, 'Revenue']
                  }
                  return [value, 'Orders']
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                name="Revenue"
                yAxisId="left"
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOrders)"
                name="Orders"
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
      </div>
    </>
  )
}
