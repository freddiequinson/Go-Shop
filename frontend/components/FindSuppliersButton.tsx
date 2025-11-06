"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Phone, Mail, MapPin, Star, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Supplier {
  id: string
  name: string
  supplier_type: string
  contact_person?: string
  phone: string
  email?: string
  location?: any
  rating: number
  total_supplies: number
  on_time_delivery_rate: number
  verification_status: string
}

interface FindSuppliersButtonProps {
  productId: string
  productName: string
  categoryName?: string
}

export function FindSuppliersButton({ productId, productName, categoryName }: FindSuppliersButtonProps) {
  const [open, setOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const findSuppliers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/for-out-of-stock-product/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
        if (data.length === 0) {
          toast({
            title: "No Suppliers Found",
            description: "No suppliers specialize in this product category",
            variant: "destructive",
          })
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to find suppliers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error finding suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to find suppliers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && suppliers.length === 0) {
      findSuppliers()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="w-4 h-4" />
          Find Suppliers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Suppliers for {productName}
          </DialogTitle>
          <DialogDescription>
            {categoryName && `Category: ${categoryName} • `}
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} found
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FED141] mx-auto mb-4"></div>
            Searching for suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No suppliers found</p>
            <p className="text-sm mt-2">
              No suppliers currently specialize in this product category
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="border rounded-lg p-4 hover:border-[#FED141] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-[#303A4D]">{supplier.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {supplier.supplier_type}
                      </Badge>
                      <Badge
                        variant={supplier.verification_status === "verified" ? "default" : "secondary"}
                        className={
                          supplier.verification_status === "verified"
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      >
                        {supplier.verification_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{Number(supplier.rating).toFixed(1)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {supplier.contact_person && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Contact:</span>
                      {supplier.contact_person}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {supplier.phone}
                  </div>
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.location?.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {supplier.location.city || supplier.location.region || "Location available"}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-3 pt-3 border-t text-sm">
                  <div>
                    <span className="text-gray-500">Total Supplies:</span>{" "}
                    <span className="font-semibold">{supplier.total_supplies}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">On-Time Rate:</span>{" "}
                    <span className="font-semibold text-green-600">
                      {Number(supplier.on_time_delivery_rate).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
                    onClick={() => {
                      window.location.href = `/admin/suppliers/${supplier.id}`
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/admin/procurement/requests?supplier=${supplier.id}`
                    }}
                  >
                    Create Supply Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
