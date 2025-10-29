"use client"

import { useEffect, useState } from "react"
import { Package, ShoppingCart, Users, TrendingUp, Warehouse, Truck, AlertTriangle, Plus } from "lucide-react"
import Link from "next/link"

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
      const response = await fetch("http://localhost:8000/api/v1/admin/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
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
        <div className="text-2xl font-bold text-[#303A4D]">Loading...</div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} active`,
      icon: Package,
      color: "bg-blue-500",
      href: "/admin/products"
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      subtitle: `${stats?.pending_orders || 0} pending`,
      icon: ShoppingCart,
      color: "bg-green-500",
      href: "/admin/orders"
    },
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      subtitle: `${stats?.new_users_today || 0} new today`,
      icon: Users,
      color: "bg-purple-500",
      href: "/admin/users"
    },
    {
      title: "Revenue (Month)",
      value: `GH₵${stats?.revenue_this_month ? Number(stats.revenue_this_month).toFixed(2) : "0.00"}`,
      subtitle: `GH₵${stats?.revenue_today ? Number(stats.revenue_today).toFixed(2) : "0.00"} today`,
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/admin/analytics/revenue"
    },
    {
      title: "Low Stock Items",
      value: stats?.low_stock_products || 0,
      subtitle: `${stats?.out_of_stock_products || 0} out of stock`,
      icon: AlertTriangle,
      color: "bg-red-500",
      href: "/admin/warehouse/alerts"
    },
    {
      title: "Active Deliveries",
      value: stats?.active_deliveries || 0,
      subtitle: `${stats?.available_riders || 0} riders available`,
      icon: Truck,
      color: "bg-indigo-500",
      href: "/admin/riders/assignments"
    }
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Dashboard</h1>
        <p className="text-lg text-[#303A4D]/70">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-[#303A4D]/60 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-[#303A4D] mb-1">{stat.value}</p>
              <p className="text-sm text-[#303A4D]/50">{stat.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/products/new">
          <div className="bg-[#FED141] rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group">
            <div className="w-14 h-14 bg-[#303A4D] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#303A4D] mb-1">Add Product</h3>
            <p className="text-[#303A4D]/70 text-sm">Add new products to inventory</p>
          </div>
        </Link>

        <Link href="/admin/warehouse/restock">
          <div className="bg-white rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-[#FED141]">
            <div className="w-14 h-14 bg-[#FED141] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Warehouse className="w-7 h-7 text-[#303A4D]" />
            </div>
            <h3 className="text-xl font-bold text-[#303A4D] mb-1">Restock Items</h3>
            <p className="text-[#303A4D]/70 text-sm">Create restock orders</p>
          </div>
        </Link>

        <Link href="/admin/riders/assignments">
          <div className="bg-white rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-[#FED141]">
            <div className="w-14 h-14 bg-[#FED141] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Truck className="w-7 h-7 text-[#303A4D]" />
            </div>
            <h3 className="text-xl font-bold text-[#303A4D] mb-1">Assign Deliveries</h3>
            <p className="text-[#303A4D]/70 text-sm">Manage rider assignments</p>
          </div>
        </Link>
      </div>

      {/* Alerts Section */}
      {(stats?.low_stock_products || 0) > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-xl font-bold text-red-900">Stock Alerts</h3>
              <p className="text-red-700">
                You have {stats?.low_stock_products} products with low stock and {stats?.out_of_stock_products} out of stock items.
              </p>
            </div>
            <Link href="/admin/warehouse/alerts" className="ml-auto">
              <button className="px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors">
                View Alerts
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
