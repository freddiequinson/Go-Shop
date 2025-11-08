"use client"

import { Button } from "@/components/ui/button"
import { User, ShoppingBag, ArrowRight, Menu, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { CartDropdown } from "@/components/cart-dropdown"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const { items } = useCart()
  const { isAuthenticated, user } = useAuth()

  const heroSlides = [
    { text: "Your Home", image: "/images/apple-inhand.jpg", bg: "#FED141" },
    { text: "the Office", image: "/images/bags.jpg", bg: "#4698CA" },
    { text: "her School", image: "/images/tomato.jpg", bg: "#ED8B00" },
    { text: "his Hotel", image: "/images/rice.jpg", bg: "#93C90F" },
    { text: "our place", image: "/images/nkatie.jpg", bg: "#C24628" },
  ]

  const products = [
    {
      name: "Esi",
      role: "Fruit Vendor, Makola",
      image: "/images/products/banana.jpg",
      farmer: "/images/farmers/f1.jpg",
      color: "#FED141",
    },
    {
      name: "Ama",
      role: "Rice Farmer, Tema",
      image: "/images/rice.jpg",
      farmer: "/images/farmers/f2.jpg",
      color: "#4698CA",
    },
    {
      name: "Mimi Shop",
      role: "Grocery Shop, Mallam",
      image: "/images/products/herbs.jpg",
      farmer: "/images/farmers/shop1.jpg",
      color: "#ED8B00",
    },
    {
      name: "Cantonese Enterprise",
      role: "Grocery Shop, Dansoman",
      image: "/images/carter.jpg",
      farmer: "/images/farmers/shop2.jpg",
      color: "#93C90F",
    },
    {
      name: "Akosua",
      role: "Vegetable Vendor, Tudu",
      image: "/images/nkatie.jpg",
      farmer: "/images/farmers/f3.jpg",
      color: "#C24628",
    },
  ]

  const categories = [
    { name: "Breakfast", color: "#4698CA" },
    { name: "Lunch", color: "#FED141" },
    { name: "Dinner", color: "#FED141" },
    { name: "Fast food", color: "#CF6F5D" },
    { name: "Pasta and Noodles", color: "#ED8B00" },
    { name: "Baby Food & Formula", color: "#C0DF16" },
    { name: "Household Essentials", color: "#4698CA" },
    { name: "Personal Care & Hygiene", color: "#ED8B00" },
    { name: "Organic and Natural", color: "#FED141" },
  ]

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between px-8 py-6 bg-[#FED141]">
        <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80 cursor-pointer">
          Shop
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            Orders
          </a>
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
          <div className="relative">
            <button
              onClick={() => setCartDropdownOpen(!cartDropdownOpen)}
              onMouseEnter={() => setCartDropdownOpen(true)}
              onMouseLeave={() => setCartDropdownOpen(false)}
              className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FED141] text-[#303A4D] text-xs font-bold rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>
            {cartDropdownOpen && (
              <div onMouseEnter={() => setCartDropdownOpen(true)} onMouseLeave={() => setCartDropdownOpen(false)}>
                <CartDropdown />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-[#FED141]">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src="/images/logo.png" alt="go-shop" width={100} height={32} />
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
            <Link href="/shop" className="block text-2xl font-bold text-[#303A4D]">
              Shop
            </Link>
            <a href="#" className="block text-2xl font-bold text-[#303A4D]">
              Orders
            </a>
            <a href="#best-service" className="block text-2xl font-bold text-[#303A4D]">
              About
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[#FED141] px-6 md:px-8 pt-12 md:pt-16 pb-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-[clamp(2.5rem,8vw,7rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight mb-4">
              Fresh Groceries
              <sup className="text-[0.25em] align-super">®</sup>
            </h1>
            <h2 className="text-[clamp(2.5rem,8vw,7rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight">
              from the Market
            </h2>
            <h2 className="text-[clamp(2.5rem,8vw,7rem)] font-bold leading-[0.95] text-[#303A4D] tracking-tight">
              To {heroSlides[currentSlide].text}
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-12">
            <p className="text-lg md:text-xl text-[#303A4D] text-center md:text-left">
              Get all your groceries without all the hassle
            </p>
            <Button
              size="lg"
              className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-medium h-auto"
            >
              Find where to buy
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Decorative Circle Background */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[300px] md:h-[450px] bg-white/30 rounded-t-full -z-0" />

          {/* Hero Image */}
          <div className="relative z-10 flex justify-center items-end h-[550px] md:h-[800px]">
            <div className="relative w-[420px] md:w-[700px] h-[550px] md:h-[800px]">
              <Image
                src={heroSlides[currentSlide].image || "/placeholder.svg"}
                alt="Fresh groceries"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <div className="relative inline-block mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-[#303A4D] leading-tight">
                  Join the GoShop Community
                </h2>
                <div className="absolute -right-12 -top-8 w-24 h-24">
                  <Image src="/images/stamp.png" alt="stamp" fill className="object-contain rotate-12" />
                </div>
              </div>
              <p className="text-lg md:text-xl text-[#303A4D] mb-8">
                Stay up to date, discover new features, enjoy coupons, save on deals, and support the best shopping app.
              </p>
            </div>

            <div>
              <form className="space-y-6">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-transparent border-b-2 border-[#303A4D] px-0 py-3 text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:border-[#FED141]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-transparent border-b-2 border-[#303A4D] px-0 py-3 text-[#303A4D] placeholder:text-[#303A4D]/60 focus:outline-none focus:border-[#FED141]"
                />
                <select className="w-full bg-transparent border-b-2 border-[#303A4D] px-0 py-3 text-[#303A4D] focus:outline-none focus:border-[#FED141]">
                  <option value="">Region</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Other">Other</option>
                </select>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-medium h-auto w-full md:w-auto"
                >
                  Send
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-[#303A4D] leading-tight mb-8">
                Buy. Receive.
                <br />
                Enjoy.
              </h2>
            </div>
            <div>
              <p className="text-lg md:text-xl text-[#303A4D]">
                GoShop offers the best, easiest, and most convenient way to shop for your groceries. Receive your
                groceries directly to your office or home, directly with no hassle. We provide you with the best
                farmers, producers, and shop to ensure you get the best quality products.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.map((product, index) => (
              <div key={index} className="group cursor-pointer">
                <div
                  className="relative mb-4 aspect-square rounded-full overflow-hidden"
                  style={{ backgroundColor: product.color }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3">
                  <Image src={product.farmer || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>
                <h3 className="font-bold text-lg text-[#303A4D] mb-1">{product.name}</h3>
                <p className="text-sm text-[#303A4D]/70">{product.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals Image Section */}
      <section className="relative h-[400px] md:h-[600px] overflow-hidden">
        <Image src="/images/big.jpg" alt="Fresh groceries" fill className="object-cover" />
      </section>

      {/* Best Service Section */}
      <section id="best-service" className="relative py-16 md:py-24 px-6 md:px-8 bg-[#FED141] overflow-hidden">
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
              { value: "<1hr", label: "delivery time" },
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
      </section>

      {/* Protein Section */}
      <section className="relative py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]">
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
            <Image src="/images/woman.jpg" alt="Supporting farmers" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Freedom Section */}
      <section className="relative py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden">
            <Image src="/images/hose.jpg" alt="Farmer hand" fill className="object-cover" />
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
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 px-6 md:px-8 bg-[#F4F2E6]">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#303A4D] leading-tight mb-6">
            Plenty Shops. Infinite possibilities.
          </h2>
          <p className="text-lg md:text-xl text-[#303A4D] mb-8">Over 100 shops and categories to shop from.</p>
          <Button
            size="lg"
            className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-medium h-auto"
          >
            Get started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-hidden">
          <div className="flex gap-4 animate-marquee">
            {[...categories, ...categories].map((category, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64 h-80 rounded-3xl p-6 flex flex-col justify-between"
                style={{ backgroundColor: category.color }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-32 h-32 relative">
                    <Image src="/images/nkatie.jpg" alt={category.name} fill className="object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#303A4D] text-center">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#303A4D] text-white py-16 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Join our community</h3>
              <p className="text-lg mb-8 text-white/80">
                Get access to new recipes, exciting updates, and grab $1.00 off a pack of Go Shop products.
              </p>
              <form className="flex gap-4">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 bg-transparent border-b-2 border-white px-0 py-3 text-white placeholder:text-white/60 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-8 py-3 font-bold"
                >
                  Sign up
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
                    <a href="#" className="hover:text-white">
                      Your Orders
                    </a>
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
                  <li className="mt-4">info@go-shop.gh</li>
                  <li>G-shop Ghana</li>
                  <li>+233 55 000 0000</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} className="brightness-0 invert" />
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#FED141]">
                Instagram
              </a>
              <a href="#" className="hover:text-[#FED141]">
                Facebook
              </a>
              <a href="#" className="hover:text-[#FED141]">
                Pinterest
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
    </div>
  )
}
