"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface StockAlert {
  id: string
  product_id: string
  alert_type: string
  priority: string
  message: string
  status: string
  created_at: string
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/alerts?limit=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/alerts/${alertId}/resolve`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-700 border-red-300"
      case "high": return "bg-orange-100 text-orange-700 border-orange-300"
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      default: return "bg-blue-100 text-blue-700 border-blue-300"
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const activeAlerts = alerts.filter(a => a.status === "ACTIVE")
  const resolvedAlerts = alerts.filter(a => a.status === "RESOLVED")

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Stock Alerts</h1>
        <p className="text-lg text-[#303A4D]/70">Monitor and manage inventory alerts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span className="text-sm text-red-900 font-medium">Active Alerts</span>
          </div>
          <p className="text-4xl font-bold text-red-900">{activeAlerts.length}</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-sm text-green-900 font-medium">Resolved</span>
          </div>
          <p className="text-4xl font-bold text-green-900">{resolvedAlerts.length}</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-sm text-blue-900 font-medium">Total Alerts</span>
          </div>
          <p className="text-4xl font-bold text-blue-900">{alerts.length}</p>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Active Alerts</h2>
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-[#303A4D]">No Active Alerts</p>
              <p className="text-[#303A4D]/60">All inventory levels are healthy!</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-3xl p-6 border-2 ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#303A4D]/10 text-[#303A4D]">
                        {alert.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-[#303A4D] mb-1">{alert.message}</p>
                    <p className="text-sm text-[#303A4D]/60">
                      Product ID: {alert.product_id.substring(0, 8)}... • {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Recently Resolved</h2>
          <div className="bg-white rounded-3xl p-6">
            <div className="space-y-3">
              {resolvedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-3 border-b border-[#F4F2E6] last:border-0">
                  <div>
                    <p className="font-medium text-[#303A4D]">{alert.message}</p>
                    <p className="text-sm text-[#303A4D]/60">{new Date(alert.created_at).toLocaleDateString()}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
