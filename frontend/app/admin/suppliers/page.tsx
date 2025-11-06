"use client"

import { useEffect, useState } from "react"
import { Building2, Star, CheckCircle, Plus, Search } from "lucide-react"
import Link from "next/link"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

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
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers?per_page=50`, {
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
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${supplierId}/verify`,
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

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="suppliers-header"]',
      title: 'Supplier Management',
      description: 'Manage your supplier network. Suppliers provide products that you can order through supply requests. Verify suppliers before accepting their offers.',
      position: 'bottom'
    },
    {
      target: '[data-tour="add-supplier"]',
      title: 'Add New Supplier',
      description: 'Register new suppliers with their business details, contact info, and specialization. Suppliers can then submit offers for your supply requests.',
      position: 'left'
    },
    {
      target: '[data-tour="supplier-stats"]',
      title: 'Supplier Statistics',
      description: 'Quick overview: total suppliers, verified suppliers, pending verification, and average supplier rating. Monitor your supplier network quality.',
      position: 'bottom'
    },
    {
      target: '[data-tour="search-suppliers"]',
      title: 'Search Suppliers',
      description: 'Search suppliers by name or supplier code. Quickly find specific suppliers to view details or create supply requests.',
      position: 'bottom'
    },
    {
      target: '[data-tour="supplier-list"]',
      title: 'Supplier Directory',
      description: 'All suppliers with verification status, ratings, and performance metrics. Click any supplier to view details, products, and create direct orders.',
      position: 'bottom'
    },
    {
      target: '[data-tour="verify-supplier"]',
      title: 'Verify Supplier',
      description: 'Verify new suppliers after reviewing their credentials. Only verified suppliers can submit offers and fulfill supply requests.',
      position: 'left'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="suppliers" steps={tourSteps} />
      <div>
      <div data-tour="suppliers-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Suppliers</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your supplier network</p>
        </div>
        <Link href="/admin/suppliers/new">
          <button data-tour="add-supplier" className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#F1B424] transition-colors">
            <Plus className="w-5 h-5" />
            Add Supplier
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div data-tour="supplier-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div data-tour="search-suppliers" className="bg-white rounded-3xl p-6 shadow-sm mb-6">
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

      {/* Suppliers Table */}
      <div data-tour="supplier-list" className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
            <p className="text-xl font-bold text-[#303A4D]">No Suppliers Found</p>
            <p className="text-[#303A4D]/60">Try adjusting your search or add a new supplier</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4F2E6]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Supplier</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Contact</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Rating</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Supplies</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">On-Time</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-[#303A4D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F2E6]">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FED141] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#303A4D]" />
                        </div>
                        <div>
                          <div className="font-bold text-[#303A4D]">{supplier.name}</div>
                          <div className="text-sm text-[#303A4D]/60">{supplier.supplier_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                        {supplier.supplier_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-[#303A4D]">{supplier.email || "—"}</div>
                        <div className="text-[#303A4D]/60">{supplier.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-[#303A4D]">{Number(supplier.rating).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-[#303A4D]">{supplier.total_supplies}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-green-600">
                        {Number(supplier.on_time_delivery_rate).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {supplier.verification_status === "VERIFIED" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : supplier.verification_status === "PENDING" ? (
                        <button
                          data-tour="verify-supplier"
                          onClick={() => verifySupplier(supplier.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold hover:bg-yellow-200 transition-colors"
                        >
                          Pending
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold capitalize">
                          {supplier.verification_status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/suppliers/${supplier.id}`}>
                          <button className="px-3 py-1.5 bg-[#303A4D] text-white rounded-lg text-xs font-semibold hover:bg-[#303A4D]/90 transition-colors">
                            View
                          </button>
                        </Link>
                        <Link href={`/admin/warehouse/grn?supplier_id=${supplier.id}`}>
                          <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            GRN
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
