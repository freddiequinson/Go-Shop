"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Copy, Tag, TrendingUp, Calendar, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import apiClient from "@/lib/api/client"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  benefit_type: string
  discount_value: number | null
  discount_type: string | null
  free_delivery: boolean
  delivery_discount_percent: number | null
  delivery_discount_fixed: number | null
  wallet_credit_amount: number | null
  product_discount_percent: number | null
  product_discount_fixed: number | null
  min_order_amount: number | null
  max_discount_amount: number | null
  max_uses: number | null
  max_uses_per_user: number
  uses_count: number
  user_type_restriction: string | null
  first_order_only: boolean
  valid_from: string
  valid_until: string
  is_active: boolean
  is_public: boolean
  created_at: string
}

interface CouponStats {
  total_coupons: number
  active_coupons: number
  expired_coupons: number
  total_uses: number
}

export default function CouponsPage() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<CouponStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    if (user?.user_type?.toUpperCase() !== "ADMIN") {
      router.push("/")
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive"
      })
      return
    }
    
    loadCoupons()
    loadStats()
  }, [isAuthenticated, user])

  const loadCoupons = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get("/coupons/")
      setCoupons(response.data.coupons)
    } catch (error) {
      console.error("Failed to load coupons:", error)
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.get("/coupons/stats/overview")
      setStats(response.data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const toggleCouponStatus = async (couponId: string) => {
    try {
      await apiClient.post(`/coupons/${couponId}/toggle-status`)
      toast({
        title: "Success",
        description: "Coupon status updated"
      })
      loadCoupons()
      loadStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive"
      })
    }
  }

  const deleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) {
      return
    }

    try {
      await apiClient.delete(`/coupons/${couponId}`)
      toast({
        title: "Success",
        description: "Coupon deleted successfully"
      })
      loadCoupons()
      loadStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete coupon",
        variant: "destructive"
      })
    }
  }

  const duplicateCoupon = async (couponId: string, originalCode: string) => {
    const newCode = prompt(`Enter new code for duplicate of "${originalCode}":`)
    if (!newCode) return

    try {
      await apiClient.post(`/coupons/${couponId}/duplicate`, { new_code: newCode })
      toast({
        title: "Success",
        description: `Coupon duplicated as "${newCode}"`
      })
      loadCoupons()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to duplicate coupon",
        variant: "destructive"
      })
    }
  }

  const getBenefitDisplay = (coupon: Coupon) => {
    switch (coupon.benefit_type) {
      case "free_delivery":
        return "🚚 Free Delivery"
      case "delivery_discount":
        if (coupon.delivery_discount_percent) {
          return `📦 ${coupon.delivery_discount_percent}% off delivery`
        }
        return `📦 GHS ${coupon.delivery_discount_fixed} off delivery`
      case "wallet_credit":
        return `💰 GHS ${coupon.wallet_credit_amount} wallet credit`
      case "product_discount":
        if (coupon.product_discount_percent) {
          return `🛍️ ${coupon.product_discount_percent}% off order`
        }
        return `🛍️ GHS ${coupon.product_discount_fixed} off order`
      case "specific_product":
        return `🎯 Discount on specific products`
      default:
        return coupon.benefit_type
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const filteredCoupons = coupons.filter(coupon => {
    if (filter === "active") {
      return coupon.is_active && !isExpired(coupon.valid_until)
    }
    if (filter === "expired") {
      return isExpired(coupon.valid_until)
    }
    return true
  })

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="coupons-header"]',
      title: 'Coupon Management',
      description: 'Create and manage discount coupons for customers. Drive sales with percentage discounts, fixed amounts, free delivery, or wallet credits.',
      position: 'bottom'
    },
    {
      target: '[data-tour="create-coupon"]',
      title: 'Create New Coupon',
      description: 'Set coupon code, discount type (percentage/fixed), amount, expiry date, and usage limits. Track redemptions and effectiveness.',
      position: 'left'
    },
    {
      target: '[data-tour="coupon-stats"]',
      title: 'Coupon Statistics',
      description: 'Quick overview: total coupons, active coupons, expired coupons, and total redemptions. Monitor your promotion performance.',
      position: 'bottom'
    },
    {
      target: '[data-tour="coupon-list"]',
      title: 'Active Coupons',
      description: 'All coupons with status (active/expired), usage count, and remaining uses. Deactivate, edit, or duplicate coupons as needed.',
      position: 'bottom'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="coupons" steps={tourSteps} />
      <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div data-tour="coupons-header" className="bg-[#303A4D] text-white px-6 py-8">
        <div className="w-full px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Coupon Management</h1>
              <p className="text-white/70">Create and manage discount coupons</p>
            </div>
            <Button
              data-tour="create-coupon"
              onClick={() => router.push("/admin/coupons/new")}
              className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div data-tour="coupon-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Coupons</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{stats.total_coupons}</p>
                </div>
                <Tag className="w-8 h-8 text-[#FED141]" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_coupons}</p>
                </div>
                <ToggleRight className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired_coupons}</p>
                </div>
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Uses</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{stats.total_uses}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#FED141]" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
            >
              All Coupons
            </Button>
            <Button
              onClick={() => setFilter("active")}
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
            >
              Active
            </Button>
            <Button
              onClick={() => setFilter("expired")}
              variant={filter === "expired" ? "default" : "outline"}
              size="sm"
            >
              Expired
            </Button>
          </div>
        </div>

        {/* Coupons List */}
        <div data-tour="coupon-list" className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No coupons found</p>
              <Button onClick={() => router.push("/admin/coupons/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Coupon
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benefit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-[#FED141]/20 text-[#303A4D] rounded font-mono text-sm font-bold">
                            {coupon.code}
                          </code>
                          {!coupon.is_public && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Private</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{coupon.name}</div>
                          {coupon.description && (
                            <div className="text-sm text-gray-500">{coupon.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{getBenefitDisplay(coupon)}</div>
                        {coupon.min_order_amount && (
                          <div className="text-xs text-gray-500">Min: GHS {coupon.min_order_amount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium">{coupon.uses_count}</span>
                          {coupon.max_uses && <span className="text-gray-500"> / {coupon.max_uses}</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {coupon.max_uses_per_user} per user
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {new Date(coupon.valid_until).toLocaleDateString()}
                        </div>
                        {isExpired(coupon.valid_until) && (
                          <span className="text-xs text-red-600">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {coupon.is_active && !isExpired(coupon.valid_until) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => toggleCouponStatus(coupon.id)}
                            variant="ghost"
                            size="sm"
                            title={coupon.is_active ? "Deactivate" : "Activate"}
                          >
                            {coupon.is_active ? (
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}
                            variant="ghost"
                            size="sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => duplicateCoupon(coupon.id, coupon.code)}
                            variant="ghost"
                            size="sm"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => deleteCoupon(coupon.id, coupon.code)}
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
      </div>
    </>
  )
}
