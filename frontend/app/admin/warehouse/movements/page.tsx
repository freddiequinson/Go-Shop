"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Package } from "lucide-react"

interface Movement {
  id: string
  product_id: string
  movement_type: string
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_at: string
  product?: { name: string }
}

export default function WarehouseMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/movements`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMovements(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch movements:", error)
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const filteredMovements = filterType === "all" 
    ? movements 
    : movements.filter(m => m.movement_type.toLowerCase() === filterType.toLowerCase())

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Inventory Movements</h1>
        <p className="text-[#303A4D]/70">Track all inventory movements</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
        >
          <option value="all">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
          <option value="adjustment">Adjustment</option>
          <option value="return">Return</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Product</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Reference</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303A4D]/10">
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">
                      {new Date(movement.created_at).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#303A4D]">{movement.product?.name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {movement.movement_type === 'IN' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        movement.movement_type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {movement.movement_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#303A4D]">{movement.quantity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">{movement.reference_type || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]/70">{movement.notes || '-'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMovements.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
            <p className="text-[#303A4D]/60">No movements found</p>
          </div>
        )}
      </div>
    </div>
  )
}
