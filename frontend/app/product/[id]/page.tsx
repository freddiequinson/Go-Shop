"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { User, ShoppingBag, Package, ArrowUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { CartNotification } from "@/components/cart-notification"
import { useParams } from "next/navigation"
import { ProductReviews } from "@/components/product-reviews"
import { cartService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { analyticsService } from "@/lib/services/analytics.service"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number | string
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
  onSale?: boolean
  originalPrice?: number
  isBundle?: boolean
  bundleItems?: string[]
  nutritionInfo?: any
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
    images: ["/images/apple-inhand.jpg", "/images/apple-inhand.jpg", "/images/apple-inhand.jpg"],
    description:
      "Crisp and sweet red apples, perfect for snacking or baking. Our apples are sourced from local farmers who use sustainable farming practices. Rich in fiber and vitamin C, these apples are a healthy addition to your diet.",
    isBundle: false,
    onSale: false,
    nutritionInfo: {
      calories: "52 per 100g",
      protein: "0.3g",
      carbs: "14g",
      fiber: "2.4g",
    },
  },
  {
    id: 2,
    name: "Organic Tomatoes",
    price: 8.5,
    unit: "per kg",
    category: "Vegetables",
    image: "/images/tomato.jpg",
    inStock: true,
    images: ["/images/tomato.jpg", "/images/tomato.jpg"],
    description: "Fresh organic tomatoes, locally sourced and bursting with flavor.",
    isBundle: false,
    onSale: true,
    originalPrice: 12.0,
  },
  {
    id: 9,
    name: "Family Grocery Bundle",
    price: 89.99,
    unit: "bundle",
    category: "Bundles",
    image: "/images/bags.jpg",
    inStock: true,
    images: ["/images/bags.jpg", "/images/bags.jpg"],
    description: "Complete family grocery bundle with rice, vegetables, fruits, and more!",
    isBundle: true,
    onSale: true,
    originalPrice: 120.0,
    bundleItems: ["5kg Rice", "2kg Tomatoes", "1kg Apples", "1kg Carrots", "Herbs Bundle"],
  },
]

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string

  const { addItem, uniqueItemsCount, refreshCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showStickyNav, setShowStickyNav] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowScrollTop(scrollY > 400)
      setShowStickyNav(scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Fetch category name
        let categoryName = "Uncategorized"
        if (data.category_id) {
          const catResponse = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/categories/${data.category_id}`)
          if (catResponse.ok) {
            const catData = await catResponse.json()
            categoryName = catData.name
          }
        }
        
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price_per_unit: data.price_per_unit,
          unit_type: data.unit_type,
          stock_quantity: data.stock_quantity,
          category_id: data.category_id,
          is_active: data.is_active,
          images: data.images || [],
          inStock: data.stock_quantity > 0,
          price: typeof data.price_per_unit === 'string' ? parseFloat(data.price_per_unit) : data.price_per_unit,
          unit: `per ${data.unit_type}`,
          category: categoryName,
          image: data.images && data.images.length > 0 ? data.images[0] : "/placeholder.svg"
        }
        
        setProduct(transformedProduct)
        
        // Track product view
        try {
          await analyticsService.trackProductView(data.id, {
            user_id: user?.id || null,
            referrer: document.referrer || null,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          })
        } catch (error) {
          // Silently fail - don't disrupt user experience
          console.log('Failed to track product view:', error)
        }
        
        // Fetch similar products (same category)
        if (data.category_id) {
          fetchSimilarProducts(data.category_id, data.id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilarProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products/?limit=100`)
      if (response.ok) {
        const data = await response.json()
        const productList = Array.isArray(data) ? data : data.products || data.items || []
        
        const similar = productList
          .filter((p: any) => p.category_id === categoryId && p.id !== currentProductId && p.is_active && p.stock_quantity > 0)
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            price: typeof p.price_per_unit === 'string' ? parseFloat(p.price_per_unit) : p.price_per_unit,
            unit: `per ${p.unit_type}`,
            image: p.images && p.images.length > 0 ? p.images[0] : "/placeholder.svg",
            inStock: p.stock_quantity > 0,
            category: "",
            description: p.description || "",
            price_per_unit: p.price_per_unit,
            unit_type: p.unit_type,
            stock_quantity: p.stock_quantity,
            category_id: p.category_id,
            is_active: p.is_active,
            images: p.images || []
          }))
        
        setSimilarProducts(similar)
      }
    } catch (error) {
      console.error("Failed to fetch similar products:", error)
    }
  }

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
      // Call backend API to add to cart
      await cartService.addToCart({
        product_id: product.id,
        quantity: quantity,
      })

      // Refresh cart from backend to get accurate count
      await refreshCart()

      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Package className="w-16 h-16 text-[#303A4D]/40 animate-pulse" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4" />
          <p className="text-2xl text-[#303A4D]/60">Product not found</p>
          <Link href="/shop">
            <Button className="mt-4 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <nav className="bg-[#FED141] px-3 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <Link href="/shop" className="text-sm sm:text-lg font-medium text-[#303A4D] hover:opacity-80 shrink-0">
            ← Back
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/images/logo.png"
              alt="go-shop"
              width={96}
              height={30}
              className="w-20 md:w-28 object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/login">
              <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </Link>
            <Link href="/cart">
              <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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

      <div className="w-full px-3 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-12 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-16">
          {/* Image Gallery */}
          <div>
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden mb-3 sm:mb-4 p-4 sm:p-8">
              <Image
                src={(product.images && product.images[selectedImage]) || product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain p-2 sm:p-4"
              />
              {product.onSale && (
                <div className="absolute top-3 sm:top-6 left-3 sm:left-6">
                  <span className="bg-[#C24628] text-white px-3 py-1.5 sm:px-6 sm:py-3 rounded-full text-sm sm:text-lg font-bold">SALE</span>
                </div>
              )}
              {product.isBundle && (
                <div className="absolute top-3 sm:top-6 right-3 sm:right-6">
                  <span className="bg-[#93C90F] text-white px-3 py-1.5 sm:px-6 sm:py-3 rounded-full text-sm sm:text-lg font-bold">BUNDLE</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 sm:h-24 sm:w-24 rounded-xl sm:rounded-2xl overflow-hidden bg-white shrink-0 ${
                      selectedImage === idx ? "ring-2 sm:ring-4 ring-[#FED141]" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-contain p-1 sm:p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-3 sm:mb-4">
              <span className="bg-[#FED141] text-[#303A4D] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                {product.category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#303A4D] mb-3 sm:mb-4 break-words">{product.name}</h1>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#303A4D]">GH₵{product.price.toFixed(2)}</span>
              {product.onSale && product.originalPrice && (
                <span className="text-xl sm:text-2xl text-[#303A4D]/40 line-through">GH₵{product.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-base sm:text-xl text-[#303A4D]/60 font-medium">{product.unit}</span>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-[#303A4D]/80 mb-6 sm:mb-8 leading-relaxed">{product.description}</p>

            {product.isBundle && product.bundleItems && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-[#303A4D] mb-3 sm:mb-4">Bundle Includes:</h3>
                <ul className="space-y-2">
                  {product.bundleItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-[#303A4D]">
                      <div className="w-2 h-2 rounded-full bg-[#FED141] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-4 sm:py-6 lg:py-8 text-base sm:text-lg lg:text-xl font-bold h-auto mb-3 sm:mb-4"
              disabled={!product.inStock}
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xs sm:text-sm text-[#303A4D]/60 mb-1">Delivery</p>
                  <p className="font-bold text-sm sm:text-base text-[#303A4D]">Wed, Fri, Sun</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-[#303A4D]/60 mb-1">Pricing</p>
                  <p className="font-bold text-sm sm:text-base text-[#93C90F]">No Hidden Cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mb-8 sm:mb-16">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#303A4D] mb-4 sm:mb-8">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {similarProducts.map((similar) => (
                <Link key={similar.id} href={`/product/${similar.id}`}>
                  <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="relative h-40 sm:h-48 lg:h-64 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5 overflow-hidden">
                      <Image
                        src={similar.image || "/placeholder.svg"}
                        alt={similar.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#303A4D] mb-1 sm:mb-2 line-clamp-2">{similar.name}</h3>
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-[#303A4D]">GH₵{similar.price.toFixed(2)}</span>
                        <span className="text-xs sm:text-sm text-[#303A4D]/60">{similar.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product Reviews */}
        <ProductReviews productId={product.id} productName={product.name} />
      </div>

      {showModal && (
        <AddToCartModal
          product={product}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAddToCart={(quantity, purchaseType) =>
            handleAddToCart(product, quantity, purchaseType)
          }
        />
      )}

      <CartNotification show={showNotification} productName={product.name} />

      {/* Sticky Navbar on Scroll */}
      {showStickyNav && (
        <nav className="fixed top-0 left-0 right-0 bg-[#FED141] px-3 sm:px-6 md:px-8 py-3 sm:py-4 z-50 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <Link href="/shop" className="text-sm sm:text-base font-medium text-[#303A4D] hover:opacity-80">
              ← Back
            </Link>

            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="go-shop"
                width={96}
                height={30}
                className="w-16 md:w-24 object-contain"
                priority
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4 text-white" />
                </button>
              </Link>
              <Link href="/cart">
                <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative">
                  <ShoppingBag className="w-4 h-4 text-white" />
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
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#303A4D] hover:bg-[#303A4D]/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  )
}
