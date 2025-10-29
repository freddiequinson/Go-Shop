"use client"

import { useEffect, useState } from "react"
import { Building2, Star, CheckCircle, Plus, Search } from "lucide-react"
import Link from "next/link"

interface Supplier {
  id: string
  supplier_code: string
  name: string
  supplier_type: string
  verification_status: string
  rating: number
  total_supplies: number
  on_time_delivery_rate: number
  is_active: boolean
  phone: string
  email: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/v1/suppliers?per_page=50", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifySupplier = async (supplierId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `http://localhost:8000/api/v1/suppliers/${supplierId}/verify`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error("Failed to verify supplier:", error)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const verifiedSuppliers = suppliers.filter(s => s.verification_status === "VERIFIED")
  const pendingSuppliers = suppliers.filter(s => s.verification_status === "PENDING")

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Suppliers</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your supplier network</p>
        </div>
        <Link href="/admin/suppliers/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors">
            <Plus className="w-5 h-5" />
            Add Supplier
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Suppliers</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[#303A4D]/60">Verified</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{verifiedSuppliers.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Pending</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{pendingSuppliers.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[#303A4D]/60">Avg Rating</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">
            {suppliers.length > 0 ? (suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1) : "0.0"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search suppliers by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#FED141] rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#303A4D]" />
              </div>
              {supplier.verification_status === "VERIFIED" ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <button
                  onClick={() => verifySupplier(supplier.id)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold hover:bg-yellow-200 transition-colors"
                >
                  Verify
                </button>
              )}
            </div>

            <h3 className="text-xl font-bold text-[#303A4D] mb-1">{supplier.name}</h3>
            <p className="text-sm text-[#303A4D]/60 mb-4">{supplier.supplier_code}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-[#303A4D]">{supplier.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">Total Supplies</span>
                <span className="font-bold text-[#303A4D]">{supplier.total_supplies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#303A4D]/60">On-Time Rate</span>
                <span className="font-bold text-green-600">{supplier.on_time_delivery_rate.toFixed(0)}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F4F2E6]">
              <div className="text-xs text-[#303A4D]/60 mb-1">Contact</div>
              <div className="text-sm text-[#303A4D]">{supplier.email}</div>
              <div className="text-sm text-[#303A4D]">{supplier.phone}</div>
            </div>

            <Link href={`/admin/suppliers/${supplier.id}`}>
              <button className="w-full mt-4 px-4 py-2 bg-[#303A4D] text-white rounded-full font-bold hover:bg-[#303A4D]/90 transition-colors">
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Building2 className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-xl font-bold text-[#303A4D]">No Suppliers Found</p>
          <p className="text-[#303A4D]/60">Try adjusting your search or add a new supplier</p>
        </div>
      )}
    </div>
  )
}
