"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { User, ShoppingBag, Search, Package, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ChevronRight as ChevronRightIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { CartNotification } from "@/components/cart-notification"
import { cartService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { getApiBaseUrl, buildApiUrl } from "@/lib/api/url-helper"
import AIChatbot from "@/components/AIChatbot"
import SeasonalPackagesSection from "@/components/packages/SeasonalPackagesSection"
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
  price_per_unit: number | string
  unit_type: string
  stock_quantity: number | string
  category_id?: string
  is_active: boolean
  primary_image_url?: string
  // Computed fields for display
  inStock: boolean
  price: number
  unit: string
  category: string
  image: string
  vendor?: string
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
  const { addItem, uniqueItemsCount, refreshCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [hierarchicalCategories, setHierarchicalCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [hoveredParent, setHoveredParent] = useState<string | null>(null)
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showStickyTabs, setShowStickyTabs] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isChangingCategory, setIsChangingCategory] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  // Infinite scroll: Load smaller batches more frequently
  // Mobile: 6 products, Tablet: 9 products, Desktop: 12 products per batch
  const perPage = typeof window !== 'undefined' 
    ? window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 9 : 12
    : 12
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializedRef = useRef(false)
  const mountedRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const categoryChangeRef = useRef(false)

  // Fetch products with category filtering and abort controller
  const fetchProducts = useCallback(async (categoriesData?: any[], append = false, pageOverride?: number) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (append) {
        setLoadingMore(true)
      } else {
        // Only show full loading on initial load, not category switches
        if (products.length === 0) {
          setLoading(true)
        } else {
          setIsChangingCategory(true)
        }
      }
      setErrorMessage(null)
      const apiBaseUrl = getApiBaseUrl()
      // Use pageOverride if provided (for category changes), otherwise use currentPage
      const pageToFetch = pageOverride !== undefined ? pageOverride : currentPage
      // Use lightweight /shop endpoint to avoid base64 images
      let url = `${apiBaseUrl}/products/shop?page=${pageToFetch}&per_page=${perPage}`
      
      // Add category filter
      if (selectedSubId) {
        // Specific sub-category selected
        url += `&category_id=${selectedSubId}`
      } else if (selectedParentId) {
        // Parent category selected - filter by all its children
        url += `&parent_category_id=${selectedParentId}`
      }
      
      // Add search query if exists (using debounced value)
      if (debouncedSearchQuery.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`
      }
      
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
      
      // Transform API products to match our interface
      const transformedProducts: Product[] = productList
        .filter((p: any) => p && p.id && p.name)
        .map((p: any) => {
          const priceValue = p.price_per_unit || p.price || 0
          const price = typeof priceValue === 'string' ? parseFloat(priceValue) || 0 : Number(priceValue) || 0
          const categoryName = categoryMap.get(p.category_id) || "Others"
          
          // Convert relative image URLs to absolute backend URLs
          let imageUrl = "/placeholder.svg"
          if (p.primary_image_url) {
            if (p.primary_image_url.startsWith('http')) {
              imageUrl = p.primary_image_url
            } else {
              // Convert /images/{id} to full URL
              imageUrl = buildApiUrl(p.primary_image_url)
            }
          }
          
          return {
            id: p.id,
            name: p.name,
            price_per_unit: p.price_per_unit || 0,
            unit_type: p.unit_type || "kg",
            stock_quantity: p.stock_quantity || 0,
            category_id: p.category_id || "",
            is_active: p.is_active !== false,
            primary_image_url: p.primary_image_url || null,
            inStock: (p.stock_quantity || 0) > 0,
            price: price,
            unit: `per ${p.unit_type || 'kg'}`,
            category: categoryName,
            image: imageUrl,
            vendor: "GoShop"
          }
        })
      
      // Append or replace products based on mode
      if (append) {
        setProducts(prev => [...prev, ...transformedProducts])
      } else {
        setProducts(transformedProducts)
      }
      
      // Check if there are more products to load
      setHasMore(currentPage < (data.pages || 1))
      
      // Add "Others" category if there are uncategorized products (only if not already present)
      const hasOthers = transformedProducts.some(p => p.category === "Others")
      if (hasOthers) {
        setCategories(prev => {
          if (!prev.includes("Others")) {
            return [...prev, "Others"]
          }
          return prev
        })
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      console.error("Failed to fetch products:", error)
      
      const errorMsg = error?.message || error?.toString() || 'Network error. Please check your connection and try again.'
      setErrorMessage(errorMsg)
      setProducts([])
      setTotalPages(1)
      setTotalProducts(0)
    } finally {
      // Only turn off loading if this is still the current request
      if (abortControllerRef.current === controller) {
        setLoading(false)
        setLoadingMore(false)
        setIsChangingCategory(false)
      }
    }
  }, [currentPage, perPage, selectedCategory, selectedParentId, selectedSubId, debouncedSearchQuery, allCategories, products.length])

  // Fetch all categories (flat + hierarchical)
  const fetchAllCategories = useCallback(async () => {
    try {
      const apiBaseUrl = getApiBaseUrl()
      
      // Add timeout for mobile networks (30 seconds)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      // Fetch both flat and hierarchical categories in parallel
      const [flatRes, hierRes] = await Promise.all([
        fetch(`${apiBaseUrl}/products/categories/`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }).catch(() => null),
        fetch(`${apiBaseUrl}/products/categories/hierarchical`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }).catch(() => null)
      ])
      
      clearTimeout(timeoutId)
      
      if (!flatRes || !flatRes.ok) {
        setErrorMessage('Unable to connect to server. Please check your connection and try again.')
        return []
      }
      
      const categoriesData = await flatRes.json()
      setAllCategories(categoriesData)
      
      // Parse hierarchical data if available
      if (hierRes && hierRes.ok) {
        const hierData = await hierRes.json()
        // Only keep parents that have products
        const filtered = hierData.filter((p: any) => p.product_count > 0)
        setHierarchicalCategories(filtered)
        // Set parent category names as tabs
        const parentNames = filtered.map((p: any) => p.name)
        setCategories(["All", ...parentNames])
      } else {
        // Fallback to flat categories
        const categoriesWithProducts = categoriesData.filter((c: any) => (c.product_count || 0) > 0)
        const categoryNames = categoriesWithProducts.map((c: any) => c.name).sort()
        setCategories(["All", ...categoryNames])
      }
      
      return categoriesData
    } catch (error: any) {
      setErrorMessage('Unable to connect to server. Please check your connection and try again.')
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

  // Handle scroll for sticky tabs and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowStickyTabs(scrollY > 300)
      setShowScrollTop(scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize: Fetch categories first, then products (ONLY ONCE)
  useEffect(() => {
    // Strict guard to prevent multiple initializations
    if (mountedRef.current || initializedRef.current) {
      return
    }
    
    mountedRef.current = true
    initializedRef.current = true
    
    const initializeData = async () => {
      const categories = await fetchAllCategories()
      // Fetch all products initially to check for "Others" category
      if (categories && categories.length > 0) {
        await fetchProducts(categories)
      } else {
        await fetchProducts([])
      }
    }
    
    initializeData()
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handle category selection: resolve parent/sub IDs from selectedCategory name
  const handleCategorySelect = useCallback((categoryName: string, subCategoryId?: string) => {
    setSelectedCategory(categoryName)
    if (categoryName === "All") {
      setSelectedParentId(null)
      setSelectedSubId(null)
    } else if (subCategoryId) {
      // Sub-category clicked from mega-menu
      setSelectedSubId(subCategoryId)
      // Keep parent selected for UI
      const parent = hierarchicalCategories.find((p: any) => 
        p.children?.some((c: any) => c.id === subCategoryId)
      )
      setSelectedParentId(parent?.id || null)
    } else {
      // Parent category clicked
      const parent = hierarchicalCategories.find((p: any) => p.name === categoryName)
      setSelectedParentId(parent?.id || null)
      setSelectedSubId(null)
    }
    setHoveredParent(null)
  }, [hierarchicalCategories])

  // Reset to page 1 and clear products when search query or category changes
  // Then immediately fetch new products for the selected category
  useEffect(() => {
    // Skip on initial mount - initialization effect handles that
    if (!initializedRef.current || allCategories.length === 0) return
    
    // Mark that we're changing category to prevent infinite scroll from triggering
    categoryChangeRef.current = true
    setCurrentPage(1)
    setHasMore(true)
    // Clear products immediately to prevent showing stale data from previous category
    setProducts([])
    // Fetch products immediately for the new category, passing allCategories explicitly
    // Pass page 1 explicitly to avoid closure issue with currentPage
    fetchProducts(allCategories, false, 1).finally(() => {
      // Reset the flag after fetch completes
      categoryChangeRef.current = false
    })
  }, [debouncedSearchQuery, selectedCategory, selectedParentId, selectedSubId, allCategories])

  // Fetch more products when page changes (for infinite scroll, page > 1)
  useEffect(() => {
    // Don't fetch if we're in the middle of a category change
    if (categoryChangeRef.current) return
    if (initializedRef.current && allCategories.length > 0 && currentPage > 1) {
      fetchProducts(undefined, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  // Infinite scroll: Load more products when user scrolls near bottom
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setCurrentPage(prev => prev + 1)
        }
      },
      {
        rootMargin: '200px', // Trigger 200px before reaching the element
      }
    )

    observer.observe(loadMoreRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading])

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
      <nav className="bg-[#FED141] px-4 md:px-8 py-3 md:py-4">
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

      {/* Hero Section - Compact */}
      <section className="bg-[#FED141] px-4 md:px-8 py-2">
        <div className="text-center">
          <h1 className="text-base md:text-lg font-bold text-[#303A4D] mb-1">Shop Fresh Groceries</h1>

          {/* Search Bar with Auto-suggest */}
          <div className="max-w-xl mx-auto relative" onBlur={(e) => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => {
              if (!e.currentTarget.contains(document.activeElement)) {
                setShowSearchSuggestions(false)
              }
            }, 200)
          }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#303A4D]/60 z-10" />
            <input
              type="text"
              placeholder="Search for products or categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchSuggestions(true)}
              className="w-full bg-white rounded-full px-10 py-2.5 text-sm text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:ring-2 focus:ring-[#303A4D] shadow-sm transition-shadow duration-200 focus:shadow-md"
            />
            {/* Search suggestions dropdown */}
            {showSearchSuggestions && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-[300px] overflow-y-auto">
                {/* Category suggestions */}
                {(() => {
                  const q = searchQuery.toLowerCase()
                  const matchingCategories: { parent: any; child: any }[] = []
                  hierarchicalCategories.forEach((parent: any) => {
                    parent.children?.forEach((child: any) => {
                      if (child.name.toLowerCase().includes(q) && child.product_count > 0) {
                        matchingCategories.push({ parent, child })
                      }
                    })
                    if (parent.name.toLowerCase().includes(q)) {
                      matchingCategories.push({ parent, child: null })
                    }
                  })
                  if (matchingCategories.length === 0) return null
                  return (
                    <>
                      <div className="px-4 py-1 text-xs font-semibold text-[#303A4D]/50 uppercase">Categories</div>
                      {matchingCategories.slice(0, 5).map((match, idx) => (
                        <button
                          key={`cat-${idx}`}
                          className="w-full text-left px-4 py-2 text-sm text-[#303A4D] hover:bg-[#FED141]/20 transition-colors flex items-center gap-2"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (match.child) {
                              handleCategorySelect(match.child.name, match.child.id)
                            } else {
                              handleCategorySelect(match.parent.name)
                            }
                            setSearchQuery("")
                            setShowSearchSuggestions(false)
                          }}
                        >
                          <Package className="w-3.5 h-3.5 text-[#303A4D]/40" />
                          <span>{match.child ? match.child.name : match.parent.name}</span>
                          <span className="text-xs text-[#303A4D]/40 ml-auto">
                            {match.child ? `in ${match.parent.name}` : `${match.parent.product_count} items`}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )
                })()}
                <div className="px-4 py-1 text-xs font-semibold text-[#303A4D]/50 uppercase">Search Products</div>
                <div className="px-4 py-2 text-sm text-[#303A4D]/60 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search for &quot;{searchQuery}&quot;</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seasonal Packages Section */}
      <SeasonalPackagesSection variant="shop" />

      {/* Main Content */}
      <section className="px-4 md:px-8 pt-1 pb-4 md:pt-2 md:pb-6">
        <div className="w-full">
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

          {/* Category Filter - Only show after initial load completes */}
          {!loading && categories.length > 1 && (
          <div className="mb-4 md:mb-5">
            {/* Mobile: Grouped dropdown */}
            <div className="md:hidden">
              <select
                value={selectedSubId || selectedParentId || "All"}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "All") {
                    handleCategorySelect("All")
                  } else {
                    // Check if it's a parent or sub ID
                    const parent = hierarchicalCategories.find((p: any) => p.id === val)
                    if (parent) {
                      handleCategorySelect(parent.name)
                    } else {
                      // Find which parent this sub belongs to
                      for (const p of hierarchicalCategories) {
                        const sub = p.children?.find((c: any) => c.id === val)
                        if (sub) {
                          handleCategorySelect(sub.name, sub.id)
                          break
                        }
                      }
                    }
                  }
                }}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] focus:border-transparent appearance-none cursor-pointer shadow-sm"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23303A4D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                <option value="All">All Categories</option>
                {hierarchicalCategories.map((parent: any) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>All {parent.name} ({parent.product_count})</option>
                    {parent.children?.filter((c: any) => c.product_count > 0).map((child: any) => (
                      <option key={child.id} value={child.id}>
                        {child.name} ({child.product_count})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {/* Desktop: Mega-menu with hover sub-categories */}
            <div className="hidden md:block relative z-20">
              <div className="flex flex-wrap justify-center items-center gap-3 bg-white/60 backdrop-blur-sm border border-[#303A4D]/10 rounded-xl shadow-sm p-3">
                <button
                  onClick={() => handleCategorySelect("All")}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === "All"
                      ? 'bg-[#303A4D] text-white shadow-md'
                      : 'text-[#303A4D] hover:bg-[#FED141]/30'
                  }`}
                >
                  All
                </button>
                {hierarchicalCategories.map((parent: any) => (
                  <div
                    key={parent.id}
                    className="relative group/menu"
                    onMouseEnter={() => setHoveredParent(parent.id)}
                    onMouseLeave={() => setHoveredParent(null)}
                  >
                    <button
                      onClick={() => handleCategorySelect(parent.name)}
                      className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                        selectedCategory === parent.name || (selectedParentId === parent.id)
                          ? 'bg-[#303A4D] text-white shadow-md'
                          : 'text-[#303A4D] hover:bg-[#FED141]/30'
                      }`}
                    >
                      {parent.name}
                      {parent.children?.length > 0 && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {/* Mega-menu dropdown - pt-2 creates invisible hover bridge */}
                    {hoveredParent === parent.id && parent.children?.length > 0 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100]">
                        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => handleCategorySelect(parent.name)}
                          className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${
                            selectedParentId === parent.id && !selectedSubId
                              ? 'bg-[#FED141]/30 text-[#303A4D]'
                              : 'text-[#303A4D] hover:bg-[#FED141]/20'
                          }`}
                        >
                          All {parent.name} ({parent.product_count})
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        {parent.children.filter((c: any) => c.product_count > 0).map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => handleCategorySelect(child.name, child.id)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                              selectedSubId === child.id
                                ? 'bg-[#FED141]/30 text-[#303A4D] font-medium'
                                : 'text-[#303A4D]/80 hover:bg-[#FED141]/20 hover:text-[#303A4D]'
                            }`}
                          >
                            <span>{child.name}</span>
                            <span className="text-xs text-[#303A4D]/40">{child.product_count}</span>
                          </button>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Initial loading state - shows before categories load */}
          {loading && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4 animate-pulse" />
              <p className="text-2xl text-[#303A4D]/60">Loading products...</p>
            </div>
          )}

          {/* Loading state for category switching - only when changing categories, not initial load */}
          {isChangingCategory && !loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#FED141] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[#303A4D]/60 mt-2">Loading products...</p>
            </div>
          )}

          {/* Products Grid */}
          <div className={`relative z-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 transition-opacity duration-300 ${isChangingCategory ? 'opacity-50' : 'opacity-100'}`}>
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="group">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <Link href={`/product/${product.id}`}>
                    {/* Image Container - Clean white background */}
                    <div className="relative aspect-square bg-white p-3 md:p-4">
                      {product.image && product.image !== "/placeholder.svg" ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading={index < 4 ? "eager" : "lazy"}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      {/* Category Badge - Top left */}
                      <span className="absolute top-2 left-2 bg-gray-100 text-[#303A4D] px-2 py-0.5 rounded text-[10px] md:text-xs font-medium">
                        {product.category}
                      </span>
                      {/* Sale/Bundle Badges */}
                      {product.onSale && (
                        <span className="absolute top-2 right-2 bg-[#C24628] text-white px-2 py-0.5 rounded text-[10px] md:text-xs font-bold">SALE</span>
                      )}
                      {product.isBundle && (
                        <span className="absolute top-2 right-2 bg-[#93C90F] text-white px-2 py-0.5 rounded text-[10px] md:text-xs font-bold">BUNDLE</span>
                      )}
                      {/* Out of Stock Overlay */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="bg-gray-900 text-white px-3 py-1.5 rounded-full font-semibold text-xs">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="p-3 md:p-4 border-t border-gray-50">
                      <h3 className="text-sm md:text-base font-semibold text-[#303A4D] leading-tight line-clamp-2 min-h-[2.5rem] mb-2">{product.name}</h3>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg md:text-xl font-bold text-[#303A4D]">GH₵{product.price.toFixed(2)}</span>
                          {product.onSale && product.originalPrice && (
                            <span className="ml-1 text-xs text-gray-400 line-through">
                              GH₵{product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] md:text-xs text-gray-400">{product.unit}</span>
                    </div>
                  </Link>
                  {/* Add to Cart Button - Inside card */}
                  <div className="px-3 pb-3 md:px-4 md:pb-4">
                    <Button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedProduct(product)
                      }}
                      className="w-full bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-lg py-2.5 font-semibold text-xs md:text-sm transition-all"
                      disabled={!product.inStock}
                    >
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          {!loading && hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#FED141] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#303A4D] font-medium">Loading more products...</span>
                </div>
              )}
            </div>
          )}

          {/* End of products message */}
          {!loading && !hasMore && filteredProducts.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-[#303A4D]/60 font-medium">You've reached the end! 🎉</p>
            </div>
          )}

          {filteredProducts.length === 0 && !loading && !isChangingCategory && (
            <div className="text-center py-16">
              <p className="text-2xl text-[#303A4D]/60">No products found matching your search.</p>
            </div>
          )}

          {/* Pagination - Hidden with infinite scroll, kept for fallback */}
          {false && !loading && filteredProducts.length > 0 && totalPages > 1 && (
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
      
      {/* Sticky Category Tabs - iOS Glass Morphism */}
      {showStickyTabs && (
        <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 shadow-md border-b border-[#303A4D]/10 animate-in slide-in-from-top duration-300 py-3 px-4">
          <div className="w-full overflow-x-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex h-auto bg-[#F4F2E6]/80 backdrop-blur-sm border border-[#303A4D]/10 rounded-full shadow-sm p-1 gap-1 w-max mx-auto">
              <button
                onClick={() => handleCategorySelect("All")}
                className={`px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === "All"
                    ? 'bg-[#303A4D] text-white shadow-md'
                    : 'text-[#303A4D] hover:bg-[#FED141]/30'
                }`}
              >
                All
              </button>
              {hierarchicalCategories.map((parent: any) => (
                <div
                  key={parent.id}
                  className="relative"
                  onMouseEnter={() => setHoveredParent(parent.id)}
                  onMouseLeave={() => setHoveredParent(null)}
                >
                  <button
                    onClick={() => handleCategorySelect(parent.name)}
                    className={`px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1 ${
                      selectedParentId === parent.id
                        ? 'bg-[#303A4D] text-white shadow-md'
                        : 'text-[#303A4D] hover:bg-[#FED141]/30'
                    }`}
                  >
                    {parent.name}
                    {parent.children?.length > 0 && <ChevronDown className="w-3 h-3" />}
                  </button>
                  {hoveredParent === parent.id && parent.children?.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50">
                      {parent.children.filter((c: any) => c.product_count > 0).map((child: any) => (
                        <button
                          key={child.id}
                          onClick={() => handleCategorySelect(child.name, child.id)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                            selectedSubId === child.id
                              ? 'bg-[#FED141]/30 text-[#303A4D] font-medium'
                              : 'text-[#303A4D]/80 hover:bg-[#FED141]/20'
                          }`}
                        >
                          <span>{child.name}</span>
                          <span className="text-xs text-[#303A4D]/40">{child.product_count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button - only show when chatbot is closed */}
      {showScrollTop && !isChatbotOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      
      {/* AI Chatbot - always visible */}
      <AIChatbot onOpenChange={setIsChatbotOpen} />
    </div>
  )
}
