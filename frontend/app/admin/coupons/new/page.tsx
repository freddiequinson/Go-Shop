"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft, Tag, Calendar, DollarSign, Truck, Wallet, Package, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api/client"

export default function CreateCouponPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    benefit_type: "free_delivery",
    
    // Delivery
    free_delivery: true,
    delivery_discount_percent: "",
    delivery_discount_fixed: "",
    
    // Wallet
    wallet_credit_amount: "",
    
    // Product discount
    product_discount_percent: "",
    product_discount_fixed: "",
    discount_type: "percentage",
    
    // Restrictions
    min_order_amount: "",
    max_discount_amount: "",
    max_uses: "",
    max_uses_per_user: "1",
    user_type_restriction: "all",
    first_order_only: false,
    
    // Validity
    valid_from: "",
    valid_until: "",
    
    // Status
    is_active: true,
    is_public: true,
    internal_notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.code || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Code and name are required",
        variant: "destructive"
      })
      return
    }

    if (!formData.valid_from || !formData.valid_until) {
      toast({
        title: "Validation Error",
        description: "Please set validity dates",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      
      // Build payload based on benefit type
      const payload: any = {
        code: formData.code.toUpperCase(),
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
        } else {
          payload.delivery_discount_fixed = parseFloat(formData.delivery_discount_fixed)
        }
      } else if (formData.benefit_type === "wallet_credit") {
        payload.wallet_credit_amount = parseFloat(formData.wallet_credit_amount)
      } else if (formData.benefit_type === "product_discount") {
        if (formData.discount_type === "percentage") {
          payload.product_discount_percent = parseFloat(formData.product_discount_percent)
        } else {
          payload.product_discount_fixed = parseFloat(formData.product_discount_fixed)
        }
      } else if (formData.benefit_type === "specific_product") {
        if (formData.discount_type === "percentage") {
          payload.product_discount_percent = parseFloat(formData.product_discount_percent)
        } else {
          payload.product_discount_fixed = parseFloat(formData.product_discount_fixed)
        }
      }

      await apiClient.post("/coupons/", payload)
      
      toast({
        title: "Success",
        description: `Coupon "${formData.code}" created successfully`
      })
      
      router.push("/admin/coupons")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create coupon",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case "free_delivery": return <Truck className="w-5 h-5" />
      case "delivery_discount": return <Truck className="w-5 h-5" />
      case "wallet_credit": return <Wallet className="w-5 h-5" />
      case "product_discount": return <Package className="w-5 h-5" />
      case "specific_product": return <Target className="w-5 h-5" />
      default: return <Tag className="w-5 h-5" />
    }
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
          <h1 className="text-3xl font-bold mb-2">Create New Coupon</h1>
          <p className="text-white/70">Set up a new discount coupon</p>
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
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent uppercase font-mono"
                  placeholder="WELCOME10"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Will be converted to uppercase</p>
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
                  placeholder="Welcome Discount"
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
                placeholder="10% off your first order + free delivery"
              />
            </div>
          </div>
        </div>

        {/* Benefit Type */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Benefit Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, benefit_type: "free_delivery" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.benefit_type === "free_delivery"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Truck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Free Delivery</div>
              <div className="text-xs text-gray-500">100% free delivery</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, benefit_type: "delivery_discount" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.benefit_type === "delivery_discount"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Truck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Delivery Discount</div>
              <div className="text-xs text-gray-500">% or fixed off delivery</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, benefit_type: "wallet_credit" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.benefit_type === "wallet_credit"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Wallet className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Wallet Credit</div>
              <div className="text-xs text-gray-500">Add to wallet</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, benefit_type: "product_discount" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.benefit_type === "product_discount"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Package className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Product Discount</div>
              <div className="text-xs text-gray-500">% or fixed off order</div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, benefit_type: "specific_product" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.benefit_type === "specific_product"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Target className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Specific Products</div>
              <div className="text-xs text-gray-500">Target products/categories</div>
            </button>
          </div>

          {/* Benefit Configuration */}
          {formData.benefit_type === "free_delivery" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Free Delivery:</strong> Customers will get 100% free delivery when they apply this coupon.
              </p>
            </div>
          )}

          {formData.benefit_type === "delivery_discount" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex gap-4 mb-4">
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
                    placeholder="50"
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
                    placeholder="5.00"
                  />
                </div>
              )}
            </div>
          )}

          {formData.benefit_type === "wallet_credit" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
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
                placeholder="20.00"
              />
              <p className="text-xs text-gray-600 mt-1">
                This amount will be added to the user's wallet balance
              </p>
            </div>
          )}

          {(formData.benefit_type === "product_discount" || formData.benefit_type === "specific_product") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <div className="flex gap-4 mb-4">
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
                    placeholder="20"
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
                    placeholder="10.00"
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
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
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
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Cap for percentage discounts</p>
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
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
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
                  placeholder="1"
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
                placeholder="Internal notes for admins..."
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
            {isSaving ? "Creating..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Coupon
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
