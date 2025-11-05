"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, FileText, User, LogOut, Menu, X, Settings, ShoppingBag, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OnboardingProvider } from "@/lib/contexts/onboarding-context"

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [supplierName, setSupplierName] = useState("")
  const [offersCount, setOffersCount] = useState(0)
  const [requestsCount, setRequestsCount] = useState(0)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
      return
    }

    // Get supplier name from localStorage, fallback to user data, then "Supplier"
    const storedSupplierName = localStorage.getItem("supplier_name")
    if (storedSupplierName) {
      setSupplierName(storedSupplierName)
    } else {
      // Try to get user's full name as fallback
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setSupplierName(user.full_name || "Supplier")
        } catch {
          setSupplierName("Supplier")
        }
      } else {
        setSupplierName("Supplier")
      }
    }

    // Fetch counts for offers and requests
    fetchCounts(token)
  }, [router])

  const fetchCounts = async (token: string) => {
    try {
      // Fetch pending offers count
      const offersRes = await fetch("http://localhost:8000/api/v1/supplier/offers?status=pending", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (offersRes.ok) {
        const offers = await offersRes.json()
        setOffersCount(offers.length)
      }

      // Fetch open requests count
      const requestsRes = await fetch("http://localhost:8000/api/v1/supplier/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (requestsRes.ok) {
        const requests = await requestsRes.json()
        // Count only open requests
        const openRequests = requests.filter((r: any) => r.status === 'open')
        setRequestsCount(openRequests.length)
      }
    } catch (error) {
      console.error("Failed to fetch counts:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("supplier_id")
    localStorage.removeItem("supplier_name")
    router.push("/login")
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/supplier/dashboard",
      icon: LayoutDashboard,
      count: 0
    },
    {
      name: "My Products",
      href: "/supplier/products",
      icon: ShoppingBag,
      count: 0
    },
    {
      name: "Requests",
      href: "/supplier/requests",
      icon: FileText,
      count: requestsCount
    },
    {
      name: "My Offers",
      href: "/supplier/offers",
      icon: Package,
      count: offersCount
    },
    {
      name: "Profile",
      href: "/supplier/profile",
      icon: User,
      count: 0
    },
    {
      name: "Settings",
      href: "/supplier/settings",
      icon: Settings,
      count: 0
    },
    {
      name: "Help",
      href: "/supplier/help",
      icon: HelpCircle,
      count: 0
    }
  ]

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#303A4D] text-white z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#FED141]">Go-Shop</h1>
          <p className="text-sm text-white/70 mt-1">Supplier Portal</p>
        </div>

        {/* Supplier Info */}
        <div className="p-6 border-b border-white/10">
          <p className="text-sm text-white/70">Welcome back,</p>
          <p className="font-bold text-lg mt-1">{supplierName}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                      ${isActive 
                        ? 'bg-[#FED141] text-[#303A4D] font-bold' 
                        : 'text-white/80 hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.count > 0 && (
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-[#303A4D] text-white' : 'bg-[#FED141] text-[#303A4D]'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
