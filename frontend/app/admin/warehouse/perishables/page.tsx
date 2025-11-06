"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Package, Trash2, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PerishableAlert {
  product_id: string
  product_name: string
  batch_number: string | null
  expiry_date: string
  days_until_expiry: number
  quantity_pieces: number | null
  quantity_weight: number | null
  warehouse_location: string
  urgency: string
}

interface WastageRecord {
  id: string
  product_id: string
  batch_number: string | null
  quantity_wasted_pieces: number | null
  quantity_wasted_weight: number | null
  weight_unit: string | null
  reason: string
  cost_value: number | null
  notes: string | null
  created_at: string
}

const WASTAGE_REASONS = [
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "returned", label: "Returned" },
  { value: "contaminated", label: "Contaminated" },
  { value: "spoiled", label: "Spoiled" },
  { value: "other", label: "Other" }
]

export default function PerishablesPage() {
  const [expiringProducts, setExpiringProducts] = useState<PerishableAlert[]>([])
  const [expiredProducts, setExpiredProducts] = useState<PerishableAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showWastageModal, setShowWastageModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PerishableAlert | null>(null)
  const [days, setDays] = useState(14)
  
  const [wastageForm, setWastageForm] = useState({
    product_id: "",
    batch_number: "",
    quantity_wasted_pieces: "",
    quantity_wasted_weight: "",
    weight_unit: "kg",
    reason: "expired",
    cost_value: "",
    notes: ""
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchPerishables()
  }, [days])

  const fetchPerishables = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/perishables/alerts?days=${days}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setExpiringProducts(data.expiring_soon || [])
        setExpiredProducts(data.expired || [])
      }
    } catch (error) {
      console.error("Failed to fetch perishables:", error)
      toast({
        title: "Error",
        description: "Failed to load perishable products",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkWastage = (product: PerishableAlert) => {
    setSelectedProduct(product)
    setWastageForm({
      product_id: product.product_id,
      batch_number: product.batch_number || "",
      quantity_wasted_pieces: product.quantity_pieces?.toString() || "",
      quantity_wasted_weight: product.quantity_weight?.toString() || "",
      weight_unit: "kg",
      reason: "expired",
      cost_value: "",
      notes: ""
    })
    setShowWastageModal(true)
  }

  const handleSubmitWastage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem("access_token")
    
    const payload = {
      product_id: wastageForm.product_id,
      batch_number: wastageForm.batch_number || null,
      quantity_wasted_pieces: wastageForm.quantity_wasted_pieces ? parseFloat(wastageForm.quantity_wasted_pieces) : null,
      quantity_wasted_weight: wastageForm.quantity_wasted_weight ? parseFloat(wastageForm.quantity_wasted_weight) : null,
      weight_unit: wastageForm.weight_unit || null,
      reason: wastageForm.reason,
      cost_value: wastageForm.cost_value ? parseFloat(wastageForm.cost_value) : null,
      notes: wastageForm.notes || null
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/perishables/mark-wastage`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Wastage recorded successfully"
        })
        setShowWastageModal(false)
        fetchPerishables()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to record wastage",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record wastage",
        variant: "destructive"
      })
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-100 text-red-700 border-red-300"
      case "high": return "bg-orange-100 text-orange-700 border-orange-300"
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "low": return "bg-green-100 text-green-700 border-green-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "critical") return "🔴"
    if (urgency === "high") return "🟠"
    if (urgency === "medium") return "🟡"
    return "🟢"
  }

  if (loading) {
    return <div className="p-8 text-center">Loading perishables...</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Perishable Products</h1>
        <p className="text-[#303A4D]/70">Monitor expiry dates and manage wastage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-500">Expiring Soon</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{expiringProducts.length}</p>
          <p className="text-sm text-gray-500 mt-1">Within {days} days</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-gray-500">Expired</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{expiredProducts.length}</p>
          <p className="text-sm text-gray-500 mt-1">Requires action</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-500">Days Filter</span>
          </div>
          <Select
            value={days.toString()}
            onValueChange={(value) => setDays(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expiring" className="mb-6">
        <TabsList>
          <TabsTrigger value="expiring">
            Expiring Soon ({expiringProducts.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({expiredProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-4 mt-6">
          {expiringProducts.map((product, index) => (
            <Card key={index} className={`p-6 bg-white border-2 ${getUrgencyColor(product.urgency)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getUrgencyIcon(product.urgency)}</span>
                    <div>
                      <h3 className="font-bold text-[#303A4D]">{product.product_name}</h3>
                      {product.batch_number && (
                        <p className="text-sm text-gray-500">Batch: {product.batch_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Expires In</p>
                      <p className="font-bold text-lg">
                        {product.days_until_expiry} {product.days_until_expiry === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expiry Date</p>
                      <p className="font-medium">{new Date(product.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-medium">
                        {product.quantity_pieces && `${product.quantity_pieces} pcs`}
                        {product.quantity_pieces && product.quantity_weight && ' / '}
                        {product.quantity_weight && `${product.quantity_weight} kg`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium">{product.warehouse_location}</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkWastage(product)}
                  className="ml-4"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Mark Wastage
                </Button>
              </div>
            </Card>
          ))}

          {expiringProducts.length === 0 && (
            <Card className="p-12 bg-white text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products expiring within {days} days</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4 mt-6">
          {expiredProducts.map((product, index) => (
            <Card key={index} className="p-6 bg-white border-2 border-red-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⛔</span>
                    <div>
                      <h3 className="font-bold text-[#303A4D]">{product.product_name}</h3>
                      {product.batch_number && (
                        <p className="text-sm text-gray-500">Batch: {product.batch_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Expired</p>
                      <p className="font-bold text-lg text-red-600">
                        {Math.abs(product.days_until_expiry)} {Math.abs(product.days_until_expiry) === 1 ? 'day' : 'days'} ago
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expiry Date</p>
                      <p className="font-medium">{new Date(product.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-medium">
                        {product.quantity_pieces && `${product.quantity_pieces} pcs`}
                        {product.quantity_pieces && product.quantity_weight && ' / '}
                        {product.quantity_weight && `${product.quantity_weight} kg`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium">{product.warehouse_location}</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleMarkWastage(product)}
                  className="ml-4"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Record Wastage
                </Button>
              </div>
            </Card>
          ))}

          {expiredProducts.length === 0 && (
            <Card className="p-12 bg-white text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No expired products</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Wastage Modal */}
      <Dialog open={showWastageModal} onOpenChange={setShowWastageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Wastage</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitWastage} className="space-y-4">
            {selectedProduct && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-bold text-[#303A4D]">{selectedProduct.product_name}</p>
                {selectedProduct.batch_number && (
                  <p className="text-sm text-gray-500">Batch: {selectedProduct.batch_number}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity Wasted (Pieces)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={wastageForm.quantity_wasted_pieces}
                  onChange={(e) => setWastageForm({ ...wastageForm, quantity_wasted_pieces: e.target.value })}
                />
              </div>

              <div>
                <Label>Quantity Wasted (Weight)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={wastageForm.quantity_wasted_weight}
                  onChange={(e) => setWastageForm({ ...wastageForm, quantity_wasted_weight: e.target.value })}
                />
              </div>

              <div>
                <Label>Unit</Label>
                <Select
                  value={wastageForm.weight_unit}
                  onValueChange={(value) => setWastageForm({ ...wastageForm, weight_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reason *</Label>
              <Select
                value={wastageForm.reason}
                onValueChange={(value) => setWastageForm({ ...wastageForm, reason: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WASTAGE_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cost Value (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                value={wastageForm.cost_value}
                onChange={(e) => setWastageForm({ ...wastageForm, cost_value: e.target.value })}
                placeholder="Estimated loss value"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={wastageForm.notes}
                onChange={(e) => setWastageForm({ ...wastageForm, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWastageModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
              >
                Record Wastage
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
