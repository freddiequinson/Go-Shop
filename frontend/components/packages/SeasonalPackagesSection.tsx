"use client"

import { useEffect, useState, useRef, useLayoutEffect } from "react"
import { cn } from "@/lib/utils"
import { ShoppingCart, Plus, Check } from "lucide-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import gsap from "gsap"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { cartService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"

interface PackageData {
  id: string
  name: string
  description: string | null
  image_url: string | null
  package_price: number
  original_value: number | null
  savings: number | null
  items_count: number
  is_active: boolean
  is_featured: boolean
  items?: PackageItemData[]
}

interface PackageItemData {
  id: string
  product_id: string
  quantity: number
  product?: {
    id: string
    name: string
    price_per_unit: number
  }
}

interface SeasonalEvent {
  id: string
  name: string
  description: string | null
  color_code: string
  promo_image_url: string | null
  lottie_animation: string | null
  show_popup: boolean
  packages: PackageData[]
}

interface MenuItem {
  num: string
  name: string
  clipId: string
  image: string
  packageId: string
  price: number
  originalPrice: number | null
  description: string | null
  itemsCount: number
}

const clipIds = ["clip-heart", "clip-hexagons", "clip-pixels"]

interface SeasonalPackagesSectionProps {
  variant?: "landing" | "shop"
}

export default function SeasonalPackagesSection({ variant = "landing" }: SeasonalPackagesSectionProps) {
  const [events, setEvents] = useState<SeasonalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<SVGImageElement>(null)
  const mainGroupRef = useRef<SVGGElement>(null)
  const masterTl = useRef<gsap.core.Timeline | null>(null)
  
  const { refreshCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchActiveEvents()
  }, [])

  const fetchActiveEvents = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/packages/active`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch seasonal events:", error)
    } finally {
      setLoading(false)
    }
  }

  // Get the active event (first one)
  const activeEvent = events[0]
  const themeColor = activeEvent?.color_code || "#DC2626"

  // Get all packages with their items for add-to-cart
  const allPackagesMap = new Map<string, PackageData>()
  events.forEach(event => {
    event.packages.forEach(pkg => {
      allPackagesMap.set(pkg.id, pkg)
    })
  })

  // Convert packages to menu items
  const getMenuItems = (): MenuItem[] => {
    if (events.length === 0) return []
    
    const allPackages = events.flatMap(event => event.packages)
    return allPackages.slice(0, 3).map((pkg, index) => ({
      num: String(index + 1).padStart(2, '0'),
      name: pkg.name,
      clipId: clipIds[index % clipIds.length],
      image: pkg.image_url || `https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1000`,
      packageId: pkg.id,
      price: pkg.package_price,
      originalPrice: pkg.original_value,
      description: pkg.description,
      itemsCount: pkg.items_count
    }))
  }

  const items = getMenuItems()

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return "GH₵0.00"
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return `GH₵${numPrice.toFixed(2)}`
  }

  const handleAddToCart = async (packageId: string, packageName: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      })
      return
    }

    setAddingToCart(packageId)
    
    try {
      // Get auth token
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error("Please sign in to add items to cart")
      }
      
      // Add the package as a single item to cart (not broken down into products)
      const response = await fetch(`${getApiBaseUrl()}/packages/package/${packageId}/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to add package to cart")
      }
      
      const result = await response.json()
      
      // Refresh cart to update count
      await refreshCart()
      
      // Show success state
      setAddedToCart(packageId)
      setTimeout(() => setAddedToCart(null), 2000)
      
      toast({
        title: "Added to cart!",
        description: `${packageName} has been added to your cart`,
      })
    } catch (error: any) {
      console.error("Failed to add package to cart:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add package to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(null)
    }
  }

  const createLoop = (index: number) => {
    if (items.length === 0) return
    const item = items[index]
    if (!item) return
    
    const selector = `#${item.clipId} .path`

    if (masterTl.current) masterTl.current.kill()

    if (imageRef.current) imageRef.current.setAttribute("href", item.image)
    if (mainGroupRef.current) mainGroupRef.current.setAttribute("clip-path", `url(#${item.clipId})`)
    
    gsap.set(selector, { scale: 0, transformOrigin: "50% 50%" })

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 })

    // 1. IN (Expo Out)
    tl.to(selector, {
      scale: 1,
      duration: 0.8,
      stagger: { amount: 0.4, from: "random" },
      ease: "expo.out",
    })
    // 2. IDLE (Sine Breath)
    .to(selector, {
      scale: 1.05,
      duration: 1.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
      stagger: { amount: 0.2, from: "center" }
    })
    // 3. OUT (Expo In)
    .to(selector, {
      scale: 0,
      duration: 0.6,
      stagger: { amount: 0.3, from: "edges" },
      ease: "expo.in",
    })

    masterTl.current = tl
  }

  useLayoutEffect(() => {
    if (items.length === 0) return
    
    const ctx = gsap.context(() => {
      createLoop(0)
    }, containerRef)
    return () => ctx.revert()
  }, [items.length])

  const handleItemHover = (index: number) => {
    if (index === activeIndex) return
    setActiveIndex(index)
    createLoop(index)
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-64 h-64 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (events.length === 0 || items.length === 0) {
    return null
  }

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative flex flex-col md:flex-row items-center justify-between min-h-screen w-full p-8 md:p-24 overflow-hidden transition-colors duration-500",
        "bg-white dark:bg-[#050505]"
      )}
    >
      {/* Event Header - Name, Description, Lottie */}
      <div className="absolute top-8 left-8 md:left-24 z-30 max-w-md">
        <div className="flex items-center gap-4 mb-3">
          {activeEvent?.lottie_animation && (
            <div className="w-16 h-16 flex-shrink-0">
              <DotLottieReact
                src={`/animations/${activeEvent.lottie_animation}`}
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}
          <h1 
            className="text-3xl md:text-4xl font-black uppercase tracking-tight"
            style={{ color: themeColor }}
          >
            {activeEvent?.name}
          </h1>
        </div>
        {activeEvent?.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
            {activeEvent.description}
          </p>
        )}
      </div>
      
      {/* LEFT SIDE: HIGH CONTRAST MENU */}
      <div className="z-20 w-full md:w-1/2 mt-32 md:mt-24">
        <nav>
          <ul className="flex flex-col gap-10 md:gap-14">
            {items.map((item, index) => (
              <li
                key={item.num}
                onMouseEnter={() => handleItemHover(index)}
                className="group cursor-pointer"
              >
                <div className="flex items-start gap-4 md:gap-6">
                  {/* Numbers */}
                  <span 
                    className={cn(
                      "text-2xl md:text-3xl font-bold transition-all duration-500 mt-2",
                      activeIndex === index 
                        ? "scale-110" 
                        : "text-zinc-400 dark:text-zinc-600" 
                    )}
                    style={activeIndex === index ? { color: themeColor } : {}}
                  >
                    {item.num}
                  </span>
                  
                  {/* Main Content */}
                  <div className="flex-1">
                    <h2 className={cn(
                      "text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight transition-all duration-700",
                      activeIndex === index 
                        ? "text-zinc-950 dark:text-white opacity-100 translate-x-4" 
                        : "opacity-40 translate-x-0 " + 
                          "text-zinc-500 dark:text-transparent " + 
                          "dark:[text-stroke:1.5px_#52525b] dark:[-webkit-text-stroke:1.5px_#52525b]"
                    )}>
                      {item.name}
                    </h2>
                    
                    {/* Price and Add to Cart - visible when active */}
                    {activeIndex === index && (
                      <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="text-2xl md:text-3xl font-bold"
                            style={{ color: themeColor }}
                          >
                            {formatPrice(item.price)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-lg text-gray-400 line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(item.packageId, item.name)}
                          disabled={addingToCart === item.packageId || addedToCart === item.packageId}
                          className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all duration-300",
                            "hover:scale-105 active:scale-95 disabled:opacity-70",
                            addedToCart === item.packageId && "bg-green-500"
                          )}
                          style={{ backgroundColor: addedToCart === item.packageId ? "#22c55e" : themeColor }}
                        >
                          {addingToCart === item.packageId ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Adding...
                            </>
                          ) : addedToCart === item.packageId ? (
                            <>
                              <Check className="w-5 h-5" />
                              Added!
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Description - visible when active */}
                    {activeIndex === index && item.description && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm animate-in fade-in slide-in-from-left-4 duration-300 delay-100">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* RIGHT SIDE: HEART SHAPE SVG */}
      <div className="relative w-full md:w-1/2 flex justify-center items-center mt-16 md:mt-0">
        <div 
          className="absolute w-[120%] h-[120%] blur-[120px] rounded-full transition-opacity duration-1000 opacity-20"
          style={{ backgroundColor: themeColor }}
        />
        
        <svg viewBox="0 0 500 500" className="w-[100%] max-w-[500px] h-auto z-10 drop-shadow-xl dark:drop-shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <defs>
            {/* Heart Shape Clip Path */}
            <clipPath id="clip-heart">
              <path 
                className="path" 
                d="M250,450 C150,350 20,280 20,170 C20,80 90,20 170,20 C220,20 250,60 250,60 C250,60 280,20 330,20 C410,20 480,80 480,170 C480,280 350,350 250,450 Z"
              />
              <path 
                className="path" 
                d="M250,400 C170,320 70,260 70,170 C70,100 120,60 180,60 C220,60 250,90 250,90 C250,90 280,60 320,60 C380,60 430,100 430,170 C430,260 330,320 250,400 Z"
              />
              <path 
                className="path" 
                d="M250,350 C190,290 120,240 120,170 C120,120 155,90 200,90 C230,90 250,115 250,115 C250,115 270,90 300,90 C345,90 380,120 380,170 C380,240 310,290 250,350 Z"
              />
            </clipPath>

            <clipPath id="clip-hexagons">
              <rect className="path" x="20" y="20" width="200" height="280" rx="12" />
              <rect className="path" x="20" y="320" width="200" height="160" rx="12" />
              <rect className="path" x="240" y="20" width="240" height="140" rx="12" />
              <rect className="path" x="240" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="370" y="180" width="110" height="160" rx="12" />
              <rect className="path" x="240" y="360" width="240" height="120" rx="12" />
            </clipPath>

            {/* Grid Squares */}
            <clipPath id="clip-pixels">
              {Array.from({ length: 9 }).map((_, i) => (
                <rect
                  key={i}
                  className="path"
                  x={(i % 3) * 160 + 20}
                  y={Math.floor(i / 3) * 160 + 20}
                  width="140"
                  height="140"
                  rx="4" 
                />
              ))}
            </clipPath>
          </defs>

          <g ref={mainGroupRef} clipPath={`url(#${items[0]?.clipId || 'clip-heart'})`}>
            <image
              ref={imageRef}
              href={items[0]?.image || ''}
              width="500"
              height="500"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
