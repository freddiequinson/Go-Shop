"use client"

import { useState } from "react"
import { Home, Package, CheckCircle, User, BarChart3, Map, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"

export default function RiderSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/rider" },
    { icon: Package, label: "Active Deliveries", href: "/rider/deliveries" },
    { icon: Map, label: "Delivery Map", href: "/rider/map" },
    { icon: CheckCircle, label: "Completed", href: "/rider/history" },
    { icon: User, label: "Profile", href: "/rider/profile" },
    { icon: BarChart3, label: "Stats", href: "/rider/stats" },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#303A4D] text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-[#303A4D] min-h-screen text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-[#FED141]">Go-Shop</h1>
        <p className="text-sm text-white/60 mt-1">Rider Portal</p>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
            {user?.full_name?.charAt(0) || 'R'}
          </div>
          <div>
            <p className="font-semibold">{user?.full_name || 'Rider'}</p>
            <p className="text-xs text-white/60">{user?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-[#FED141] text-[#303A4D]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-white hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
      </div>
    </>
  )
}
