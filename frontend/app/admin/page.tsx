"use client"

import { useEffect, useState } from "react"
import { Package, ShoppingCart, Users, TrendingUp, Warehouse, Truck, AlertTriangle, Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface DashboardStats {
  total_products: number
  active_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  cancelled_orders: number
  total_users: number
  active_users: number
  new_users_today: number
  total_revenue: number
  revenue_today: number
  revenue_this_week: number
  revenue_this_month: number
  total_deliveries: number
  active_deliveries: number
  total_riders: number
  available_riders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/admin/dashboard`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Dashboard stats received:", data)
        console.log("Revenue this month:", data.revenue_this_month)
        console.log("Revenue today:", data.revenue_today)
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#FED141] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-semibold text-[#303A4D]">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="header"]',
      title: 'Welcome to Your Dashboard!',
      description: 'This is your command center. Here you can see an overview of your entire store including products, orders, users, revenue, and more.',
      position: 'bottom'
    },
    {
      target: '[data-tour="stats"]',
      title: 'Key Metrics at a Glance',
      description: 'These cards show your most important business metrics. Click any card to dive deeper into that section. They update in real-time as your business grows.',
      position: 'bottom'
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions',
      description: 'Use these shortcuts to perform common tasks quickly. Add products, create restock orders, or assign deliveries without navigating through menus.',
      position: 'top'
    },
    {
      target: '[data-tour="alerts"]',
      title: 'Stock Alerts',
      description: 'Get notified when products are running low or out of stock. Take immediate action to restock and keep your customers happy.',
      position: 'top'
    },
    {
      target: '[data-tour="order-status"]',
      title: 'Order Status Summary',
      description: 'Track your orders at a glance. See pending orders that need processing, completed orders, and any cancellations.',
      position: 'top'
    }
  ]

  const statCards = [
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} active`,
      icon: Package,
      color: "bg-[#303A4D]",
      href: "/admin/products"
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      subtitle: `${stats?.pending_orders || 0} pending`,
      icon: ShoppingCart,
      color: "bg-[#303A4D]",
      href: "/admin/orders"
    },
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      subtitle: `${stats?.new_users_today || 0} new today`,
      icon: Users,
      color: "bg-[#303A4D]",
      href: "/admin/users"
    },
    {
      title: "Revenue (Month)",
      value: `GH₵${stats?.revenue_this_month ? Number(stats.revenue_this_month).toFixed(2) : "0.00"}`,
      subtitle: `GH₵${stats?.revenue_today ? Number(stats.revenue_today).toFixed(2) : "0.00"} today`,
      icon: TrendingUp,
      color: "bg-[#303A4D]",
      href: "/admin/analytics/revenue"
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_products || 0,
      subtitle: `${stats?.out_of_stock_products || 0} out of stock`,
      icon: AlertTriangle,
      color: "bg-[#303A4D]",
      href: "/admin/warehouse/low-stock"
    },
    {
      title: "Active Deliveries",
      value: stats?.active_deliveries || 0,
      subtitle: `${stats?.available_riders || 0} riders available`,
      icon: Truck,
      color: "bg-[#303A4D]",
      href: "/admin/riders/assignments"
    }
  ]

  return (
    <>
      <OnboardingTour tourId="dashboard" steps={tourSteps} />
      
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Header */}
        <div data-tour="header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-[#303A4D] mb-1 md:mb-2">Dashboard</h1>
            <p className="text-sm md:text-lg text-[#303A4D]/70">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs md:text-sm text-[#303A4D]/60">Last updated</p>
            <p className="text-xs md:text-sm font-semibold text-[#303A4D]">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div data-tour="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#FED141] group">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className={`${stat.color} w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-[#303A4D]/30 group-hover:text-[#FED141] transition-colors" />
              </div>
              <h3 className="text-[#303A4D]/60 text-xs md:text-sm font-semibold mb-1 md:mb-2 uppercase tracking-wide">{stat.title}</h3>
              <p className="text-2xl md:text-3xl font-bold text-[#303A4D] mb-1 md:mb-2">{stat.value}</p>
              <p className="text-xs md:text-sm text-[#303A4D]/60">
                {stat.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div data-tour="quick-actions">
        <h2 className="text-xl md:text-2xl font-bold text-[#303A4D] mb-3 md:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Link href="/admin/products/new">
            <div className="bg-gradient-to-br from-[#FED141] to-[#FED141]/80 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#303A4D] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-1 md:mb-2">Add Product</h3>
              <p className="text-[#303A4D]/70 text-xs md:text-sm">Add new products to inventory</p>
            </div>
          </Link>

          <Link href="/admin/warehouse/restock">
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-gray-100 hover:border-[#FED141]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#303A4D] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Warehouse className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-1 md:mb-2">Restock Items</h3>
              <p className="text-[#303A4D]/70 text-xs md:text-sm">Create restock orders</p>
            </div>
          </Link>

          <Link href="/admin/riders/assignments">
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-gray-100 hover:border-[#FED141]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#303A4D] rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-1 md:mb-2">Assign Deliveries</h3>
              <p className="text-[#303A4D]/70 text-xs md:text-sm">Manage rider assignments</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Alerts Section */}
        {(stats?.low_stock_products || 0) > 0 ? (
          <div data-tour="alerts" className="bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-1 md:mb-2">Stock Alerts</h3>
                <p className="text-sm md:text-base text-[#303A4D]/70 mb-3 md:mb-4">
                  You have <span className="font-bold text-red-600">{stats?.low_stock_products}</span> products with low stock and <span className="font-bold text-red-600">{stats?.out_of_stock_products}</span> out of stock items.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <Link href="/admin/warehouse/low-stock" className="flex-1 sm:flex-none">
                    <button className="w-full sm:w-auto px-4 md:px-6 py-2 bg-[#303A4D] text-white rounded-lg text-sm md:text-base font-semibold hover:bg-[#303A4D]/90 transition-colors">
                      View Products
                    </button>
                  </Link>
                  <Link href="/admin/warehouse/alerts" className="flex-1 sm:flex-none">
                    <button className="w-full sm:w-auto px-4 md:px-6 py-2 bg-white border-2 border-[#303A4D] text-[#303A4D] rounded-lg text-sm md:text-base font-semibold hover:bg-gray-50 transition-colors">
                      View Alerts
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-1 md:mb-2">All Good!</h3>
                <p className="text-sm md:text-base text-[#303A4D]/70">
                  No stock alerts at the moment. All products are well stocked.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Status Summary */}
        <div data-tour="order-status" className="bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-[#303A4D] mb-3 md:mb-4">Order Status</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#303A4D]/60" />
                <span className="text-sm md:text-base font-semibold text-[#303A4D]">Pending Orders</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#303A4D]">{stats?.pending_orders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <span className="text-sm md:text-base font-semibold text-[#303A4D]">Completed Orders</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#303A4D]">{stats?.completed_orders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                <span className="text-sm md:text-base font-semibold text-[#303A4D]">Cancelled Orders</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#303A4D]">{stats?.cancelled_orders || 0}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
