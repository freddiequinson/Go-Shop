"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddRiderPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    vehicle_type: "MOTORCYCLE",
    vehicle_number: "",
    license_number: "",
    address: ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/riders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push("/admin/riders")
      } else {
        alert("Failed to create rider")
      }
    } catch (error) {
      console.error("Error creating rider:", error)
      alert("Error creating rider")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Add New Rider</h1>
        <p className="text-[#303A4D]/70">Register a new delivery rider</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="+233 24 123 4567"
                required
              />
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="rider@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Vehicle Type</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="BICYCLE">Bicycle</option>
              <option value="CAR">Car</option>
              <option value="VAN">Van</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="e.g., GR 1234-20"
                required
              />
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">License Number</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="License number"
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
              placeholder="Rider address..."
              required
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-6 font-bold text-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Rider"}
            </Button>
            <Link href="/admin/riders" className="flex-1">
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
