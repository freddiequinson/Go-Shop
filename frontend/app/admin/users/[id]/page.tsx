"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, Ban, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function UserDetail({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("Active")

  // Mock user data
  const user = {
    id: params.id,
    name: "John Doe",
    email: "john@example.com",
    phone: "+233 24 123 4567",
    region: "Greater Accra",
    address: "123 Main Street, Accra, Ghana",
    role: "Buyer",
    status: status,
    joinDate: "2025-01-15",
    totalOrders: 12,
    totalSpent: 1245.5,
    recentOrders: [
      { id: "ORD-001", date: "2025-10-28", total: 125.5, status: "Pending" },
      { id: "ORD-002", date: "2025-10-20", total: 89.99, status: "Delivered" },
      { id: "ORD-003", date: "2025-10-15", total: 234.0, status: "Delivered" },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6 border-b-4 border-[#303A4D]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin/users" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-6 h-6 text-[#303A4D]" />
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
            <span className="text-[#303A4D] font-bold text-xl">Admin</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-[#FED141] flex items-center justify-center font-bold text-[#303A4D] text-3xl">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-5xl font-bold text-[#303A4D] mb-2">{user.name}</h1>
              <p className="text-xl text-[#303A4D]/70">Member since {user.joinDate}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {status === "Active" ? (
              <Button
                onClick={() => setStatus("Blocked")}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full font-bold"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block User
              </Button>
            ) : (
              <Button
                onClick={() => setStatus("Active")}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Details */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Email</p>
                    <p className="font-medium text-[#303A4D]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Phone</p>
                    <p className="font-medium text-[#303A4D]">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Region</p>
                    <p className="font-medium text-[#303A4D]">{user.region}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Address</p>
                    <p className="font-medium text-[#303A4D]">{user.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F4F2E6] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-[#303A4D]/60" />
                    <span className="text-[#303A4D]">Total Orders</span>
                  </div>
                  <span className="font-bold text-[#303A4D] text-xl">{user.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F4F2E6] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#303A4D]/60" />
                    <span className="text-[#303A4D]">Total Spent</span>
                  </div>
                  <span className="font-bold text-[#303A4D] text-xl">GH₵{user.totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#303A4D]">Role</span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${
                      user.role === "Seller" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#303A4D]">Status</span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${
                      status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Recent Orders</h2>

              <div className="space-y-4">
                {user.recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-6 bg-[#F4F2E6] rounded-2xl hover:bg-[#FED141]/20 transition-colors cursor-pointer">
                      <div>
                        <p className="font-bold text-[#303A4D] text-lg mb-1">{order.id}</p>
                        <p className="text-[#303A4D]/60">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#303A4D] text-xl mb-1">GH₵{order.total.toFixed(2)}</p>
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
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
