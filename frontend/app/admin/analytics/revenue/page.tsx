"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, DollarSign, Calendar, RefreshCw, Download,
  ArrowUpRight, ArrowDownRight, Package, ShoppingCart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface RevenueData {
  total_revenue: number
  revenue_today: number
  revenue_this_week: number
  revenue_this_month: number
  average_order_value: number
  total_orders: number
  daily_revenue: Array<{
    date: string
    revenue: number
    orders: number
  }>
  monthly_revenue: Array<{
    month: string
    revenue: number
    orders: number
  }>
  revenue_by_category: Array<{
    category: string
    revenue: number
    percentage: number
  }>
}

export default function RevenueAnalyticsPage() {
  const { toast } = useToast()
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")

  useEffect(() => {
    fetchRevenueAnalytics()
  }, [timeRange])

  const fetchRevenueAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        setError("Not authenticated")
        return
      }
      
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 }
      const days = daysMap[timeRange]
      
      const response = await fetch(`http://localhost:8000/api/v1/admin/analytics/sales?days=${days}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Transform sales data to revenue data format
        const transformedData: RevenueData = {
          total_revenue: data.total_revenue || 0,
          revenue_today: data.revenue_today || 0,
          revenue_this_week: data.revenue_this_week || 0,
          revenue_this_month: data.revenue_this_month || 0,
          average_order_value: data.average_order_value || 0,
          total_orders: data.total_orders || 0,
          daily_revenue: data.daily_sales || [],
          monthly_revenue: [], // Can be calculated from daily if needed
          revenue_by_category: (data.sales_by_category || []).map((cat: any) => ({
            category: cat.category,
            revenue: cat.revenue,
            percentage: data.total_revenue > 0 ? (cat.revenue / data.total_revenue) * 100 : 0
          }))
        }
        
        setRevenueData(transformedData)
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
      console.error("Failed to fetch revenue analytics:", error)
      setError("Failed to load revenue data")
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="revenue-header"]',
      title: 'Revenue Analytics',
      description: 'Track your business revenue across different time periods. Monitor growth trends and identify opportunities.',
      position: 'bottom'
    },
    {
      target: '[data-tour="time-range"]',
      title: 'Time Period Selection',
      description: 'Switch between week, month, quarter, or year views to analyze revenue trends over different periods.',
      position: 'bottom'
    },
    {
      target: '[data-tour="revenue-metrics"]',
      title: 'Key Revenue Metrics',
      description: 'View total revenue, daily/weekly/monthly breakdowns, and average order value at a glance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="revenue-chart"]',
      title: 'Revenue Trends',
      description: 'Visualize daily revenue trends to identify peak sales days and seasonal patterns.',
      position: 'top'
    }
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#FED141] animate-spin mx-auto mb-4" />
          <p className="text-lg text-[#303A4D]">Loading revenue analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchRevenueAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!revenueData) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#303A4D]/60 mb-4">No revenue data available</p>
        <Button onClick={fetchRevenueAnalytics} className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Load Analytics
        </Button>
      </div>
    )
  }

  // Calculate growth percentages
  const weeklyGrowth = revenueData.revenue_this_week > 0 && revenueData.revenue_today > 0
    ? ((revenueData.revenue_today / (revenueData.revenue_this_week / 7)) - 1) * 100
    : 0

  return (
    <>
      <OnboardingTour tourId="revenue-analytics" steps={tourSteps} />
      <div className="p-8 bg-[#F4F2E6] min-h-screen">
        {/* Header */}
        <div data-tour="revenue-header" className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Revenue Analytics</h1>
            <p className="text-[#303A4D]/70">Track and analyze your business revenue</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchRevenueAnalytics} 
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
        <div data-tour="revenue-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-[#303A4D]/60 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-[#303A4D]">
              GH₵{Number(revenueData.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-xs text-green-600 mt-2">
              All time revenue
            </p>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              {weeklyGrowth >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-[#303A4D]/60 mb-1">Today's Revenue</p>
            <p className="text-3xl font-bold text-[#303A4D]">
              GH₵{Number(revenueData.revenue_today || 0).toFixed(2)}
            </p>
            <p className={`text-xs mt-2 ${weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}% vs daily avg
            </p>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-[#303A4D]/60 mb-1">This Month</p>
            <p className="text-3xl font-bold text-[#303A4D]">
              GH₵{Number(revenueData.revenue_this_month || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Last 30 days
            </p>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-[#303A4D]/60 mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold text-[#303A4D]">
              GH₵{Number(revenueData.average_order_value || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {revenueData.total_orders} total orders
            </p>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        {revenueData.daily_revenue && revenueData.daily_revenue.length > 0 && (
          <Card data-tour="revenue-chart" className="p-6 bg-white mb-8">
            <h2 className="text-xl font-bold text-[#303A4D] mb-6">Daily Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={revenueData.daily_revenue}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#303A4D"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#303A4D"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `GH₵${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`GH₵${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Revenue by Category */}
        {revenueData.revenue_by_category && revenueData.revenue_by_category.length > 0 && (
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold text-[#303A4D] mb-6">Revenue by Category</h2>
            <div className="space-y-4">
              {revenueData.revenue_by_category.map((cat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#303A4D]">{cat.category}</span>
                      <span className="text-sm text-gray-600">
                        GH₵{cat.revenue.toFixed(2)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FED141]"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
