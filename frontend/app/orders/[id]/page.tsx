"use client"

import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, MapPin, Calendar, CreditCard, Phone, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // Mock order data
  const order = {
    id: id,
    date: "2024-10-25",
    status: "delivered",
    total: 145.5,
    subtotal: 135.5,
    deliveryFee: 10.0,
    deliveryDate: "2024-10-27",
    paymentMethod: "MTN MoMo",
    customer: {
      name: "Kwame Mensah",
      phone: "+233 24 123 4567",
      email: "kwame.mensah@example.com",
      address: "123 Independence Avenue, Accra",
      region: "Greater Accra",
    },
    items: [
      {
        id: "1",
        name: "Fresh Tomatoes",
        image: "/ripe-tomatoes.png",
        quantity: 2,
        unit: "kg",
        price: 15.5,
      },
      {
        id: "2",
        name: "Rice (Jasmine)",
        image: "/bowl-of-steamed-rice.png",
        quantity: 5,
        unit: "kg",
        price: 45.0,
      },
      {
        id: "3",
        name: "Fresh Eggs",
        image: "/assorted-eggs.png",
        quantity: 1,
        unit: "dozen",
        price: 25.0,
      },
      {
        id: "4",
        name: "Cooking Oil",
        image: "/cooking-oil-variety.png",
        quantity: 2,
        unit: "liters",
        price: 50.0,
      },
    ],
    timeline: [
      { status: "Order Placed", date: "2024-10-25 10:30 AM", completed: true },
      { status: "Payment Confirmed", date: "2024-10-25 10:35 AM", completed: true },
      { status: "Processing", date: "2024-10-26 09:00 AM", completed: true },
      { status: "Out for Delivery", date: "2024-10-27 08:00 AM", completed: true },
      { status: "Delivered", date: "2024-10-27 11:45 AM", completed: true },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/orders" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Orders</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Order Details</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#303A4D] mb-1">{order.id}</h2>
                  <p className="text-gray-600">
                    Placed on{" "}
                    {new Date(order.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#303A4D]">Order Timeline</h3>
                <div className="relative">
                  {order.timeline.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.completed ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          {item.completed && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                        {index < order.timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-full absolute top-8 ${item.completed ? "bg-green-500" : "bg-gray-300"}`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium text-[#303A4D]">{item.status}</p>
                        <p className="text-sm text-gray-600">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#303A4D] mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#303A4D]">GH₵{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>GH₵{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>GH₵{order.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-[#303A4D] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>GH₵{order.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#303A4D] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Date</p>
                    <p className="font-medium text-[#303A4D]">
                      {new Date(order.deliveryDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium text-[#303A4D]">{order.customer.address}</p>
                    <p className="text-sm text-gray-600">{order.customer.region}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-[#303A4D]">{order.customer.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#303A4D]" />
                  <p className="font-medium text-[#303A4D]">{order.customer.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#303A4D]" />
                  <p className="font-medium text-[#303A4D]">{order.customer.email}</p>
                </div>
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h3>
              <p className="font-medium text-[#303A4D]">{order.paymentMethod}</p>
              <p className="text-sm text-green-600 mt-2">Payment Confirmed</p>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">Reorder Items</Button>
              <Button variant="outline" className="w-full border-[#303A4D]/20 bg-transparent">
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
