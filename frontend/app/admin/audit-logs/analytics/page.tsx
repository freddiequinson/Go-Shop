"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, TrendingUp, Users, Globe, Clock, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Analytics {
  period_days: number
  total_logs: number
  error_count: number
  error_rate: number
  failed_logins: number
  by_status: Record<string, number>
  top_actions: Array<{ action: string; count: number }>
  top_users: Array<{ email: string; count: number }>
  top_ips: Array<{ ip: string; count: number }>
  hourly_activity: Array<{ hour: string; count: number }>
}

export default function AuditAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/v1/audit-logs/analytics/overview?days=${period}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch analytics",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    if (!confirm(`Delete audit logs older than 90 days? This cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/v1/audit-logs/cleanup?days=90`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message
        })
        fetchAnalytics()
      } else {
        toast({
          title: "Error",
          description: "Failed to cleanup logs",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="p-8 text-center">No data available</div>
  }

  const successRate = 100 - analytics.error_rate

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Audit Log Analytics</h1>
          <p className="text-[#303A4D]/70">System health and activity monitoring</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/audit-logs">
            <Button variant="outline">View Logs</Button>
          </Link>
          <Button onClick={handleCleanup} variant="destructive">
            Cleanup Old Logs (90+ days)
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {[7, 30, 90].map(days => (
          <Button
            key={days}
            onClick={() => setPeriod(days)}
            variant={period === days ? "default" : "outline"}
            className={period === days ? "bg-[#FED141] text-[#303A4D]" : ""}
          >
            Last {days} Days
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-500">Total Activity</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{analytics.total_logs.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">API calls & events</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Success Rate</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">{analytics.by_status.success || 0} successful</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-gray-500">Errors</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{analytics.error_count}</p>
          <p className="text-sm text-gray-500 mt-1">{analytics.error_rate.toFixed(1)}% error rate</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-500">Failed Logins</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{analytics.failed_logins}</p>
          <p className="text-sm text-gray-500 mt-1">Security alerts</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Actions */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Top Actions
          </h2>
          <div className="space-y-3">
            {analytics.top_actions.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm font-medium text-[#303A4D] capitalize">
                    {item.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#FED141] h-2 rounded-full"
                      style={{ width: `${(item.count / analytics.top_actions[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#303A4D] w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Users */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Most Active Users
          </h2>
          <div className="space-y-3">
            {analytics.top_users.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm font-medium text-[#303A4D] truncate">
                    {item.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.count / analytics.top_users[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#303A4D] w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top IP Addresses */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Top IP Addresses
          </h2>
          <div className="space-y-3">
            {analytics.top_ips.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm font-mono text-[#303A4D]">{item.ip}</span>
                </div>
                <span className="text-sm font-bold text-[#303A4D]">{item.count} requests</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Timeline */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            24-Hour Activity
          </h2>
          <div className="space-y-2">
            {analytics.hourly_activity.slice(-12).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16">
                  {item.hour ? new Date(item.hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max((item.count / Math.max(...analytics.hourly_activity.map(h => h.count))) * 100, 5)}%`
                    }}
                  >
                    <span className="text-xs text-white font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-6 bg-white mt-6">
        <h2 className="text-xl font-bold text-[#303A4D] mb-4">Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium mb-1">Success</p>
            <p className="text-2xl font-bold text-green-700">{analytics.by_status.success || 0}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700 font-medium mb-1">Failed</p>
            <p className="text-2xl font-bold text-orange-700">{analytics.by_status.failed || 0}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 font-medium mb-1">Error</p>
            <p className="text-2xl font-bold text-red-700">{analytics.by_status.error || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
