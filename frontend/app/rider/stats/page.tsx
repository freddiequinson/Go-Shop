"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  Package, TrendingUp, Star, Coins, CheckCircle, XCircle, Clock, Award
} from "lucide-react"
import { ridersService } from "@/lib/services/riders"
import { useToast } from "@/hooks/use-toast"

export default function RiderStatsPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await ridersService.getMyStats()
      setStats(response.data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load stats",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-[#303A4D]">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Performance Statistics</h1>
        <p className="text-gray-600">Track your delivery performance and earnings</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-[#FED141] mx-auto mb-4" />
          <p className="text-5xl font-bold text-[#303A4D] mb-2">
            {stats?.total_deliveries || 0}
          </p>
          <p className="text-gray-600">Total Deliveries</p>
        </Card>

        <Card className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-5xl font-bold text-green-600 mb-2">
            {stats?.success_rate?.toFixed(0) || 0}%
          </p>
          <p className="text-gray-600">Success Rate</p>
        </Card>

        <Card className="p-8 text-center">
          <Star className="w-12 h-12 text-[#FED141] mx-auto mb-4" />
          <p className="text-5xl font-bold text-[#FED141] mb-2">
            {stats?.rating?.toFixed(1) || '0.0'}
          </p>
          <p className="text-gray-600">Average Rating</p>
        </Card>
      </div>

      {/* Earnings Card */}
      <Card className="p-8 mb-8">
        <div className="text-center mb-6">
          <Coins className="w-16 h-16 text-[#FED141] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#303A4D] mb-2">Today's Earnings</h3>
          <p className="text-6xl font-bold text-[#FED141]">
            GH₵{stats?.today_earnings?.toFixed(2) || '0.00'}
          </p>
          <p className="text-gray-600 mt-2">
            {stats?.today_deliveries || 0} deliveries completed today
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">This Week (Est.)</p>
            <p className="text-2xl font-bold text-[#303A4D]">
              GH₵{((stats?.today_earnings || 0) * 5).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">This Month (Est.)</p>
            <p className="text-2xl font-bold text-[#303A4D]">
              GH₵{((stats?.today_earnings || 0) * 20).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Delivery Breakdown */}
      <Card className="p-8">
        <h3 className="text-2xl font-bold text-[#303A4D] mb-6 text-center">Delivery Breakdown</h3>
        
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-green-600 mb-1">
              {stats?.successful_deliveries || 0}
            </p>
            <p className="text-gray-600">Successful</p>
          </div>

          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-red-600 mb-1">
              {stats?.failed_deliveries || 0}
            </p>
            <p className="text-gray-600">Failed</p>
          </div>

          <div className="text-center">
            <XCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-gray-600 mb-1">
              {stats?.cancelled_deliveries || 0}
            </p>
            <p className="text-gray-600">Cancelled</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
