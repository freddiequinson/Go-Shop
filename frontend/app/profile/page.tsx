"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Package,
  Wallet,
  MessageSquare,
  Users,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ordersService, paymentsService } from "@/lib/api/services"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    walletBalance: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
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
        console.error('Error fetching stats:', error)
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
      console.error('Logout error:', error)
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
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <Card className="lg:col-span-1 p-6 bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#FED141] flex items-center justify-center mb-4 relative overflow-hidden">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-[#303A4D]" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#303A4D] mb-1">{user.full_name}</h2>
              <p className="text-gray-600 mb-2">{user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}</p>
              <span className="inline-block px-3 py-1 bg-[#FED141] text-[#303A4D] text-xs font-semibold rounded-full mb-4">
                {user.premium_tier.toUpperCase()}
              </span>

              <div className="w-full space-y-2">
                <Link href="/profile/edit" className="w-full block">
                  <Button className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="w-5 h-5 text-[#303A4D] mt-0.5" />
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-[#303A4D] font-medium">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-5 h-5 text-[#303A4D] mt-0.5" />
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-[#303A4D] font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5" />
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="text-[#303A4D] font-medium">{user.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-5 h-5 text-[#303A4D] mt-0.5" />
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="text-[#303A4D] font-medium">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats and Quick Links */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FED141]/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#303A4D]">{loadingStats ? '...' : stats.totalOrders}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FED141]/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#303A4D]">
                      {loadingStats ? '...' : `GH₵${stats.walletBalance.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-gray-600">Wallet Balance</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FED141]/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#303A4D]">
                      {loadingStats ? '...' : `GH₵${stats.totalSpent.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Links */}
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold text-[#303A4D] mb-4">Quick Links</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/orders">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent"
                  >
                    <Package className="w-5 h-5 mr-3 text-[#303A4D]" />
                    My Orders
                  </Button>
                </Link>

                <Link href="/wallet">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent"
                  >
                    <Wallet className="w-5 h-5 mr-3 text-[#303A4D]" />
                    My Wallet
                  </Button>
                </Link>

                <Link href="/messages">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-[#303A4D]" />
                    Messages
                  </Button>
                </Link>

                <Link href="/bubbles">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent"
                  >
                    <Users className="w-5 h-5 mr-3 text-[#303A4D]" />
                    My Bubbles
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Recent Activity - Removed hardcoded data, will be implemented with real-time activity feed */}
          </div>
        </div>
      </div>
    </div>
  )
}
