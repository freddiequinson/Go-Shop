"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Package, DollarSign, Search, Filter, Plus, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SupplierProduct {
  id: string
  name: string
  description: string
  price_per_unit: number | string
  unit_type: string
  stock_quantity: number | string
  supplier_id: string
  supplier_name?: string
  images?: string[]
  category_id?: string
}

interface CartItem {
  product: SupplierProduct
  quantity: number
}

export default function SupplierMarketplacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    product_name: "",
    quantity_needed: "",
    unit_type: "kg",
    target_price: "",
    required_by_date: "",
    special_requirements: ""
  })

  // Helper functions to safely convert to numbers
  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : value
  }

  useEffect(() => {
    fetchSupplierProducts()
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/suppliers?limit=100", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const suppliersList = Array.isArray(data) ? data : (data.suppliers || [])
        setSuppliers(suppliersList)
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const fetchSupplierProducts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      // Fetch all products created by suppliers that are not in warehouse yet
      const response = await fetch(
        "http://localhost:8000/api/v1/products?limit=200&created_by_type=supplier",
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const productList = Array.isArray(data) ? data : (data.products || data.items || [])
        
        // Filter to only show products with stock > 0 (available for purchase)
        const supplierProducts = productList.filter((p: any) => {
          const stock = typeof p.stock_quantity === 'string' ? parseFloat(p.stock_quantity) : p.stock_quantity
          return stock > 0
        })
        
        // Enrich with supplier names
        const enrichedProducts = await Promise.all(
          supplierProducts.map(async (product: any) => {
            if (product.supplier_id) {
              try {
                const supplierResponse = await fetch(
                  `http://localhost:8000/api/v1/suppliers/${product.supplier_id}`,
                  { headers: { "Authorization": `Bearer ${token}` } }
                )
                if (supplierResponse.ok) {
                  const supplier = await supplierResponse.json()
                  return { ...product, supplier_name: supplier.name }
                }
              } catch (e) {
                console.error("Failed to fetch supplier:", e)
              }
            }
            return product
          })
        )
        
        setProducts(enrichedProducts)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: SupplierProduct) => {
    const existing = cart.find(item => item.product.id === product.id)
    const availableStock = toNumber(product.stock_quantity)
    
    if (existing) {
      const newQuantity = existing.quantity + 1
      if (newQuantity > availableStock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${availableStock} ${product.unit_type} available`,
          variant: "destructive"
        })
        return
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    } else {
      if (availableStock < 1) {
        toast({
          title: "Out of stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive"
        })
        return
      }
      setCart([...cart, { product, quantity: 1 }])
    }
    toast({
      title: "Added to cart",
      description: `${product.name} added to your order`
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      // Check stock availability
      const cartItem = cart.find(item => item.product.id === productId)
      if (cartItem) {
        const availableStock = toNumber(cartItem.product.stock_quantity)
        if (quantity > availableStock) {
          toast({
            title: "Insufficient stock",
            description: `Only ${availableStock} ${cartItem.product.unit_type} available`,
            variant: "destructive"
          })
          return
        }
      }
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const getTotalCost = () => {
    return cart.reduce((sum, item) => sum + (toNumber(item.product.price_per_unit) * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products to cart before checking out",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      
      // Create direct offers for each item in cart
      let successCount = 0
      let failedItems: string[] = []
      
      for (const item of cart) {
        const payload = {
          product_id: item.product.id,
          supplier_id: item.product.supplier_id,
          quantity: item.quantity,
          unit_price: toNumber(item.product.price_per_unit),
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: "Ordered from Supplier Marketplace"
        }

        console.log("Creating direct order:", payload)

        const response = await fetch("http://localhost:8000/api/v1/supply-offers/direct-order", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Order created successfully:", data)
          successCount++
        } else {
          const error = await response.json()
          console.error("Failed to create order:", error)
          failedItems.push(item.product.name)
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success!",
          description: `${successCount} direct order(s) sent to suppliers`
        })
        setCart([])
        router.push("/admin/procurement/direct-orders")
      }
      
      if (failedItems.length > 0) {
        toast({
          title: "Some orders failed",
          description: `Failed: ${failedItems.join(", ")}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create supply requests",
        variant: "destructive"
      })
    }
  }

  const handleBroadcastRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("access_token")
      
      const payload = {
        product_name: requestForm.product_name,
        quantity_needed: parseFloat(requestForm.quantity_needed),
        unit_type: requestForm.unit_type,
        target_price: requestForm.target_price ? parseFloat(requestForm.target_price) : null,
        required_by_date: new Date(requestForm.required_by_date).toISOString(),
        special_requirements: requestForm.special_requirements || null
      }

      const response = await fetch("http://localhost:8000/api/v1/supply-requests/broadcast", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success!",
          description: `Request ${data.request_number} broadcast to all suppliers`
        })
        setShowRequestModal(false)
        setRequestForm({
          product_name: "",
          quantity_needed: "",
          unit_type: "kg",
          target_price: "",
          required_by_date: "",
          special_requirements: ""
        })
        router.push("/admin/procurement/requests")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to create request",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      })
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = selectedSupplier === "all" || product.supplier_id === selectedSupplier
    return matchesSearch && matchesSupplier
  })

  if (loading) {
    return <div className="text-center py-12">Loading marketplace...</div>
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Supplier Marketplace</h1>
            <p className="text-lg text-[#303A4D]/70">
              Browse and order products from supplier catalogs
            </p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Can't Find Product?
          </Button>
        </div>
      </div>

      <div className="mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F4F2E6] rounded-xl text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  />
                </div>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="px-4 py-3 bg-[#F4F2E6] rounded-xl text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-[#303A4D]/60">Products</span>
                </div>
                <p className="text-2xl font-bold text-[#303A4D]">{filteredProducts.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-[#303A4D]/60">In Cart</span>
                </div>
                <p className="text-2xl font-bold text-[#303A4D]">{cart.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-[#303A4D]/60">Total</span>
                </div>
                <p className="text-2xl font-bold text-[#303A4D]">GH₵{getTotalCost().toFixed(2)}</p>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-sm text-center">
                <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Products Found</h3>
                <p className="text-[#303A4D]/60">
                  {searchTerm || selectedSupplier !== "all"
                    ? "Try adjusting your filters"
                    : "Suppliers haven't added products yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-[#F4F2E6] rounded-xl flex items-center justify-center flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Package className="w-8 h-8 text-[#303A4D]/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#303A4D] mb-1 truncate">{product.name}</h3>
                        <p className="text-sm text-[#303A4D]/60 mb-2">{product.supplier_name || "Unknown Supplier"}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-green-600">
                              GH₵{toNumber(product.price_per_unit).toFixed(2)}
                            </p>
                            <p className="text-xs text-[#303A4D]/60">per {product.unit_type}</p>
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            size="sm"
                            className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {toNumber(product.stock_quantity) > 0 && (
                          <p className="text-xs text-blue-600 mt-2">
                            {toNumber(product.stock_quantity)} {product.unit_type} available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-6">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Order Cart
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
                  <p className="text-[#303A4D]/60">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="border-2 border-[#303A4D]/10 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[#303A4D] text-sm">{item.product.name}</h4>
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-[#303A4D]/60 mb-1">{item.product.supplier_name}</p>
                        <p className="text-xs text-blue-600 mb-2">
                          Stock: {toNumber(item.product.stock_quantity)} {item.product.unit_type}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 bg-[#F4F2E6] rounded-lg flex items-center justify-center text-[#303A4D] font-bold hover:bg-[#FED141] transition-colors"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-[#303A4D] w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 bg-[#F4F2E6] rounded-lg flex items-center justify-center text-[#303A4D] font-bold hover:bg-[#FED141] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.quantity >= toNumber(item.product.stock_quantity)}
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-bold text-green-600">
                            GH₵{(toNumber(item.product.price_per_unit) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-[#303A4D]/10 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#303A4D]/70">Subtotal:</span>
                      <span className="font-bold text-[#303A4D]">GH₵{getTotalCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[#303A4D]">Total:</span>
                      <span className="text-2xl font-bold text-green-600">GH₵{getTotalCost().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 font-bold py-6"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Send Order to Suppliers
                  </Button>
                  <p className="text-xs text-[#303A4D]/60 text-center mt-2">
                    This will create supply requests for each supplier
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Supply Request</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Can't find the product you need? Send a request to all suppliers.
            </p>
          </DialogHeader>

          <form onSubmit={handleBroadcastRequest} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={requestForm.product_name}
                onChange={(e) => setRequestForm({...requestForm, product_name: e.target.value})}
                placeholder="e.g., Fresh Organic Tomatoes"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity_needed">Quantity Needed *</Label>
                <Input
                  id="quantity_needed"
                  type="number"
                  step="0.01"
                  value={requestForm.quantity_needed}
                  onChange={(e) => setRequestForm({...requestForm, quantity_needed: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit_type">Unit Type *</Label>
                <select
                  id="unit_type"
                  value={requestForm.unit_type}
                  onChange={(e) => setRequestForm({...requestForm, unit_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liter">Liters</option>
                  <option value="piece">Pieces</option>
                  <option value="pack">Packs</option>
                  <option value="bag">Bags</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_price">Target Price per Unit (Optional)</Label>
                <Input
                  id="target_price"
                  type="number"
                  step="0.01"
                  value={requestForm.target_price}
                  onChange={(e) => setRequestForm({...requestForm, target_price: e.target.value})}
                  placeholder="5.50"
                />
                <p className="text-xs text-gray-500 mt-1">Your budget per unit</p>
              </div>

              <div>
                <Label htmlFor="required_by_date">Required By Date *</Label>
                <Input
                  id="required_by_date"
                  type="date"
                  value={requestForm.required_by_date}
                  onChange={(e) => setRequestForm({...requestForm, required_by_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="special_requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="special_requirements"
                value={requestForm.special_requirements}
                onChange={(e) => setRequestForm({...requestForm, special_requirements: e.target.value})}
                placeholder="e.g., Must be organic certified, Grade A quality..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Broadcast to Suppliers
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
