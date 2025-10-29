"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, MapPin, Calendar, CreditCard, Phone, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function OrderDetail({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("Pending")

  // Mock order data
  const order = {
    id: params.id,
    customer: "John Doe",
    email: "john@example.com",
    phone: "+233 24 123 4567",
    total: 125.5,
    status: status,
    date: "2025-10-28",
    deliveryDate: "2025-10-30 (Wednesday)",
    deliveryAddress: "123 Main Street, Accra, Ghana",
    paymentMethod: "MTN MoMo",
    items: [
      { name: "Fresh Red Apples", quantity: 2, unit: "2kg", price: 25.98, image: "/images/apple-inhand.jpg" },
      { name: "Organic Tomatoes", quantity: 3, unit: "3kg", price: 25.5, image: "/images/tomato.jpg" },
      { name: "Premium Rice", quantity: 1, unit: "5kg bag", price: 45.0, image: "/images/rice.jpg" },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6 border-b-4 border-[#303A4D]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin/orders" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-6 h-6 text-[#303A4D]" />
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
            <span className="text-[#303A4D] font-bold text-xl">Admin</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-[#303A4D] mb-2">Order {order.id}</h1>
            <p className="text-xl text-[#303A4D]/70">Placed on {order.date}</p>
          </div>

          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white rounded-full px-6 py-3 text-[#303A4D] font-bold focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option>Pending</option>
              <option>Processing</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <Button className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full font-bold">
              Update Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <Package className="w-6 h-6" />
                Order Items
              </h2>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[#F4F2E6] rounded-2xl">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#303A4D] mb-1">{item.name}</h3>
                      <p className="text-[#303A4D]/60 text-sm">
                        Quantity: {item.quantity} ({item.unit})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#303A4D] text-lg">GH₵{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t-2 border-[#F4F2E6]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#303A4D]/60">Subtotal</span>
                  <span className="font-bold text-[#303A4D]">GH₵{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#303A4D]/60">Delivery Fee</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-[#F4F2E6]">
                  <span className="text-xl font-bold text-[#303A4D]">Total</span>
                  <span className="text-2xl font-bold text-[#303A4D]">GH₵{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Email</p>
                    <p className="font-medium text-[#303A4D]">{order.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Phone</p>
                    <p className="font-medium text-[#303A4D]">{order.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Delivery Date</p>
                    <p className="font-medium text-[#303A4D]">{order.deliveryDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Address</p>
                    <p className="font-medium text-[#303A4D]">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Payment Information</h3>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-[#303A4D]/60 mt-1" />
                <div>
                  <p className="text-sm text-[#303A4D]/60">Payment Method</p>
                  <p className="font-medium text-[#303A4D]">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
