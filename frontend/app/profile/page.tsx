"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ordersService, paymentsService } from "@/lib/api/services"
import { ProfileSidebar } from "@/components/profile/ProfileSidebar"
import { OverviewTab } from "@/components/profile/OverviewTab"
import { SecurityTab } from "@/components/profile/SecurityTab"
import { AddressesTab } from "@/components/profile/AddressesTab"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    walletBalance: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return

      try {
        setLoadingStats(true)

        // Fetch order stats
        const orderStats = await ordersService.getOrderStats()

        // Fetch wallet balance
        const wallet = await paymentsService.getWallet()

        setStats({
          totalOrders: orderStats.total_orders || 0,
          totalSpent: orderStats.total_revenue || 0,
          walletBalance: wallet.balance || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [isAuthenticated])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
          <p className="text-[#303A4D] text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Home</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">My Profile</h1>
            <Link href="/shop">
              <Button className="bg-[#303A4D] hover:bg-[#3B4559] text-white">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <ProfileSidebar user={user} onLogout={handleLogout} />

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <OverviewTab stats={stats} loadingStats={loadingStats} />
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <SecurityTab />
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <AddressesTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
