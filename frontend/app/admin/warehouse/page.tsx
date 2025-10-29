"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle, TrendingDown, Search, Filter } from "lucide-react"
import Link from "next/link"

interface InventoryItem {
  id: string
  product_id: string
  quantity_available: number
  quantity_reserved: number
  reorder_level: number
  zone: string
  cost_price: number
  total_value: number
}

export default function WarehousePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchInventory()
  }, [filter])

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = "http://localhost:8000/api/v1/warehouse/inventory?per_page=50"
      
      if (filter === "low_stock") {
        url += "&low_stock_only=true"
      } else if (filter === "out_of_stock") {
        url += "&out_of_stock_only=true"
      }

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_available === 0) return { text: "Out of Stock", color: "bg-red-100 text-red-700" }
    if (item.quantity_available <= item.reorder_level) return { text: "Low Stock", color: "bg-yellow-100 text-yellow-700" }
    return { text: "In Stock", color: "bg-green-100 text-green-700" }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Inventory</h1>
        <p className="text-lg text-[#303A4D]/70">Manage your warehouse stock and inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Items</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">
            {inventory.filter(i => i.quantity_available <= i.reorder_level && i.quantity_available > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[#303A4D]/60">Out of Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">
            {inventory.filter(i => i.quantity_available === 0).length}
          </p>
        </div>
        <Link href="/admin/warehouse/restock">
          <div className="bg-[#FED141] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-[#303A4D]" />
              <span className="text-sm text-[#303A4D]/80">Restock Orders</span>
            </div>
            <p className="text-2xl font-bold text-[#303A4D]">Create New →</p>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "all" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("low_stock")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "low_stock" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter("out_of_stock")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "out_of_stock" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Product ID</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Zone</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Available</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Reserved</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Reorder Level</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Status</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Value</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.id} className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-[#303A4D]">{item.product_id.substring(0, 8)}...</td>
                    <td className="py-4 px-6 text-[#303A4D]">{item.zone || "N/A"}</td>
                    <td className="py-4 px-6 font-bold text-[#303A4D]">{item.quantity_available}</td>
                    <td className="py-4 px-6 text-[#303A4D]/60">{item.quantity_reserved}</td>
                    <td className="py-4 px-6 text-[#303A4D]/60">{item.reorder_level}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#303A4D]">
                      GH₵{item.total_value?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
