"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { User, ShoppingBag, Search, Package, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { CartNotification } from "@/components/cart-notification"
import { cartService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import AIChatbot from "@/components/AIChatbot"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    image: "/images/stamp.png",
    inStock: true,
    images: ["/images/stamp.png"],
    description: "Everything you need for a healthy breakfast!",
    isBundle: true,
    onSale: false,
    bundleItems: ["Bananas", "Groundnuts", "Herbs", "Fresh Eggs"],
  },
]

export default function ShopPage() {
  // Hooks MUST be called directly - cannot be in try-catch
  console.log('[SHOP PAGE] Initializing hooks...')
  const { addItem, uniqueItemsCount, refreshCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  console.log('[SHOP PAGE] Hooks initialized successfully')

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationProduct, setNotificationProduct] = useState("")
  const [addingToCart, setAddingToCart] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [showScrollArrows, setShowScrollArrows] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const perPage = 20
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializedRef = useRef(false)

  console.log('[SHOP PAGE] State initialized')

  // Fetch products with category filtering and abort controller
  const fetchProducts = useCallback(async (categoriesData?: any[]) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setErrorMessage(null)
      const apiBaseUrl = getApiBaseUrl()
      let url = `${apiBaseUrl}/products/?page=${currentPage}&per_page=${perPage}`
      
      // Add category filter if not "All" or "Others"
      if (selectedCategory !== "All" && selectedCategory !== "Others") {
        const categoriesToUse = categoriesData || allCategories
        const category = categoriesToUse.find((c: any) => c.name === selectedCategory)
        if (category) {
          url += `&category_id=${category.id}`
        }
      }
      
      // Add search query if exists (using debounced value)
      if (debouncedSearchQuery.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`
      }
      
      console.log('[FETCH] Fetching products from:', url)
      
      // Add timeout for mobile networks (30 seconds)
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const productList = Array.isArray(data) ? data : data.products || data.items || []
      
      // Set pagination data
      if (data.pages) {
        setTotalPages(data.pages)
        setTotalProducts(data.total || 0)
      }
      
      // Use passed categories or fall back to state
      const categoriesToUse = categoriesData || allCategories
      const categoryMap = new Map(
        Array.isArray(categoriesToUse) 
          ? categoriesToUse.filter(c => c && c.id).map((c: any) => [c.id, c.name || "Others"])
          : []
      )
      
      console.log('[FETCH] Category map size:', categoryMap.size)
      
      // Transform API products to match our interface
      const transformedProducts: Product[] = productList
        .filter((p: any) => p && p.id && p.name)
        .map((p: any) => {
          const priceValue = p.price_per_unit || p.price || 0
          const price = typeof priceValue === 'string' ? parseFloat(priceValue) || 0 : Number(priceValue) || 0
          const categoryName = categoryMap.get(p.category_id) || "Others"
          
          return {
            id: p.id,
            name: p.name,
            description: p.description || "",
            price_per_unit: p.price_per_unit || 0,
            price_per_quantity: p.price_per_quantity || 0,
            unit_type: p.unit_type || "kg",
            stock_quantity: p.stock_quantity || 0,
            category_id: p.category_id || "",
            is_active: p.is_active !== false,
            images: Array.isArray(p.images) ? p.images : [],
            inStock: (p.stock_quantity || 0) > 0,
            price: price,
            unit: `per ${p.unit_type || 'kg'}`,
            category: categoryName,
            image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : "/placeholder.svg",
            vendor: "GoShop"
          }
        })
      
      console.log('[FETCH] Transformed products:', transformedProducts.length)
      setProducts(transformedProducts)
      
      // Add "Others" category if there are uncategorized products
      const hasOthers = transformedProducts.some(p => p.category === "Others")
      if (hasOthers && !categories.includes("Others")) {
        setCategories(prev => [...prev, "Others"])
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[FETCH] Request aborted')
        return
      }
      console.error("Failed to fetch products:", error)
      console.error('[DEBUG] API Base URL:', getApiBaseUrl())
      console.error('[DEBUG] Error type:', typeof error)
      console.error('[DEBUG] Error name:', error?.name)
      console.error('[DEBUG] Error message:', error?.message)
      
      const errorMsg = error?.message || error?.toString() || 'Network error. Please check your connection and try again.'
      setErrorMessage(errorMsg)
      setProducts([])
      setTotalPages(1)
      setTotalProducts(0)
    } finally {
      // Only turn off loading if this is still the current request
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [currentPage, perPage, selectedCategory, debouncedSearchQuery, allCategories])

  // Fetch all categories
  const fetchAllCategories = useCallback(async () => {
    try {
      const apiBaseUrl = getApiBaseUrl()
      console.log('[FETCH] Fetching categories from:', `${apiBaseUrl}/products/categories/`)
      
      // Add timeout for mobile networks (30 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(`${apiBaseUrl}/products/categories/`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const categoriesData = await response.json()
      console.log('[FETCH] Categories loaded:', categoriesData.length)
      setAllCategories(categoriesData)
      
      // Filter out categories with 0 products and set category tabs
      const categoriesWithProducts = categoriesData.filter((c: any) => (c.product_count || 0) > 0)
      const categoryNames = categoriesWithProducts.map((c: any) => c.name).sort()
      setCategories(["All", ...categoryNames])
      
      return categoriesData
    } catch (error: any) {
      console.error("Failed to fetch categories:", error)
      setErrorMessage('Failed to load categories. Please refresh the page.')
      return []
    }
  }, [])

  // Debounce search query to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initialize: Fetch categories first, then products
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const initializeData = async () => {
        console.log('[INIT] Starting data initialization...')
        const categories = await fetchAllCategories()
        if (categories && categories.length > 0) {
          console.log('[INIT] Categories loaded, fetching products...')
          await fetchProducts(categories)
        } else {
          console.log('[INIT] No categories, fetching products anyway...')
          await fetchProducts([])
        }
      }
      initializeData()
    }
  }, [])

  // Reset to page 1 when search query or category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, selectedCategory])

  // Fetch products when page, search, or category changes (after initialization)
  useEffect(() => {
    if (initializedRef.current && allCategories.length > 0) {
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchQuery, selectedCategory])

  // Check if tabs overflow and need scroll arrows
  useEffect(() => {
    const checkOverflow = () => {
      if (typeof window === 'undefined') return
      const container = document.getElementById('category-scroll-container')
      if (container) {
        const hasOverflow = container.scrollWidth > container.clientWidth
        setShowScrollArrows(hasOverflow)
      }
    }

    checkOverflow()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkOverflow)
      return () => window.removeEventListener('resize', checkOverflow)
    }
  }, [categories])

  // Filter for "Others" category (uncategorized products) - backend handles all other filtering
  const filteredProducts = selectedCategory === "Others" 
    ? products.filter(p => p.category === "Others")
    : products

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
                {uniqueItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C24628] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {uniqueItemsCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#FED141] px-4 md:px-8 py-2 md:py-3">
        <div className="text-center">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#303A4D] mb-1.5">Shop Fresh Groceries</h1>
          <p className="text-xs text-[#303A4D] mb-2.5 md:mb-3 px-4">
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

          {errorMessage && !loading && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-red-500/60 mx-auto mb-4" />
              <p className="text-2xl text-red-600 font-semibold">Failed to Load Products</p>
              <p className="text-[#303A4D]/60 mt-2">{errorMessage}</p>
              <Button
                onClick={() => {
                  setErrorMessage(null)
                  fetchProducts()
                }}
                className="mt-4 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-8 py-3 font-bold"
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && !errorMessage && products.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4" />
              <p className="text-2xl text-[#303A4D]/60">No products available yet.</p>
              <p className="text-[#303A4D]/40 mt-2">Check back soon!</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
          {/* Category Filter - Mobile Dropdown */}
          <div className="mb-6 md:hidden">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-white border-2 border-[#303A4D]/20 rounded-full px-6 py-3 text-[#303A4D] font-medium shadow-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter - Desktop Tabs */}
          <div className="mb-6 md:mb-8 hidden md:block">
            <div className="relative flex items-center justify-center gap-3">
              {/* Left Arrow - Only show if content overflows */}
              {showScrollArrows && (
                <button
                  onClick={() => {
                    if (typeof window === 'undefined') return
                    const container = document.getElementById('category-scroll-container')
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' })
                    }
                  }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#303A4D]/20 flex items-center justify-center hover:bg-[#FED141] hover:border-[#303A4D]/40 transition-all shadow-sm z-10"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-[#303A4D]" />
                </button>
              )}

              {/* Scrollable Tabs Container with Rounded Mask - Dynamic width */}
              <div className="relative overflow-hidden rounded-full bg-white/50 backdrop-blur-sm border-2 border-[#303A4D]/10 shadow-sm max-w-full">
                <div 
                  id="category-scroll-container"
                  className="overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ maxWidth: '100%' }}
                >
                  <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="inline-flex h-auto bg-transparent border-0 shadow-none p-0 gap-1 w-auto">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 data-[state=active]:bg-[#303A4D] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-[#303A4D] data-[state=inactive]:hover:bg-[#FED141]/30 whitespace-nowrap"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                {/* Gradient Overlays - Only show if content overflows */}
                {showScrollArrows && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white/80 via-white/40 to-transparent pointer-events-none rounded-l-full" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/80 via-white/40 to-transparent pointer-events-none rounded-r-full" />
                  </>
                )}
              </div>

              {/* Right Arrow - Only show if content overflows */}
              {showScrollArrows && (
                <button
                  onClick={() => {
                    if (typeof window === 'undefined') return
                    const container = document.getElementById('category-scroll-container')
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' })
                    }
                  }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#303A4D]/20 flex items-center justify-center hover:bg-[#FED141] hover:border-[#303A4D]/40 transition-all shadow-sm z-10"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-[#303A4D]" />
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex flex-col h-full">
                <Link href={`/product/${product.id}`} className="flex-1">
                  <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
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
                    <div className="p-3 md:p-4 flex-1 flex flex-col">
                      <h3 className="text-base md:text-lg font-bold text-[#303A4D] mb-2 leading-tight line-clamp-2 min-h-[3rem]">{product.name}</h3>
                      <div className="flex flex-col gap-1 mt-auto">
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

          {/* Pagination */}
          {!loading && filteredProducts.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-[#303A4D] hover:bg-[#FED141] border-2 border-[#303A4D]/20'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-12 h-12 rounded-full font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#303A4D] text-white'
                          : 'bg-white text-[#303A4D] hover:bg-[#FED141] border-2 border-[#303A4D]/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-[#303A4D] hover:bg-[#FED141] border-2 border-[#303A4D]/20'
                }`}
              >
                Next
              </button>
            </div>
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
      
      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  )
}
