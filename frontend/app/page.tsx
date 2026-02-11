"use client"

import { Button } from "@/components/ui/button"
import { User, ShoppingBag, ArrowRight, Menu, X, Instagram } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useCallback, useRef, FormEvent } from "react"
import { useCart } from "@/lib/cart-context"
import { CartDropdown } from "@/components/cart-dropdown"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import dynamic from "next/dynamic"
import { FaFacebook, FaWhatsapp } from "react-icons/fa"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import { motion, AnimatePresence, useInView } from "motion/react"
import AIChatbot from "@/components/AIChatbot"
import { DeviceMockup } from "@/components/ui/macbook-scroll"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import SeasonalPackagesSection from "@/components/packages/SeasonalPackagesSection"
import SeasonalPopup from "@/components/packages/SeasonalPopup"

// CDN base URL for static images (faster loading)
const CDN_URL = "https://goshop-images.lon1.cdn.digitaloceanspaces.com/static/images"

// Dynamically import animation components with error handling
const SplitText = dynamic(() => import("@/components/SplitText"), {
  ssr: false,
  loading: () => <span className="opacity-0">Loading...</span>,
})

const RotatingText = dynamic(() => import("@/components/RotatingText"), {
  ssr: false,
  loading: () => <span className="opacity-0">Loading...</span>,
})

interface CategoryWithProduct {
  id: string
  name: string
  color: string
  product?: {
    id: string
    name: string
    price: number
    image: string
    unit: string
  }
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [animationError, setAnimationError] = useState(false)
  const [categoryProducts, setCategoryProducts] = useState<CategoryWithProduct[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [communityEmail, setCommunityEmail] = useState('')
  const [isSubmittingCommunity, setIsSubmittingCommunity] = useState(false)
  const { items } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  // Color palette for categories
  const categoryColors = ["#4698CA", "#FED141", "#ED8B00", "#93C90F", "#C24628", "#CF6F5D", "#C0DF16"]

  // Fetch categories with random products (silently falls back to static categories if backend unavailable)
  useEffect(() => {
    const fetchCategoriesWithProducts = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        
        // Fetch categories with timeout
        const catResponse = await fetch(`${apiBaseUrl}/products/categories/`, {
          signal: AbortSignal.timeout(8000)
        }).catch(() => null)
        
        if (!catResponse || !catResponse.ok) {
          // Backend not available - use static fallback
          setLoadingCategories(false)
          return
        }
        
        const categoriesData = await catResponse.json()
        
        // Filter categories with products
        const categoriesWithProducts = categoriesData.filter((c: any) => (c.product_count || 0) > 0)
        
        if (categoriesWithProducts.length === 0) {
          setLoadingCategories(false)
          return
        }
        
        // Get today's date as seed for "daily" random selection
        const today = new Date()
        const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        
        // For each category, fetch one random product
        const categoriesWithProductData: CategoryWithProduct[] = await Promise.all(
          categoriesWithProducts.slice(0, 10).map(async (cat: any, index: number) => {
            try {
              const prodResponse = await fetch(`${apiBaseUrl}/products/shop?category_id=${cat.id}&per_page=20`, {
                signal: AbortSignal.timeout(5000)
              }).catch(() => null)
              
              if (!prodResponse || !prodResponse.ok) {
                return { id: cat.id, name: cat.name, color: categoryColors[index % categoryColors.length] }
              }
              
              const prodData = await prodResponse.json()
              const products = prodData.products || prodData.items || prodData || []
              
              if (products.length > 0) {
                const randomIndex = (daySeed + index) % products.length
                const product = products[randomIndex]
                
                return {
                  id: cat.id,
                  name: cat.name,
                  color: categoryColors[index % categoryColors.length],
                  product: {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price_per_unit) || 0,
                    image: product.primary_image_url || '/images/nkatie.jpg',
                    unit: product.unit_type || 'each'
                  }
                }
              }
              return { id: cat.id, name: cat.name, color: categoryColors[index % categoryColors.length] }
            } catch {
              return { id: cat.id, name: cat.name, color: categoryColors[index % categoryColors.length] }
            }
          })
        )
        
        const filtered = categoriesWithProductData.filter(c => c.product)
        if (filtered.length > 0) {
          setCategoryProducts(filtered)
        }
      } catch {
        // Silently fail - will use static fallback categories
      } finally {
        setLoadingCategories(false)
      }
    }
    
    fetchCategoriesWithProducts()
  }, [])

  // Error boundary for animations
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('is not a function') || event.message?.includes('Segmenter')) {
        console.error('Animation error caught:', event.message)
        setAnimationError(true)
        event.preventDefault()
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])

  const heroSlides = [
    { text: "Your Home", image: `${CDN_URL}/apple-inhand.jpg`, bg: "#FED141" },
    { text: "The Office", image: `${CDN_URL}/rice.png`, bg: "#4698CA" },
    { text: "Your School", image: `${CDN_URL}/bags.png`, bg: "#ED8B00" },
    { text: "The Hostel", image: `${CDN_URL}/carter.png`, bg: "#93C90F" },
    { text: "Your Place", image: `${CDN_URL}/tomato.png`, bg: "#C24628" },
  ]

  const products = [
    {
      name: "Esi",
      role: "Fruit Vendor, Makola",
      image: `${CDN_URL}/products/banana.jpg`,
      farmer: `${CDN_URL}/farmers/f1.jpg`,
      color: "#FED141",
    },
    {
      name: "Ama",
      role: "Rice Farmer, Tema",
      image: `${CDN_URL}/rice.jpg`,
      farmer: `${CDN_URL}/farmers/f2.jpg`,
      color: "#4698CA",
    },
    {
      name: "Mimi Shop",
      role: "Grocery Shop, Mallam",
      image: `${CDN_URL}/products/herbs.jpg`,
      farmer: `${CDN_URL}/farmers/shop1.jpg`,
      color: "#ED8B00",
    },
    {
      name: "Cantonese Enterprise",
      role: "Grocery Shop, Dansoman",
      image: `${CDN_URL}/carter.jpg`,
      farmer: `${CDN_URL}/farmers/shop2.jpg`,
      color: "#93C90F",
    },
    {
      name: "Akosua",
      role: "Vegetable Vendor, Tudu",
      image: `${CDN_URL}/nkatie.jpg`,
      farmer: `${CDN_URL}/farmers/f3.jpg`,
      color: "#C24628",
    },
  ]

  const categories = [
    { name: "Fruits", color: "#4698CA", image: `${CDN_URL}/products/banana.jpg` },
    { name: "Vegetables", color: "#FED141", image: `${CDN_URL}/tomato.jpg` },
    { name: "Grains & Rice", color: "#ED8B00", image: `${CDN_URL}/rice.jpg` },
    { name: "Nuts & Seeds", color: "#93C90F", image: `${CDN_URL}/nkatie.jpg` },
    { name: "Fresh Produce", color: "#C24628", image: `${CDN_URL}/carter.jpg` },
    { name: "Groceries", color: "#CF6F5D", image: `${CDN_URL}/bags.jpg` },
    { name: "Herbs & Spices", color: "#C0DF16", image: `${CDN_URL}/products/herbs.jpg` },
    { name: "Household", color: "#4698CA", image: `${CDN_URL}/big.jpg` },
    { name: "Bundles", color: "#FED141", image: `${CDN_URL}/apple-inhand.jpg` },
  ]

  // Announcement messages for the launch banner
  const launchAnnouncements = [
    "🚀 We have launched! Fresh foodstuff, delivered to your door.",
    "🎉 We're live — Your new favorite way to shop!",
    "Yɛafi ase! Tɔ ade fi GoShopGhana. Yɛn nneɛma nso yɛ fofoofo!",
    "✨ GoShopGhana is now live!",
    "🛒 Shop now at GoShopGhana!",
    "🌟 Fresh products available now — Shop smarter with GoShop!",
  ]

  const [currentAnnouncement, setCurrentAnnouncement] = useState(0)

  // Rotate announcements and hero slides together
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % launchAnnouncements.length)
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [heroSlides.length])

  // Handle community signup form submission
  const handleCommunitySignup = async (e: FormEvent) => {
    e.preventDefault()
    if (!communityEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingCommunity(true)
    try {
      await apiClient.post('/community/signup', { email: communityEmail })
      toast({
        title: "🎉 Welcome to GoShop!",
        description: "You'll be notified of updates and when our mobile app is available on the app stores.",
      })
      setCommunityEmail('')
    } catch (error) {
      toast({
        title: "Signup Successful",
        description: "You'll be notified of updates and when our mobile app is available.",
      })
      setCommunityEmail('')
    } finally {
      setIsSubmittingCommunity(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6] overflow-x-hidden">
      {/* Launch Announcement Banner - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#FED141] text-[#303A4D] py-2 md:py-2.5 shadow-sm overflow-hidden">
        <div className="relative flex items-center justify-between gap-2 px-3 md:px-4 max-w-7xl mx-auto">
          {/* Announcement Text - Marquee on mobile, static on desktop */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Mobile: Scrolling marquee */}
            <div className="md:hidden overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAnnouncement}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="animate-marquee-text whitespace-nowrap"
                >
                  <span className="text-xs font-semibold tracking-wide inline-block pr-8">
                    {launchAnnouncements[currentAnnouncement]}
                  </span>
                  <span className="text-xs font-semibold tracking-wide inline-block pr-8">
                    {launchAnnouncements[currentAnnouncement]}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Desktop: Static centered text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAnnouncement}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="hidden md:block"
              >
                <p className="text-sm font-semibold tracking-wide text-center">
                  {launchAnnouncements[currentAnnouncement]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Share Button */}
          <button
            onClick={() => {
              const shareText = "🛒 Shop for quality and affordable products from GoShop Ghana! Fresh foodstuff delivered to your door."
              const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://goshopghana.com'
              
              if (navigator.share) {
                navigator.share({
                  title: 'GoShop Ghana - Now Live!',
                  text: shareText,
                  url: shareUrl,
                })
              } else {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " " + shareUrl)}`, '_blank')
              }
            }}
            className="flex-shrink-0 bg-[#303A4D] hover:bg-[#3B4559] text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span className="hidden xs:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Spacer for fixed banner */}
      <div className="h-10"></div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between px-8 py-6 bg-[#FED141]">
        <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80 cursor-pointer">
          Shop
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/">
            <Image src={`${CDN_URL}/logo.png`} alt="go-shop" width={96} height={30} className="w-24 h-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/orders" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            Orders
          </Link>
          <a href="#best-service" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            About
          </a>
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
          <div 
            className="relative"
            onMouseEnter={() => setCartDropdownOpen(true)}
            onMouseLeave={() => setCartDropdownOpen(false)}
          >
            <Link href="/cart">
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative cursor-pointer">
                <ShoppingBag className="w-5 h-5 text-white" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FED141] text-[#303A4D] text-xs font-bold rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </Link>
            {cartDropdownOpen && <CartDropdown />}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-[#FED141] relative z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src={`${CDN_URL}/logo.png`} alt="go-shop" width={80} height={25} className="w-20 h-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <button className="w-10 h-10 rounded-full bg-[#303A4D] flex items-center justify-center overflow-hidden relative cursor-pointer">
                {isAuthenticated && user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </button>
            </Link>
            <Link href="/cart">
              <button className="w-10 h-10 rounded-full bg-[#303A4D] flex items-center justify-center relative cursor-pointer">
                <ShoppingBag className="w-4 h-4 text-white" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FED141] text-[#303A4D] text-xs font-bold rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-full bg-[#F4F2E6] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#303A4D]" /> : <Menu className="w-5 h-5 text-[#303A4D]" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="px-6 py-4 space-y-4 bg-[#FED141]">
            <Link 
              href="/shop" 
              className="block text-2xl font-bold text-[#303A4D]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              href="/orders" 
              className="block text-2xl font-bold text-[#303A4D]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Orders
            </Link>
            <a 
              href="#best-service" 
              className="block text-2xl font-bold text-[#303A4D]"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay - Click to close (Mobile only) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden lg:hidden xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hero Section */}
      <section className="relative bg-[#FED141] px-4 md:px-8 pt-6 md:pt-10 pb-0 md:pb-8 overflow-hidden w-full min-h-fit md:min-h-[calc(100vh-40px)]">
        <div className="max-w-7xl mx-auto relative z-10 h-full flex flex-col">
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-[clamp(2rem,7vw,5rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight">
              Fresh Foodstuff
            </h1>
            <h2 className="text-[clamp(2rem,7vw,5rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight">
              from the Market
            </h2>
            <h2 className="text-[clamp(2rem,7vw,5rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight flex items-center justify-center gap-2 md:gap-4 overflow-hidden">
              <span>To</span>
              <span className="relative inline-block min-w-[120px] md:min-w-[200px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentSlide}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="inline-block"
                  >
                    {heroSlides[currentSlide].text}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-4">
            <p className="text-base md:text-lg text-[#303A4D] text-center md:text-left">
              Get all your foodstuff without all the hassle
            </p>
            <Link href="/shop">
              <Button
                size="lg"
                className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-5 md:px-8 py-4 md:py-5 text-sm md:text-base font-medium h-auto"
              >
                Find where to buy
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          </div>

          {/* Decorative Circle Background */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(500px,95vw)] md:w-[700px] h-[200px] md:h-[350px] bg-white/30 rounded-t-full -z-0" />

          {/* Hero Image */}
          <div className="relative z-10 flex justify-center items-end flex-1 min-h-[200px] md:min-h-[400px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.8 }}
                className="relative w-[min(320px,85vw)] md:w-[500px] h-[280px] md:h-[420px]"
              >
                <Image
                  src={heroSlides[currentSlide].image || "/placeholder.svg"}
                  alt="Fresh foodstuff"
                  fill
                  className="object-contain object-bottom"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Seasonal Packages Section */}
      <SeasonalPackagesSection variant="landing" />

      {/* Community Section */}
      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="py-12 md:py-20 lg:py-32 px-3 sm:px-4 md:px-6 bg-[#F4F2E6]"
      >
        <div className="max-w-[98%] sm:max-w-[95%] md:max-w-[90%] mx-auto bg-[#3D4A5C] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] px-5 sm:px-8 md:px-12 lg:px-20 py-10 sm:py-12 md:py-16 lg:py-24 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20">
            <div>
              <div className="relative mb-6 sm:mb-8 md:mb-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight">
                  Join the GoShop
                  <br />
                  Community
                </h2>
                {/* Stamp positioned in the middle of "Go-" - responsive positioning */}
                <div className="absolute top-0 left-[140px] sm:left-[240px] md:left-[320px] lg:left-[400px] xl:left-[480px] -translate-y-1 sm:-translate-y-2 w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36">
                  <div className="relative w-full h-full">
                    {/* Yellow stamp background */}
                    <div className="absolute inset-0 bg-[#FED141] rounded-full"></div>
                    {/* Rotating stamp image */}
                    <Image 
                      src={`${CDN_URL}/stamp.png`} 
                      alt="Fast Delivery Badge" 
                      fill 
                      className="object-contain animate-spin" 
                      style={{ 
                        animation: 'spin 20s linear infinite'
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 mb-8 sm:mb-10 max-w-xl leading-relaxed">
                Stay up to date, discover new features, enjoy coupons, save on deals, and support the best shopping app.
              </p>
            </div>

            <div>
              <form className="space-y-6 sm:space-y-8 md:space-y-10">
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full bg-transparent border-b border-white/30 sm:border-b-2 px-0 py-3 sm:py-4 md:py-5 text-white text-base sm:text-lg md:text-xl lg:text-2xl placeholder:text-white/60 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full bg-transparent border-b border-white/30 sm:border-b-2 px-0 py-3 sm:py-4 md:py-5 text-white text-base sm:text-lg md:text-xl lg:text-2xl placeholder:text-white/60 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <select className="w-full bg-transparent border-b border-white/30 sm:border-b-2 px-0 py-3 sm:py-4 md:py-5 text-white text-base sm:text-lg md:text-xl lg:text-2xl focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer">
                    <option value="" className="bg-[#3D4A5C] text-white">Region</option>
                    <option value="Greater Accra" className="bg-[#3D4A5C] text-white">Greater Accra</option>
                    <option value="Eastern" className="bg-[#3D4A5C] text-white">Eastern</option>
                    <option value="Ashanti" className="bg-[#3D4A5C] text-white">Ashanti</option>
                    <option value="Other" className="bg-[#3D4A5C] text-white">Other</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-white hover:bg-white/90 text-[#303A4D] rounded-full px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 lg:py-7 text-base sm:text-lg md:text-xl lg:text-2xl font-bold h-auto group relative overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Send
                    <div className="ml-3 sm:ml-4 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#303A4D]" />
                    </div>
                  </span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Shop From Home Section - Device Mockup */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full overflow-hidden bg-[#F4F2E6]"
      >
        <DeviceMockup
          title={
            <span className="text-[#303A4D]">
              Shop from the comfort of your home. <br /> 
              <span className="text-[#FED141]">Fresh foodstuff, delivered.</span>
            </span>
          }
          ipadSrc="/goshopscreenshot.png"
          iphoneSrc="/iphonescreen.jpg"
        />
      </motion.section>

      {/* Goals Image Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative h-[400px] md:h-[600px] overflow-hidden"
      >
        <Image src={`${CDN_URL}/big.jpg`} alt="Fresh foodstuff" fill className="object-cover" />
      </motion.section>

      {/* Best Service Section */}
      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        id="best-service" 
        className="relative py-16 md:py-24 px-6 md:px-8 bg-[#FED141] overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute top-10 right-10 w-64 h-64" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#F1B424" strokeWidth="20" />
          </svg>
          <svg className="absolute bottom-10 left-10 w-48 h-48" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#FAC13E" strokeWidth="15" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-[#303A4D] leading-tight mb-12">
            We bring only the best service to you.
          </h2>

          <Button
            size="lg"
            className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-medium h-auto mb-16"
          >
            View Shop
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "0", label: "additional fees" },
              { value: "100%", label: "quality" },
              { value: "3x", label: "weekly deliveries" },
              { value: "100%", label: "satisfaction" },
            ].map((stat, index) => (
              <div key={index} className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-full bg-white border-8 border-[#F1B424] flex items-center justify-center">
                  <span className="text-3xl md:text-4xl font-bold text-[#303A4D]">{stat.value}</span>
                </div>
                <p className="font-bold text-[#303A4D]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Protein Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#303A4D] leading-tight mb-8">
              We stand with the hands that feed us.
            </h2>
            <p className="text-lg md:text-xl text-[#303A4D] mb-8">
              Our crop-growers, vendors and small businesses are the backbone of our community. GoShop is committed to
              supporting them and ensuring they have access to the resources they need to succeed, and you to enjoy the
              best of what Ghana has to offer.
            </p>
            <Button
              size="lg"
              className="bg-[#4698CA] hover:bg-[#3B7FAD] text-white rounded-full px-8 py-6 text-lg font-medium h-auto"
            >
              Buy from our farmers
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden">
            <Image src={`${CDN_URL}/woman.jpg`} alt="Supporting farmers" fill className="object-cover" />
          </div>
        </div>
      </motion.section>

      {/* Freedom Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden">
            <Image src={`${CDN_URL}/hose.jpg`} alt="Farmer hand" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-[#303A4D] leading-tight mb-8">
              We stand for our farmers
            </h2>
            <p className="text-lg md:text-xl text-[#303A4D] mb-8">
              GoShop is more than just shopping — it's a way to give back, strengthen local livelihoods, and ensure
              that the hands that feed us continue to thrive.
            </p>
            <Button
              size="lg"
              className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-medium h-auto"
            >
              Join Us
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]"
      >
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#303A4D] leading-tight mb-6">
            Plenty Shops. Infinite possibilities.
          </h2>
          <p className="text-lg md:text-xl text-[#303A4D] mb-8">Over 100 shops and categories to shop from.</p>
          <Link href="/shop">
            <Button
              size="lg"
              className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-medium h-auto"
            >
              Get started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden">
          <div className="flex gap-4 animate-marquee">
            {categoryProducts.length > 0 ? (
              [...categoryProducts, ...categoryProducts].map((category, index) => (
                <Link 
                  href="/shop" 
                  key={index}
                  className="flex-shrink-0 w-64 h-96 rounded-3xl p-6 flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer"
                  style={{ backgroundColor: category.color }}
                >
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 relative mb-4">
                      <Image 
                        src={category.product?.image || '/images/nkatie.jpg'} 
                        alt={category.product?.name || category.name} 
                        fill 
                        className="object-contain rounded-xl" 
                      />
                    </div>
                    {category.product && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-[#303A4D]/80 line-clamp-2">{category.product.name}</p>
                        <p className="text-lg font-bold text-[#303A4D]">GH₵{category.product.price.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#303A4D] text-center">{category.name}</h3>
                </Link>
              ))
            ) : (
              [...categories, ...categories].map((category, index) => (
                <Link 
                  href="/shop" 
                  key={index}
                  className="flex-shrink-0 w-64 h-80 rounded-3xl p-6 flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer"
                  style={{ backgroundColor: category.color }}
                >
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-32 h-32 relative">
                      <Image src={category.image} alt={category.name} fill className="object-contain rounded-xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#303A4D] text-center">{category.name}</h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-[#303A4D] text-white py-16 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Join our community</h3>
              <p className="text-lg mb-8 text-white/80">
                Get access to new recipes, exciting updates, and support GoShop products.
              </p>
              <form className="flex gap-4" onSubmit={handleCommunitySignup}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={communityEmail}
                  onChange={(e) => setCommunityEmail(e.target.value)}
                  className="flex-1 bg-transparent border-b-2 border-white px-0 py-3 text-white placeholder:text-white/60 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmittingCommunity}
                  className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-8 py-3 font-bold disabled:opacity-50"
                >
                  {isSubmittingCommunity ? 'Signing up...' : 'Sign up'}
                </Button>
              </form>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-lg mb-4">More Info</h4>
                <ul className="space-y-2 text-white/80">
                  <li>
                    <a href="#" className="hover:text-white">
                      FAQs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Shop
                    </a>
                  </li>
                  <li>
                    <Link href="/orders" className="hover:text-white">
                      Your Orders
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Wholesale
                    </a>
                  </li>
                  <li className="mt-4">Accra, Ghana</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-4">Reach Out</h4>
                <ul className="space-y-2 text-white/80">
                  <li>
                    <a href="#" className="hover:text-white">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Resources
                    </a>
                  </li>
                  <li className="mt-4">gsgshopease@gmail.com</li>
                  <li>Goshop Ghana</li>
                  <li>+233 20 622 1924</li>
                  <li className="mt-2">
                    <a href="https://instagram.com/gsgshopease" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#FED141] transition-colors">
                      <Instagram className="w-4 h-4" />
                      @gsgshopease
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <Image src={`${CDN_URL}/logo.png`} alt="go-shop" width={124} height={39} className="brightness-0 invert" />
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#FED141] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#FED141] transition-colors">
                <FaFacebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#FED141] transition-colors">
                <FaWhatsapp className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">
                Cookies
              </a>
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
            </div>
            <p>© GoShop Ghana, 2025. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Seasonal Popup */}
      <SeasonalPopup />
    </div>
  )
}
