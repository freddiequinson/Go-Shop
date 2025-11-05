import Link from "next/link"
import { Package, Wallet, MessageSquare, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface OverviewTabProps {
  stats: {
    totalOrders: number
    totalSpent: number
    walletBalance: number
  }
  loadingStats: boolean
}

export function OverviewTab({ stats, loadingStats }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FED141]/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#303A4D]">
                {loadingStats ? "..." : stats.totalOrders}
              </p>
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
                {loadingStats ? "..." : `GH₵${stats.walletBalance.toFixed(2)}`}
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
                {loadingStats ? "..." : `GH₵${stats.totalSpent.toFixed(2)}`}
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
    </div>
  )
}
