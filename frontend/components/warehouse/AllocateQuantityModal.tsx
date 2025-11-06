"use client"

import { useState } from "react"
import { X, ShoppingCart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface AllocateQuantityModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  availableQuantity: number
  onSuccess: () => void
}

export default function AllocateQuantityModal({
  isOpen,
  onClose,
  productId,
  productName,
  availableQuantity,
  onSuccess
}: AllocateQuantityModalProps) {
  const { toast } = useToast()
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const quantityNum = parseFloat(quantity)
    
    // Validation
    if (!quantity || quantityNum <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive"
      })
      return
    }

    if (quantityNum > availableQuantity) {
      toast({
        title: "Insufficient Quantity",
        description: `Only ${availableQuantity} units available. You requested ${quantityNum}.`,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/inventory/${productId}/allocate-to-shop`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_id: productId,
            quantity: quantityNum,
            unit: unit,
            notes: notes || undefined
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success!",
          description: `${quantityNum} ${unit} allocated to shop. ${data.remaining_in_warehouse} ${unit} remaining in warehouse.`,
        })
        onSuccess()
        onClose()
        // Reset form
        setQuantity("")
        setNotes("")
      } else {
        const error = await response.json()
        toast({
          title: "Allocation Failed",
          description: error.detail || "Failed to allocate quantity to shop",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Allocation error:", error)
      toast({
        title: "Error",
        description: "Failed to allocate quantity to shop",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const remainingAfterAllocation = availableQuantity - (parseFloat(quantity) || 0)
  const isValid = parseFloat(quantity) > 0 && parseFloat(quantity) <= availableQuantity

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FED141] rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Allocate to Shop</h2>
              <p className="text-sm text-[#303A4D]/70">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F4F2E6] flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-[#303A4D]" />
          </button>
        </div>

        {/* Available Quantity Info */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">Available in Warehouse</span>
            <span className="text-2xl font-bold text-green-900">{availableQuantity}</span>
          </div>
          <p className="text-xs text-green-900/60 mt-1">This will be moved to shop inventory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity Input */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Quantity to Allocate *
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={availableQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Enter quantity"
                required
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pieces">pieces</option>
                <option value="units">units</option>
                <option value="liters">liters</option>
              </select>
            </div>
            <p className="text-xs text-[#303A4D]/60 mt-2">
              Maximum: {availableQuantity} units
            </p>
          </div>

          {/* Preview */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className={`rounded-2xl p-4 border-2 ${
              isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  isValid ? 'text-green-600' : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <p className={`font-bold mb-1 ${
                    isValid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {isValid ? 'Allocation Preview' : 'Invalid Quantity'}
                  </p>
                  {isValid ? (
                    <>
                      <p className="text-sm text-green-900/80">
                        <strong>{parseFloat(quantity)} {unit}</strong> will be moved to shop (available for customers)
                      </p>
                      <p className="text-sm text-green-900/80">
                        <strong>{remainingAfterAllocation.toFixed(2)} {unit}</strong> will remain in warehouse
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-red-900/80">
                      Quantity exceeds available stock ({availableQuantity} {unit})
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[100px]"
              placeholder="Add any notes about this allocation..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Allocated quantity will be moved to "Reserved" and the product will be automatically published to the shop if not already published.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-3 font-bold"
              disabled={loading || !isValid}
            >
              {loading ? "Allocating..." : "Allocate to Shop"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
