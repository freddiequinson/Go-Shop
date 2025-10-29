"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, TrendingUp, DollarSign, Star, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SellerDashboardPage() {
  const [stats] = useState({
    totalProducts: 12,
    totalSales: 145,
    revenue: 4250.5,
    averageRating: 4.7,
  })

  const [products] = useState([
    {
      id: "1",
      name: "Fresh Red Apples",
      price: 12.99,
      stock: 45,
      sold: 23,
      image: "/images/apple-inhand.jpg",
      status: "active",
    },
    {
      id: "2",
      name: "Organic Tomatoes",
      price: 8.5,
      stock: 30,
      sold: 18,
      image: "/images/tomato.jpg",
      status: "active",
    },
    {
      id: "3",
      name: "Rice (Jasmine)",
      price: 45.0,
      stock: 0,
      sold: 12,
      image: "/images/rice.jpg",
      status: "out_of_stock",
    },
  ])

  const [recentOrders] = useState([
    {
      id: "ORD-001",
      customer: "Ama Osei",
      product: "Fresh Red Apples",
      quantity: 2,
      total: 25.98,
      status: "delivered",
      date: "2024-10-27",
    },
    {
      id: "ORD-002",
      customer: "Kwame Mensah",
      product: "Organic Tomatoes",
      quantity: 3,
      total: 25.5,
      status: "processing",
      date: "2024-10-26",
    },
  ])

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Profile</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Seller Dashboard</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-[#303A4D]">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-[#303A4D]">{stats.totalSales}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-[#303A4D]">GH₵{stats.revenue.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-[#303A4D]">{stats.averageRating}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Products */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#303A4D]">My Products</h2>
                <Link href="/seller/products/new">
                  <Button className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#303A4D] mb-1">{product.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-[#303A4D]/60">
                        <span>Price: GH₵{product.price.toFixed(2)}</span>
                        <span>Stock: {product.stock}</span>
                        <span>Sold: {product.sold}</span>
                      </div>
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status === "active" ? "Active" : "Out of Stock"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-[#303A4D]/20 bg-transparent">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-[#303A4D]/20 bg-transparent">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 bg-transparent">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="space-y-6">
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#303A4D] text-sm">{order.id}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#303A4D] mb-1">{order.customer}</p>
                    <p className="text-sm text-[#303A4D]/60 mb-2">
                      {order.product} x{order.quantity}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#303A4D]/60">
                        {new Date(order.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-bold text-[#303A4D]">GH₵{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/seller/orders">
                <Button variant="outline" className="w-full mt-4 border-[#303A4D]/20 bg-transparent">
                  View All Orders
                </Button>
              </Link>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/seller/products/new">
                  <Button variant="outline" className="w-full justify-start border-[#303A4D]/20 bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
                <Link href="/seller/orders">
                  <Button variant="outline" className="w-full justify-start border-[#303A4D]/20 bg-transparent">
                    <Package className="w-4 h-4 mr-2" />
                    Manage Orders
                  </Button>
                </Link>
                <Link href="/seller/analytics">
                  <Button variant="outline" className="w-full justify-start border-[#303A4D]/20 bg-transparent">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
