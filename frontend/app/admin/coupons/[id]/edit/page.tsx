"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import apiClient from "@/lib/api/client"

export default function EditCouponPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const couponId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    loadCoupon()
  }, [couponId])

  const loadCoupon = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/coupons/${couponId}`)
      const coupon = response.data
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || "",
        benefit_type: coupon.benefit_type,
        
        // Delivery
        free_delivery: coupon.free_delivery,
        delivery_discount_percent: coupon.delivery_discount_percent?.toString() || "",
        delivery_discount_fixed: coupon.delivery_discount_fixed?.toString() || "",
        
        // Wallet
        wallet_credit_amount: coupon.wallet_credit_amount?.toString() || "",
        
        // Product discount
        product_discount_percent: coupon.product_discount_percent?.toString() || "",
        product_discount_fixed: coupon.product_discount_fixed?.toString() || "",
        discount_type: coupon.product_discount_percent || coupon.delivery_discount_percent ? "percentage" : "fixed",
        
        // Restrictions
        min_order_amount: coupon.min_order_amount?.toString() || "",
        max_discount_amount: coupon.max_discount_amount?.toString() || "",
        max_uses: coupon.max_uses?.toString() || "",
        max_uses_per_user: coupon.max_uses_per_user?.toString() || "1",
        user_type_restriction: coupon.user_type_restriction || "all",
        first_order_only: coupon.first_order_only,
        
        // Validity
        valid_from: formatDateForInput(coupon.valid_from),
        valid_until: formatDateForInput(coupon.valid_until),
        
        // Status
        is_active: coupon.is_active,
        is_public: coupon.is_public,
        internal_notes: coupon.internal_notes || ""
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load coupon",
        variant: "destructive"
      })
      router.push("/admin/coupons")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Code and name are required",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      
      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        benefit_type: formData.benefit_type,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        is_active: formData.is_active,
        is_public: formData.is_public,
        internal_notes: formData.internal_notes || null,
        max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
        user_type_restriction: formData.user_type_restriction === "all" ? null : formData.user_type_restriction,
        first_order_only: formData.first_order_only,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
      }

      // Add benefit-specific fields
      if (formData.benefit_type === "free_delivery") {
        payload.free_delivery = true
      } else if (formData.benefit_type === "delivery_discount") {
        if (formData.discount_type === "percentage") {
          payload.delivery_discount_percent = parseFloat(formData.delivery_discount_percent)
          payload.delivery_discount_fixed = null
        } else {
          payload.delivery_discount_fixed = parseFloat(formData.delivery_discount_fixed)
          payload.delivery_discount_percent = null
        }
      } else if (formData.benefit_type === "wallet_credit") {
        payload.wallet_credit_amount = parseFloat(formData.wallet_credit_amount)
      } else if (formData.benefit_type === "product_discount" || formData.benefit_type === "specific_product") {
        if (formData.discount_type === "percentage") {
          payload.product_discount_percent = parseFloat(formData.product_discount_percent)
          payload.product_discount_fixed = null
        } else {
          payload.product_discount_fixed = parseFloat(formData.product_discount_fixed)
          payload.product_discount_percent = null
        }
      }

      await apiClient.put(`/coupons/${couponId}`, payload)
      
      toast({
        title: "Success",
        description: `Coupon "${formData.code}" updated successfully`
      })
      
      router.push("/admin/coupons")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update coupon",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FED141]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div className="bg-[#303A4D] text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.push("/admin/coupons")}
            variant="ghost"
            className="text-white hover:text-white/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coupons
          </Button>
          <h1 className="text-3xl font-bold mb-2">Edit Coupon: {formData.code}</h1>
          <p className="text-white/70">Update coupon settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code (Cannot be changed)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Benefit Configuration - Show current type only */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Benefit Configuration</h2>
          
          <div className="bg-gray-50 p-3 rounded mb-4">
            <p className="text-sm text-gray-600">
              <strong>Benefit Type:</strong> {formData.benefit_type.replace("_", " ").toUpperCase()}
            </p>
          </div>

          {formData.benefit_type === "delivery_discount" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.discount_type === "percentage"}
                    onChange={() => setFormData({ ...formData, discount_type: "percentage" })}
                  />
                  <span>Percentage</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.discount_type === "fixed"}
                    onChange={() => setFormData({ ...formData, discount_type: "fixed" })}
                  />
                  <span>Fixed Amount</span>
                </label>
              </div>

              {formData.discount_type === "percentage" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.delivery_discount_percent}
                    onChange={(e) => setFormData({ ...formData, delivery_discount_percent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.delivery_discount_fixed}
                    onChange={(e) => setFormData({ ...formData, delivery_discount_fixed: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {formData.benefit_type === "wallet_credit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Credit Amount (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.wallet_credit_amount}
                onChange={(e) => setFormData({ ...formData, wallet_credit_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {(formData.benefit_type === "product_discount" || formData.benefit_type === "specific_product") && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.discount_type === "percentage"}
                    onChange={() => setFormData({ ...formData, discount_type: "percentage" })}
                  />
                  <span>Percentage</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.discount_type === "fixed"}
                    onChange={() => setFormData({ ...formData, discount_type: "fixed" })}
                  />
                  <span>Fixed Amount</span>
                </label>
              </div>

              {formData.discount_type === "percentage" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.product_discount_percent}
                    onChange={(e) => setFormData({ ...formData, product_discount_percent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.product_discount_fixed}
                    onChange={(e) => setFormData({ ...formData, product_discount_fixed: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validity Period */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Validity Period *
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From
              </label>
              <input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until (Expiry Date)
              </label>
              <input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                required
              />
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Coupon will automatically expire after the "Valid Until" date
          </p>
        </div>

        {/* Restrictions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Restrictions & Limits</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Cap (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Total Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses Per User
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type Restriction
                </label>
                <select
                  value={formData.user_type_restriction}
                  onChange={(e) => setFormData({ ...formData, user_type_restriction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Users</option>
                  <option value="buyer">Buyers Only</option>
                  <option value="seller">Sellers Only</option>
                </select>
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.first_order_only}
                    onChange={(e) => setFormData({ ...formData, first_order_only: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">First Order Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Visibility */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Status & Visibility</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Active (coupon can be used)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Public (show in coupon list)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Admin Only)
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => router.push("/admin/coupons")}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 font-bold"
          >
            {isSaving ? "Saving..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
