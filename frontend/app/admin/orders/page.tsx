"use client"

import { Button } from "@/components/ui/button"
import { Search, ArrowLeft, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const orders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john@example.com",
    phone: "+233 24 123 4567",
    total: 125.5,
    status: "Pending",
    date: "2025-10-28",
    deliveryDate: "2025-10-30",
    paymentMethod: "MTN MoMo",
    items: [
      { name: "Fresh Red Apples", quantity: 2, price: 25.98 },
      { name: "Organic Tomatoes", quantity: 3, price: 25.5 },
    ],
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    phone: "+233 24 234 5678",
    total: 89.99,
    status: "Delivered",
    date: "2025-10-27",
    deliveryDate: "2025-10-29",
    paymentMethod: "Telecel Cash",
    items: [{ name: "Premium Rice", quantity: 2, price: 90.0 }],
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    email: "mike@example.com",
    phone: "+233 24 345 6789",
    total: 234.0,
    status: "Processing",
    date: "2025-10-27",
    deliveryDate: "2025-10-30",
    paymentMethod: "Paystack",
    items: [
      { name: "Family Grocery Bundle", quantity: 2, price: 179.98 },
      { name: "Fresh Groundnuts", quantity: 3, price: 45.0 },
    ],
  },
  {
    id: "ORD-004",
    customer: "Sarah Williams",
    email: "sarah@example.com",
    phone: "+233 24 456 7890",
    total: 67.5,
    status: "Delivered",
    date: "2025-10-26",
    deliveryDate: "2025-10-28",
    paymentMethod: "AT Cash",
    items: [
      { name: "Fresh Bananas", quantity: 5, price: 32.5 },
      { name: "Garden Herbs Mix", quantity: 7, price: 35.0 },
    ],
  },
]

export default function OrdersManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6 border-b-4 border-[#303A4D]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-6 h-6 text-[#303A4D]" />
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
            <span className="text-[#303A4D] font-bold text-xl">Admin</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-[#303A4D] mb-4">Order Management</h1>
          <p className="text-xl text-[#303A4D]/70">View and manage customer orders</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#303A4D]/60" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full px-12 py-4 text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            />
          </div>

          <div className="flex gap-3">
            {["All", "Pending", "Processing", "Delivered"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  statusFilter === status ? "bg-[#303A4D] text-white" : "bg-white text-[#303A4D] hover:bg-[#FED141]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#F4F2E6]">
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Order ID</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Customer</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Total</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Payment</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Status</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Date</th>
                  <th className="text-left py-4 px-4 text-[#303A4D]/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#303A4D]">{order.id}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-[#303A4D]">{order.customer}</p>
                        <p className="text-sm text-[#303A4D]/60">{order.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-[#303A4D]">GH₵{order.total.toFixed(2)}</td>
                    <td className="py-4 px-4 text-[#303A4D]">{order.paymentMethod}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#303A4D]/60">{order.date}</td>
                    <td className="py-4 px-4">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
