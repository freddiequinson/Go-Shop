"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { Bell, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { OnboardingProvider } from "@/lib/contexts/onboarding-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem("access_token")
    const user = localStorage.getItem("user")
    
    if (!token || !user) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(user)
    // User type is now uppercase (ADMIN)
    if (userData.user_type?.toUpperCase() !== "ADMIN") {
      router.push("/")
      return
    }
  }, [router])

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById('admin-main-content')
      if (mainContent) {
        setScrolled(mainContent.scrollTop > 20)
      }
    }

    const mainContent = document.getElementById('admin-main-content')
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll)
      return () => mainContent.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <OnboardingProvider>
      <div className="flex h-screen overflow-hidden bg-[#F4F2E6]">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className={`px-6 py-3 sticky top-0 z-10 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/70 backdrop-blur-lg border-b border-[#303A4D]/20 shadow-lg' 
            : 'bg-white border-b-2 border-[#303A4D]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image 
                  src="/images/logo.png" 
                  alt="go-shop" 
                  width={scrolled ? 70 : 90} 
                  height={scrolled ? 22 : 28}
                  className="transition-all duration-300"
                />
              </Link>
              <span className={`text-[#303A4D] font-bold transition-all duration-300 ${
                scrolled ? 'text-sm' : 'text-base'
              }`}>Admin Dashboard</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 bg-[#303A4D] text-white rounded-full hover:bg-[#303A4D]/90 transition-all duration-300 ${
                  scrolled ? 'py-1.5 text-sm' : 'py-2'
                }`}
              >
                <LogOut className={`transition-all duration-300 ${scrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="admin-main-content" className="flex-1 overflow-y-auto overflow-x-hidden w-full p-8">
          {children}
        </main>
        </div>
      </div>
    </OnboardingProvider>
  )
}
