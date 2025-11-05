"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Gift, Plus, Search, Filter, Download, X, Loader2, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api/client"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface GiftCard {
  id: string
  code: string
  pin?: string
  amount: number
  original_amount: number
  card_type: string
  status: string
  expires_at: string | null
  generated_by_id: string
  redeemed_by_id: string | null
  redeemed_at: string | null
  created_at: string
}

interface GiftCardStats {
  total_generated: number
  total_redeemed: number
  total_active: number
  total_expired: number
  total_value_cedis: number
  total_redeemed_value_cedis: number
}

// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  
  // Handle FastAPI validation errors
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail
    
    // If detail is an array of validation errors
    if (Array.isArray(detail)) {
      return detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
    }
    
    // If detail is a string
    if (typeof detail === 'string') return detail
    
    // If detail is an object
    if (typeof detail === 'object') {
      return detail.msg || JSON.stringify(detail)
    }
  }
  
  return error?.message || 'An error occurred'
}

export default function AdminGiftCardsPage() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [stats, setStats] = useState<GiftCardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create form state
  const [createForm, setCreateForm] = useState({
    amount: '',
    quantity: '1',
    card_type: 'expiry',
    expiry_days: '30',
    description: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createdCards, setCreatedCards] = useState<GiftCard[]>([])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'admin') {
      fetchGiftCards()
      fetchStats()
    }
  }, [isAuthenticated, user])

  const fetchGiftCards = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/giftcards/', {
        params: {
          skip: 0,
          limit: 100,
          ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() })
        }
      })
      setGiftCards(response.data)
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      toast({
        title: "Error",
        description: "Failed to load gift cards",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/giftcards/stats/overview')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateGiftCards = async () => {
    if (!createForm.amount || parseFloat(createForm.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const quantity = parseInt(createForm.quantity)
      
      const payload: any = {
        amount: parseFloat(createForm.amount),
        card_type: createForm.card_type,
        description: createForm.description || null
      }

      // Add expiry_days only if card type is expiry
      if (createForm.card_type === 'expiry' && createForm.expiry_days) {
        payload.expiry_days = parseInt(createForm.expiry_days)
      }

      console.log('Sending payload:', payload)  // Debug log

      if (quantity === 1) {
        // Single card
        const response = await apiClient.post('/giftcards/generate', payload)
        setCreatedCards([response.data])
      } else {
        // Batch
        const response = await apiClient.post('/giftcards/generate/batch', {
          ...payload,
          quantity: quantity
        })
        setCreatedCards(response.data)
      }

      toast({
        title: "Success!",
        description: `${quantity} gift card(s) created successfully`,
      })

      // Reset form
      setCreateForm({
        amount: '',
        quantity: '1',
        card_type: 'expiry',
        expiry_days: '30',
        description: ''
      })

      // Refresh data
      fetchGiftCards()
      fetchStats()

    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: formatErrorMessage(error),
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to cancel this gift card?')) return

    try {
      await apiClient.post(`/giftcards/${cardId}/cancel`)
      toast({
        title: "Success",
        description: "Gift card cancelled successfully"
      })
      fetchGiftCards()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: formatErrorMessage(error),
        variant: "destructive"
      })
    }
  }

  const exportCreatedCards = () => {
    if (createdCards.length === 0) return

    const csv = [
      ['Code', 'PIN', 'Amount', 'Type', 'Expires At'].join(','),
      ...createdCards.map(card => [
        card.code,
        card.pin || '',
        card.amount,
        card.card_type,
        card.expires_at || 'Never'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gift-cards-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredCards = giftCards.filter(card => {
    const matchesSearch = card.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'redeemed': return 'bg-blue-100 text-blue-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'redeemed': return <CheckCircle className="w-4 h-4" />
      case 'expired': return <Clock className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="gift-cards-header"]',
      title: 'Gift Card Management',
      description: 'Issue and manage gift cards. Customers can purchase gift cards or receive them as gifts to shop on your platform.',
      position: 'bottom'
    },
    {
      target: '[data-tour="gift-card-stats"]',
      title: 'Gift Card Statistics',
      description: 'Quick overview: total created, redeemed, active cards, and total value. Monitor gift card sales and usage.',
      position: 'bottom'
    },
    {
      target: '[data-tour="issue-card"]',
      title: 'Issue Gift Card',
      description: 'Create new gift cards with specific amounts. Generate unique codes for customers to redeem during checkout.',
      position: 'left'
    },
    {
      target: '[data-tour="card-list"]',
      title: 'Gift Card Inventory',
      description: 'All gift cards with balances, redemption status, and transaction history. Track usage and remaining balances.',
      position: 'bottom'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="gift-cards" steps={tourSteps} />
      <div className="w-full">
        {/* Header */}
        <div data-tour="gift-cards-header" className="mb-8">
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Gift Card Management</h1>
          <p className="text-[#303A4D]/70">Create, manage, and track gift cards</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div data-tour="gift-card-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Created</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{stats.total_generated}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Redeemed</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{stats.total_redeemed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Cards</p>
                  <p className="text-2xl font-bold text-[#303A4D]">{stats.total_active}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-[#303A4D]">GH₵{stats.total_value_cedis.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            data-tour="issue-card"
            onClick={() => setShowCreateModal(true)}
            className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Gift Card
          </Button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Gift Cards Table */}
        <Card data-tour="card-list" className="p-6 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Expires</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#303A4D]">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-[#303A4D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#303A4D] mx-auto mb-2" />
                      <p className="text-gray-600">Loading gift cards...</p>
                    </td>
                  </tr>
                ) : filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No gift cards found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-mono text-sm font-semibold text-[#303A4D]">{card.code}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#303A4D]">GH₵{card.amount.toFixed(2)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {card.card_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(card.status)}`}>
                          {getStatusIcon(card.status)}
                          {card.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {card.expires_at ? new Date(card.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(card.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {card.status.toLowerCase() === 'active' && (
                          <Button
                            onClick={() => handleCancelCard(card.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Gift Card Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#303A4D]">Create Gift Card</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreatedCards([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {createdCards.length > 0 ? (
                <div>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold mb-2">
                      ✓ {createdCards.length} Gift Card(s) Created Successfully!
                    </p>
                    <p className="text-sm text-green-700">
                      Save these codes and PINs securely. They won't be shown again.
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
                    {createdCards.map((card, index) => (
                      <div key={card.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Card #{index + 1}</p>
                        <p className="font-mono text-sm font-semibold text-[#303A4D] mb-1">
                          Code: {card.code}
                        </p>
                        <p className="font-mono text-sm font-semibold text-[#303A4D]">
                          PIN: {card.pin}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Amount: GH₵{card.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={exportCreatedCards}
                      className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCreateModal(false)
                        setCreatedCards([])
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-1">
                      Amount (GHS) *
                    </label>
                    <input
                      type="number"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                      placeholder="50.00"
                      step="0.01"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={createForm.quantity}
                      onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                      placeholder="1"
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                      disabled={isCreating}
                    />
                    <p className="text-xs text-gray-500 mt-1">Create up to 100 cards at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-1">
                      Card Type *
                    </label>
                    <select
                      value={createForm.card_type}
                      onChange={(e) => setCreateForm({ ...createForm, card_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                      disabled={isCreating}
                    >
                      <option value="expiry">With Expiry (expires after set days)</option>
                      <option value="non_expiry">No Expiry (never expires)</option>
                    </select>
                  </div>

                  {createForm.card_type === 'expiry' && (
                    <div>
                      <label className="block text-sm font-medium text-[#303A4D] mb-1">
                        Expiry Days *
                      </label>
                      <input
                        type="number"
                        value={createForm.expiry_days}
                        onChange={(e) => setCreateForm({ ...createForm, expiry_days: e.target.value })}
                        placeholder="30"
                        min="1"
                        max="365"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                        disabled={isCreating}
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of days until card expires (1-365)</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="e.g., Holiday promotion"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                      disabled={isCreating}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleCreateGiftCards}
                      disabled={isCreating || !createForm.amount}
                      className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Create
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowCreateModal(false)}
                      variant="outline"
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
