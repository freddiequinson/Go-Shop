"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddSupplierPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/suppliers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push("/admin/suppliers")
      } else {
        alert("Failed to create supplier")
      }
    } catch (error) {
      console.error("Error creating supplier:", error)
      alert("Error creating supplier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Add New Supplier</h1>
        <p className="text-[#303A4D]/70">Register a new supplier</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Supplier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., Fresh Farms Ltd"
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Contact Person</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="supplier@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="+233 24 123 4567"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-24"
              placeholder="Supplier address..."
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-24"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-6 font-bold text-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Supplier"}
            </Button>
            <Link href="/admin/suppliers" className="flex-1">
              <Button
                type="button"
                className="w-full bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-6 font-bold text-lg border-2 border-[#303A4D]"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
