"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, Database, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { adminService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"

export default function DatabaseCleanup() {
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [confirmationCode, setConfirmationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const targets = [
    { id: "orders", label: "Orders & Payment History", description: "All orders, order items, and payment attempts", color: "text-red-600" },
    { id: "products", label: "Products", description: "All product listings", color: "text-orange-600" },
    { id: "categories", label: "Categories", description: "All product categories", color: "text-yellow-600" },
    { id: "inventory", label: "Inventory", description: "Warehouse inventory and movement records", color: "text-blue-600" },
    { id: "users", label: "Users (Non-Admin)", description: "All buyer and seller accounts (admins preserved)", color: "text-purple-600" }
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDatabaseStats()
      setStats(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch database statistics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTarget = (targetId: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(t => t !== targetId)
        : [...prev, targetId]
    )
    setPreview(null)
    setResult(null)
  }

  const handlePreview = async () => {
    if (selectedTargets.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one target to preview',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const data = await adminService.previewCleanup(selectedTargets)
      setPreview(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!confirmationCode) {
      toast({
        title: 'Confirmation Required',
        description: 'Please enter the confirmation code',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('⚠️ THIS ACTION CANNOT BE UNDONE!\n\nAre you absolutely sure you want to delete the selected data?')) {
      return
    }

    try {
      setExecuting(true)
      const data = await adminService.executeCleanup(selectedTargets, confirmationCode)
      setResult(data)
      
      toast({
        title: data.success ? 'Cleanup Complete' : 'Cleanup Completed with Errors',
        description: data.message
      })

      // Refresh stats
      fetchStats()
      setPreview(null)
      setSelectedTargets([])
      setConfirmationCode("")
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to execute cleanup',
        variant: 'destructive'
      })
    } finally {
      setExecuting(false)
    }
  }

  const getExpectedCode = () => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      return `DELETE-${userData.id.slice(0, 8)}`
    }
    return 'DELETE-XXXXXXXX'
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-12 h-12 text-[#303A4D]" />
            <h1 className="text-5xl font-bold text-[#303A4D]">Database Cleanup</h1>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 mb-1">⚠️ DANGER ZONE</p>
                <p className="text-red-700 text-sm">
                  This tool permanently deletes data from your database. Use with extreme caution.
                  Recommended for testing environments or before production deployment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Database Stats */}
        {stats && (
          <Card className="p-6 mb-8 bg-white">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              <Database className="w-6 h-6" />
              Current Database Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Orders</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.orders.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.orders.pending} pending, {stats.orders.completed} completed
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Products</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.products}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Users</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.users.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.users.admins} admins, {stats.users.buyers} buyers
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Order Items</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.order_items}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Categories</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.categories}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Inventory Records</p>
                <p className="text-3xl font-bold text-[#303A4D]">{stats.inventory_records}</p>
              </div>
            </div>
            <Button
              onClick={fetchStats}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
          </Card>
        )}

        {/* Target Selection */}
        <Card className="p-6 mb-8 bg-white">
          <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Select Data to Delete</h2>
          <div className="space-y-3">
            {targets.map(target => (
              <div
                key={target.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTargets.includes(target.id)
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToggleTarget(target.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(target.id)}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`font-bold ${target.color}`}>{target.label}</p>
                    <p className="text-sm text-gray-600">{target.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={handlePreview}
            disabled={selectedTargets.length === 0 || loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Loading...' : 'Preview Deletion'}
          </Button>
        </Card>

        {/* Preview Results */}
        {preview && (
          <Card className="p-6 mb-8 bg-yellow-50 border-2 border-yellow-500">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              Deletion Preview
            </h2>
            <p className="text-red-600 font-bold mb-4">{preview.warning}</p>
            
            <div className="space-y-4 mb-6">
              {Object.entries(preview.preview).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-white rounded-lg">
                  <p className="font-bold text-[#303A4D] mb-2 capitalize">{key}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                      subKey !== 'total' && subKey !== 'note' && (
                        <p key={subKey}>
                          <span className="font-medium">{subKey}:</span> {subValue}
                        </p>
                      )
                    ))}
                    {value.note && (
                      <p className="text-blue-600 italic">{value.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-red-100 rounded-lg mb-6">
              <p className="text-lg font-bold text-red-800">
                Total Records to Delete: {preview.grand_total}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Confirmation Code (Required)
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  Enter: <code className="bg-gray-200 px-2 py-1 rounded font-mono">{getExpectedCode()}</code>
                </p>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter confirmation code"
                  className="w-full max-w-md bg-white border-2 border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              <Button
                onClick={handleExecute}
                disabled={!confirmationCode || executing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Execute Deletion
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Execution Results */}
        {result && (
          <Card className={`p-6 ${result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <h2 className="text-2xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              Cleanup Results
            </h2>
            
            <p className={`font-bold mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>

            <div className="space-y-4 mb-4">
              {Object.entries(result.deleted).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-white rounded-lg">
                  <p className="font-bold text-[#303A4D] mb-2 capitalize">{key} Deleted</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                      subKey !== 'note' && (
                        <p key={subKey}>
                          <span className="font-medium">{subKey}:</span> {subValue}
                        </p>
                      )
                    ))}
                    {value.note && (
                      <p className="text-blue-600 italic mt-2">{value.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-100 rounded-lg">
                <p className="font-bold text-red-800 mb-2">Errors:</p>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {result.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Executed by: {result.admin} at {new Date(result.timestamp).toLocaleString()}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
