"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { User, ShoppingBag, Search, Package, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { CartNotification } from "@/components/cart-notification"
import { cartService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number | string
  price_per_quantity?: number | string
  unit_type: string
  stock_quantity: number | string
  category_id: string
  is_active: boolean
  images?: string[]
  inStock: boolean
  price: number
  unit: string
  category: string
  image: string
  vendor: string
  onSale?: boolean
  originalPrice?: number
  isBundle?: boolean
  bundleItems?: string[]
}

const demoProducts = [
  {
    id: 1,
    name: "Fresh Red Apples",
    price: 12.99,
    unit: "per kg",
    category: "Fruits",
    image: "/images/apple-inhand.jpg",
    inStock: true,
    images: ["/images/apple-inhand.jpg", "/images/apple-inhand.jpg"],
    description: "Crisp and sweet red apples, perfect for snacking or baking.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 2,
    name: "Organic Tomatoes",
    price: 8.5,
    unit: "per kg",
    category: "Vegetables",
    image: "/images/tomato.jpg",
    inStock: true,
    images: ["/images/tomato.jpg"],
    description: "Fresh organic tomatoes, locally sourced.",
    isBundle: false,
    onSale: true,
    originalPrice: 12.0,
  },
  {
    id: 3,
    name: "Premium Rice",
    price: 45.0,
    unit: "5kg bag",
    category: "Grains",
    image: "/images/rice.jpg",
    inStock: true,
    images: ["/images/rice.jpg"],
    description: "High-quality premium rice for your family meals.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 4,
    name: "Fresh Groundnuts",
    price: 15.0,
    unit: "per kg",
    category: "Nuts",
    image: "/images/nkatie.jpg",
    inStock: true,
    images: ["/images/nkatie.jpg"],
    description: "Freshly roasted groundnuts, perfect for snacking.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 5,
    name: "Organic Carrots",
    price: 10.0,
    unit: "per kg",
    category: "Vegetables",
    image: "/images/carter.jpg",
    inStock: true,
    images: ["/images/carter.jpg"],
    description: "Fresh organic carrots, rich in vitamins.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 6,
    name: "Fresh Bananas",
    price: 6.5,
    unit: "per bunch",
    category: "Fruits",
    image: "/images/products/banana.jpg",
    inStock: true,
    images: ["/images/products/banana.jpg"],
    description: "Sweet and ripe bananas, perfect for smoothies.",
    isBundle: false,
    onSale: true,
    originalPrice: 9.0,
  },
  {
    id: 7,
    name: "Garden Herbs Mix",
    price: 5.0,
    unit: "per bundle",
    category: "Herbs",
    image: "/images/products/herbs.jpg",
    inStock: true,
    images: ["/images/products/herbs.jpg"],
    description: "Fresh garden herbs for your cooking needs.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 8,
    name: "Sweet Potatoes",
    price: 9.0,
    unit: "per kg",
    category: "Vegetables",
    image: "/images/big.jpg",
    inStock: false,
    images: ["/images/big.jpg"],
    description: "Sweet and nutritious potatoes.",
    isBundle: false,
    onSale: false,
  },
  {
    id: 9,
    name: "Family Grocery Bundle",
    price: 89.99,
    unit: "bundle",
    category: "Bundles",
    image: "/images/bags.jpg",
    inStock: true,
    images: ["/images/bags.jpg"],
    description: "Complete family grocery bundle with rice, vegetables, fruits, and more!",
    isBundle: true,
    onSale: true,
    originalPrice: 120.0,
    bundleItems: ["5kg Rice", "2kg Tomatoes", "1kg Apples", "1kg Carrots", "Herbs Bundle"],
  },
  {
    id: 10,
    name: "Breakfast Essentials Bundle",
    price: 45.0,
    unit: "bundle",
    category: "Bundles",
    image: "/images/stamp.JPG",
    inStock: true,
    images: ["/images/stamp.JPG"],
    description: "Everything you need for a healthy breakfast!",
    isBundle: true,
    onSale: false,
    bundleItems: ["Bananas", "Groundnuts", "Herbs", "Fresh Eggs"],
  },
]

export default function ShopPage() {
  const { addItem, totalItems, refreshCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationProduct, setNotificationProduct] = useState("")
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/products/?limit=100`)
      if (response.ok) {
        const data = await response.json()
        const productList = Array.isArray(data) ? data : data.products || data.items || []
        
        // Fetch categories first to map them
        const categoriesResponse = await fetch(`${apiBaseUrl}/products/categories/`)
        const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : []
        const categoryMap = new Map(categoriesData.map((c: any) => [c.id, c.name]))
        
        // Transform API products to match our interface
        const transformedProducts: Product[] = productList
          .filter((p: any) => p.is_active && p.is_published && p.stock_quantity > 0) // Only show active, published products with stock
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            price_per_unit: p.price_per_unit,
            price_per_quantity: p.price_per_quantity,
            unit_type: p.unit_type,
            stock_quantity: p.stock_quantity,
            category_id: p.category_id,
            is_active: p.is_active,
            images: p.images || [],
            inStock: p.stock_quantity > 0,
            price: typeof p.price_per_unit === 'string' ? parseFloat(p.price_per_unit) : p.price_per_unit,
            unit: `per ${p.unit_type}`,
            category: categoryMap.get(p.category_id) || "Uncategorized",
            image: p.images && p.images.length > 0 ? p.images[0] : "/placeholder.svg",
            vendor: "Go-Shop"
          }))
        
        setProducts(transformedProducts)
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(new Set(transformedProducts.map(p => p.category)))
        setCategories(["All", ...uniqueCategories.sort()])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    // Categories are now fetched in fetchProducts
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = async (product: Product, quantity: number, purchaseType: "weight" | "quantity") => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingToCart(true)
      
      // Call backend API to add to cart
      await cartService.addToCart({
        product_id: product.id,
        quantity: quantity,
      })
      
      // Refresh cart from backend to get accurate count
      await refreshCart()
      
      setNotificationProduct(product.name)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (error: any) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const getSimilarProducts = (product: Product) => {
    return products.filter((p) => p.id !== product.id && p.category === product.category && p.inStock).slice(0, 4)
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303A4D] text-white hover:bg-[#3B4559] transition-all duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow-md">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </button>
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/images/logo.png"
              alt="go-shop"
              width={96}
              height={30}
              className="w-20 md:w-28 object-contain"
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity overflow-hidden relative cursor-pointer">
                {isAuthenticated && user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
            </Link>
            <Link href="/cart">
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C24628] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#FED141] px-4 md:px-8 py-8 md:py-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#303A4D] mb-3 md:mb-4">Shop Fresh Groceries</h1>
          <p className="text-base md:text-xl text-[#303A4D] mb-6 md:mb-8 px-4">
            Browse our selection of fresh produce from local farmers and vendors
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative px-4">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#303A4D]/60" />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full px-10 md:px-12 py-3 md:py-4 text-sm md:text-base text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:ring-2 focus:ring-[#303A4D] shadow-sm transition-shadow duration-200 focus:shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 py-8 md:py-12">
        <div className="w-full">
          {loading && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4 animate-pulse" />
              <p className="text-2xl text-[#303A4D]/60">Loading products...</p>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4" />
              <p className="text-2xl text-[#303A4D]/60">No products available yet.</p>
              <p className="text-[#303A4D]/40 mt-2">Check back soon!</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
          {/* Category Filter */}
          <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-medium text-sm md:text-base transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-[#303A4D] text-white shadow-md"
                    : "bg-white text-[#303A4D] hover:bg-[#FED141] shadow-sm hover:shadow-md"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id}>
                <Link href={`/product/${product.id}`}>
                  <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="relative h-40 md:h-56 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5 overflow-hidden p-2 md:p-4">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                      />
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-white text-[#303A4D] px-6 py-3 rounded-full font-bold text-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-1 md:gap-2">
                        <span className="bg-white/90 backdrop-blur-sm text-[#303A4D] px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium">
                          {product.category}
                        </span>
                        {product.onSale && (
                          <span className="bg-[#C24628] text-white px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold">SALE</span>
                        )}
                        {product.isBundle && (
                          <span className="bg-[#93C90F] text-white px-2 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold">
                            BUNDLE
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="text-base md:text-lg font-bold text-[#303A4D] mb-2 leading-tight line-clamp-2">{product.name}</h3>
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-bold text-[#303A4D]">GH₵{product.price.toFixed(2)}</span>
                          {product.onSale && product.originalPrice && (
                            <span className="text-sm text-[#303A4D]/40 line-through">
                              GH₵{product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#303A4D]/60 font-medium">{product.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-3">
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedProduct(product)
                    }}
                    className="w-full bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-3 md:py-4 font-bold text-sm md:text-base shadow-sm hover:shadow-md transition-all"
                    disabled={!product.inStock}
                  >
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-2xl text-[#303A4D]/60">No products found matching your search.</p>
            </div>
          )}
            </>
          )}
        </div>
      </section>

      {selectedProduct && (
        <AddToCartModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartNotification show={showNotification} productName={notificationProduct} />
    </div>
  )
}
