"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Building2, Phone, Mail, MapPin, Star, Package, 
  TrendingUp, CheckCircle, XCircle, Trash2, AlertTriangle, 
  CreditCard, FileText, Tag, DollarSign, History, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getErrorMessage } from "@/lib/error-handler"
import { formatSpecialization, getCategoryColor, formatSupplierType, formatSupplierStatus, getStatusColor } from "@/utils/supplierHelpers"
import CreateSupplyRequestModal from "@/components/procurement/CreateSupplyRequestModal"

interface Supplier {
  id: string
  supplier_code: string
  name: string
  supplier_type: string
  contact_person?: string
  phone: string
  email?: string
  alternative_phone?: string
  location?: any
  business_registration?: string
  tax_id?: string
  payment_terms?: string
  bank_details?: any
  specialization?: string[]
  rating: number
  total_supplies: number
  on_time_delivery_rate: number
  quality_rating: number
  verification_status: string
  is_active: boolean
  notes?: string
  created_at: string
}

interface Product {
  id: string
  name: string
  description?: string
  price_per_unit: number
  stock_quantity: number
  unit_type: string
  is_published: boolean
  in_warehouse: boolean
  created_by_type: string
  images?: string[]
}

interface SupplyOffer {
  id: string
  request_number?: string
  product_name: string
  offered_quantity: number
  unit_price: number
  total_price: number
  delivery_date: string
  status: string
  created_at: string
}

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [offers, setOffers] = useState<SupplyOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [productFilter, setProductFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchSupplierDetails()
    fetchAllProducts()
    fetchSupplierOffers()
  }, [params.id])

  const fetchSupplierDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSupplier(data)
      }
    } catch (error) {
      console.error("Failed to fetch supplier:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProducts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      
      // Fetch all product types for this supplier
      const [catalogRes, warehouseRes, linkedRes] = await Promise.all([
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${params.id}/catalog`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${params.id}/warehouse-products`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${params.id}/products`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ])

      const catalog = catalogRes.ok ? await catalogRes.json() : []
      const warehouse = warehouseRes.ok ? await warehouseRes.json() : []
      const linked = linkedRes.ok ? await linkedRes.json() : []

      // Combine and deduplicate products
      const productMap = new Map()
      
      catalog.forEach((p: any) => productMap.set(p.id, { ...p, source: 'catalog' }))
      warehouse.forEach((p: any) => productMap.set(p.id, { ...p, source: 'warehouse' }))
      linked.forEach((p: any) => {
        if (!productMap.has(p.product_id)) {
          productMap.set(p.product_id, { ...p, source: 'linked' })
        }
      })

      setAllProducts(Array.from(productMap.values()))
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const fetchSupplierOffers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      // Use admin endpoint to get all offers for this supplier
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-offers?supplier_id=${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOffers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    }
  }

  const toggleSupplierStatus = async () => {
    if (!supplier) return
    
    setActionLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${supplier.id}/toggle-status`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Supplier ${supplier.is_active ? 'deactivated' : 'activated'} successfully`
        })
        fetchSupplierDetails()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const deleteSupplier = async () => {
    if (!supplier) return
    
    setActionLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/${supplier.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Supplier deleted successfully"
        })
        router.push("/admin/suppliers")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getProductStatusBadge = (product: Product) => {
    if (product.is_published) {
      return <Badge className="bg-green-500">Published</Badge>
    }
    if (product.in_warehouse) {
      return <Badge className="bg-blue-500">In Warehouse</Badge>
    }
    return <Badge className="bg-gray-500">Draft</Badge>
  }

  const getOfferStatusBadge = (status: string) => {
    const colors: any = {
      pending: "bg-yellow-500",
      accepted: "bg-blue-500",
      received: "bg-green-500",
      rejected: "bg-red-500"
    }
    return <Badge className={colors[status.toLowerCase()] || "bg-gray-500"}>{status}</Badge>
  }

  const filteredProducts = allProducts.filter(product => {
    if (productFilter === 'draft') return !product.in_warehouse && !product.is_published
    if (productFilter === 'warehouse') return product.in_warehouse && !product.is_published
    if (productFilter === 'published') return product.is_published
    return true
  })

  const totalExpenses = offers
    .filter(o => o.status.toLowerCase() === 'received')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0)

  if (loading) {
    return <div className="p-8 text-center">Loading supplier details...</div>
  }

  if (!supplier) {
    return <div className="p-8 text-center">Supplier not found</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/suppliers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#303A4D]">{supplier.name}</h1>
            <p className="text-[#303A4D]/60">{supplier.supplier_code}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowRequestModal(true)}
            className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Supply Request
          </Button>

          <Button
            onClick={toggleSupplierStatus}
            variant={supplier.is_active ? "destructive" : "default"}
            disabled={actionLoading}
          >
            {supplier.is_active ? (
              <><XCircle className="w-4 h-4 mr-2" /> Deactivate</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={actionLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {supplier.name} and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSupplier} className="bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Info Card */}
            <Card className="p-6 bg-white col-span-2">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4">Supplier Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#303A4D]/60">Type</p>
                  <p className="font-medium text-[#303A4D]">{formatSupplierType(supplier.supplier_type)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-[#303A4D]/60">Status</p>
                  <Badge className={getStatusColor(supplier.verification_status)}>
                    {formatSupplierStatus(supplier.verification_status)}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-[#303A4D]/60">Contact Person</p>
                  <p className="font-medium text-[#303A4D]">{supplier.contact_person || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-[#303A4D]/60">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#303A4D]/60" />
                    <p className="font-medium text-[#303A4D]">{supplier.phone}</p>
                  </div>
                </div>

                {supplier.email && (
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#303A4D]/60" />
                      <p className="font-medium text-[#303A4D]">{supplier.email}</p>
                    </div>
                  </div>
                )}

                {supplier.location && (
                  <div>
                    <p className="text-sm text-[#303A4D]/60">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#303A4D]/60" />
                      <p className="font-medium text-[#303A4D]">
                        {typeof supplier.location === 'string' 
                          ? supplier.location 
                          : supplier.location?.address || supplier.location?.city || 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {supplier.specialization && supplier.specialization.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-[#303A4D]/60 mb-2">Specialization</p>
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialization.map((category, index) => (
                        <Badge key={`${category}-${index}`} className={getCategoryColor(category)}>
                          {formatSpecialization([category])[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Performance Metrics Card */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4">Performance</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#303A4D]/60">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-[#303A4D]">
                        {typeof supplier.rating === 'number' ? supplier.rating.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#303A4D]/60">Quality Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-[#303A4D]">
                        {typeof supplier.quality_rating === 'number' ? supplier.quality_rating.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#303A4D]/60">On-Time Delivery</span>
                    <span className="font-bold text-[#303A4D]">
                      {typeof supplier.on_time_delivery_rate === 'number' ? supplier.on_time_delivery_rate.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${supplier.on_time_delivery_rate || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#303A4D]/60">Total Supplies</span>
                    <span className="font-bold text-[#303A4D]">{supplier.total_supplies}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#303A4D]">Products</h2>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="warehouse">In Warehouse</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="p-12 bg-white text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-[#303A4D]/20" />
              <p className="text-[#303A4D]/60">No products found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4 bg-white hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-[#303A4D]">{product.name}</h3>
                    {getProductStatusBadge(product)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#303A4D]/60">Price</span>
                      <span className="font-medium">
                        GH₵{product.price_per_unit ? Number(product.price_per_unit).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#303A4D]/60">Stock</span>
                      <span className="font-medium">
                        {product.stock_quantity ? Number(product.stock_quantity).toFixed(2) : '0'} {product.unit_type}
                      </span>
                    </div>
                  </div>

                  <Link href={`/admin/products/${product.id}`}>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      View Details
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-2xl font-bold text-[#303A4D]">Supply History</h2>

          {offers.length === 0 ? (
            <Card className="p-12 bg-white text-center">
              <History className="w-12 h-12 mx-auto mb-3 text-[#303A4D]/20" />
              <p className="text-[#303A4D]/60">No supply history yet</p>
            </Card>
          ) : (
            <Card className="bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F4F2E6] border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Product</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Quantity</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-[#303A4D]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-[#F4F2E6]/50">
                        <td className="px-6 py-4 text-sm text-[#303A4D]">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#303A4D]">
                          {offer.product_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#303A4D]">
                          {offer.offered_quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#303A4D]">
                          GH₵{Number(offer.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#303A4D]">
                          GH₵{Number(offer.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {getOfferStatusBadge(offer.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-[#303A4D]/60">Total Spent</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">
                GH₵{totalExpenses.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-[#303A4D]/60">Completed Orders</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">
                {offers.filter(o => o.status.toLowerCase() === 'received').length}
              </p>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-[#303A4D]/60">Average Order</span>
              </div>
              <p className="text-3xl font-bold text-[#303A4D]">
                GH₵{offers.length > 0 ? (totalExpenses / offers.filter(o => o.status.toLowerCase() === 'received').length || 1).toFixed(2) : '0.00'}
              </p>
            </Card>
          </div>

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-bold text-[#303A4D] mb-4">Expense Breakdown</h3>
            <div className="space-y-3">
              {offers
                .filter(o => o.status.toLowerCase() === 'received')
                .map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-[#F4F2E6] rounded-lg">
                    <div>
                      <p className="font-medium text-[#303A4D]">{offer.product_name}</p>
                      <p className="text-sm text-[#303A4D]/60">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-[#303A4D]">GH₵{Number(offer.total_price).toFixed(2)}</p>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Supply Request Modal */}
      {showRequestModal && (
        <CreateSupplyRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          supplierId={supplier.id}
        />
      )}
    </div>
  )
}
