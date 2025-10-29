"use client"

import { useEffect, useState } from "react"
import { Search, Filter, Calendar, User, FileText, AlertCircle, CheckCircle, XCircle, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  user_name?: string
  action: string
  action_description?: string
  resource_type?: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  status: string
  error_message?: string
  created_at: string
}

interface Stats {
  total_logs: number
  logs_today: number
  logs_this_week: number
  logs_this_month: number
  by_action: Record<string, number>
  by_status: Record<string, number>
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDays, setFilterDays] = useState("7")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [filterAction, filterStatus, filterDays])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const params = new URLSearchParams()
      
      if (filterAction !== "all") params.append("action", filterAction)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterDays !== "all") params.append("days", filterDays)
      if (searchTerm) params.append("search", searchTerm)
      params.append("limit", "200")
      
      const response = await fetch(`http://localhost:8000/api/v1/audit-logs/?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(Array.isArray(data) ? data : [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch audit logs",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/audit-logs/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleSearch = () => {
    fetchLogs()
  }

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "text-green-600 bg-green-100"
    if (action.includes("update")) return "text-blue-600 bg-blue-100"
    if (action.includes("delete")) return "text-red-600 bg-red-100"
    if (action.includes("login")) return "text-purple-600 bg-purple-100"
    return "text-gray-600 bg-gray-100"
  }

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle className="w-4 h-4 text-green-600" />
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-600" />
    if (status === "error") return <AlertCircle className="w-4 h-4 text-orange-600" />
    return <FileText className="w-4 h-4 text-gray-600" />
  }

  const formatAction = (action: string) => {
    return action.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Audit Logs</h1>
        <p className="text-[#303A4D]/70">Track all system activities and changes</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#303A4D]/60 text-sm mb-1">Total Logs</p>
            <p className="text-2xl font-bold text-[#303A4D]">{stats.total_logs}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#303A4D]/60 text-sm mb-1">Today</p>
            <p className="text-2xl font-bold text-blue-600">{stats.logs_today}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#303A4D]/60 text-sm mb-1">This Week</p>
            <p className="text-2xl font-bold text-green-600">{stats.logs_this_week}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#303A4D]/60 text-sm mb-1">This Month</p>
            <p className="text-2xl font-bold text-purple-600">{stats.logs_this_month}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search logs..."
              className="w-full bg-[#F4F2E6] rounded-2xl pl-12 pr-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="all">All Actions</option>
            <option value="user_login">User Login</option>
            <option value="user_register">User Register</option>
            <option value="user_create">User Create</option>
            <option value="user_update">User Update</option>
            <option value="user_delete">User Delete</option>
            <option value="product_create">Product Create</option>
            <option value="product_update">Product Update</option>
            <option value="product_delete">Product Delete</option>
            <option value="order_create">Order Create</option>
            <option value="payment_success">Payment Success</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="error">Error</option>
          </select>

          <select
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Action</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Resource</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303A4D]/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#303A4D]/60" />
                      <div>
                        <p className="text-sm font-medium text-[#303A4D]">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[#303A4D]/60">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#303A4D]/60" />
                      <div>
                        <p className="text-sm font-medium text-[#303A4D]">{log.user_name || log.user_email || "System"}</p>
                        {log.user_email && <p className="text-xs text-[#303A4D]/60">{log.user_email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.resource_type && (
                      <div>
                        <p className="text-sm font-medium text-[#303A4D] capitalize">{log.resource_type}</p>
                        {log.resource_id && <p className="text-xs text-[#303A4D]/60 font-mono">{log.resource_id.substring(0, 8)}...</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="text-sm capitalize">{log.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]/60 font-mono">{log.ip_address || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => setSelectedLog(log)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#303A4D]/60">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#303A4D]">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#303A4D]/60 hover:text-[#303A4D]"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#303A4D] mb-1">Action</label>
                <p className="text-[#303A4D]">{formatAction(selectedLog.action)}</p>
              </div>
              
              {selectedLog.action_description && (
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">Description</label>
                  <p className="text-[#303A4D]">{selectedLog.action_description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">User</label>
                  <p className="text-[#303A4D]">{selectedLog.user_name || selectedLog.user_email || "System"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="capitalize">{selectedLog.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">IP Address</label>
                  <p className="text-[#303A4D] font-mono">{selectedLog.ip_address || "N/A"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">Timestamp</label>
                  <p className="text-[#303A4D]">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedLog.resource_type && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#303A4D] mb-1">Resource Type</label>
                    <p className="text-[#303A4D] capitalize">{selectedLog.resource_type}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#303A4D] mb-1">Resource ID</label>
                    <p className="text-[#303A4D] font-mono text-sm">{selectedLog.resource_id}</p>
                  </div>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">User Agent</label>
                  <p className="text-[#303A4D] text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              )}
              
              {selectedLog.error_message && (
                <div>
                  <label className="block text-sm font-bold text-red-600 mb-1">Error Message</label>
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{selectedLog.error_message}</p>
                </div>
              )}
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-1">Additional Details</label>
                  <pre className="text-sm bg-[#F4F2E6] p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
