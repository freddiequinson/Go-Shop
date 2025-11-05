"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Plus, User, CheckCircle, Printer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Progress } from "@/components/ui/progress"

interface PickListItem {
  id: string
  product_id: string
  batch_number: string | null
  warehouse_location_id: string | null
  quantity_to_pick_pieces: number | null
  quantity_to_pick_weight: number | null
  quantity_picked_pieces: number | null
  quantity_picked_weight: number | null
  weight_unit: string | null
  picked: boolean
  picked_at: string | null
  notes: string | null
}

interface PickList {
  id: string
  pick_list_number: string
  order_id: string
  status: string
  assigned_to: string | null
  priority: string
  items: PickListItem[]
  is_complete: boolean
  completion_percentage: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
}

interface Order {
  id: string
}

export default function PickListsPage() {
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [orderId, setOrderId] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const [pickListsRes, ordersRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/warehouse/pick-lists/", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:8000/api/v1/orders/", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      if (pickListsRes.ok) {
        const data = await pickListsRes.json()
        setPickLists(data.items || data)
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.items || data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load pick lists",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePickList = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem("access_token")
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/pick-lists/generate/${orderId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pick list generated successfully"
        })
        setShowModal(false)
        setOrderId("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to generate pick list",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate pick list",
        variant: "destructive"
      })
    }
  }

  const handleMarkItemPicked = async (pickListId: string, itemId: string, item: PickListItem) => {
    const token = localStorage.getItem("access_token")
    
    const payload = {
      picked: !item.picked,
      quantity_picked_pieces: item.quantity_to_pick_pieces,
      quantity_picked_weight: item.quantity_to_pick_weight
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/pick-lists/${pickListId}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: item.picked ? "Item unmarked" : "Item marked as picked"
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      })
    }
  }

  const handleCompletePickList = async (id: string) => {
    const token = localStorage.getItem("access_token")
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/warehouse/pick-lists/${id}/complete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pick list completed"
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete pick list",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "in_progress": return "bg-blue-100 text-blue-700"
      case "completed": return "bg-green-100 text-green-700"
      case "cancelled": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600"
      case "high": return "text-orange-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-green-600"
      default: return "text-gray-600"
    }
  }

  const filteredPickLists = pickLists.filter(pl => {
    if (activeTab === "all") return true
    return pl.status === activeTab
  })

  if (loading) {
    return <div className="p-8 text-center">Loading pick lists...</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Pick Lists</h1>
          <p className="text-[#303A4D]/70">Order fulfillment and picking management</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Pick List
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({pickLists.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pickLists.filter(pl => pl.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({pickLists.filter(pl => pl.status === "in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({pickLists.filter(pl => pl.status === "completed").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Pick Lists */}
      <div className="space-y-4">
        {filteredPickLists.map((pickList) => (
          <Card key={pickList.id} className="p-6 bg-white">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-[#303A4D]">{pickList.pick_list_number}</h3>
                    <p className="text-sm text-gray-500">Order: {pickList.order_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pickList.status)}`}>
                    {pickList.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(pickList.priority)}`}>
                    {pickList.priority} priority
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-[#303A4D]">
                    {pickList.completion_percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={pickList.completion_percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {pickList.items.filter(i => i.picked).length} of {pickList.items.length} items picked
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {pickList.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${item.picked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.picked}
                          onChange={() => handleMarkItemPicked(pickList.id, item.id, item)}
                          className="w-5 h-5 rounded"
                          disabled={pickList.status === "completed"}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-[#303A4D]">
                            Product ID: {item.product_id}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            {item.batch_number && (
                              <span>Batch: {item.batch_number}</span>
                            )}
                            <span>
                              Qty: {item.quantity_to_pick_pieces && `${item.quantity_to_pick_pieces} pcs`}
                              {item.quantity_to_pick_pieces && item.quantity_to_pick_weight && ' / '}
                              {item.quantity_to_pick_weight && `${item.quantity_to_pick_weight} ${item.weight_unit}`}
                            </span>
                            {item.warehouse_location_id && (
                              <span>Location: {item.warehouse_location_id}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {item.picked && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created: {new Date(pickList.created_at).toLocaleString()}
                  {pickList.completed_at && (
                    <span className="ml-4">
                      Completed: {new Date(pickList.completed_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {pickList.status !== "completed" && pickList.completion_percentage === 100 && (
                    <Button
                      size="sm"
                      onClick={() => handleCompletePickList(pickList.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredPickLists.length === 0 && (
          <Card className="p-12 bg-white text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pick lists found</p>
          </Card>
        )}
      </div>

      {/* Generate Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Pick List</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGeneratePickList} className="space-y-4">
            <div>
              <Label>Order ID *</Label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pick list will be auto-generated from order items
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  setOrderId("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
              >
                Generate Pick List
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
