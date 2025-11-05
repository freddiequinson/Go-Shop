"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Download, Gift, Loader2, Clock, X } from "lucide-react"
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/contexts/auth-context'
import { paymentsService } from '@/lib/api/services'
import apiClient from '@/lib/api/client'

export default function WalletPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Gift card redemption state
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardPin, setGiftCardPin] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const [walletData, txData] = await Promise.all([
          paymentsService.getWallet(),
          paymentsService.getTransactions()
        ])
        setWallet(walletData)
        setTransactions(txData)
      } catch (error) {
        console.error('Error fetching wallet data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [isAuthenticated])

  const stats = {
    totalCredits: transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0),
    totalDebits: transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Number(t.amount || 0), 0),
    transactionCount: transactions.length,
  }

  const handleRedeemGiftCard = async () => {
    if (!giftCardCode.trim() || !giftCardPin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both gift card code and PIN",
        variant: "destructive"
      })
      return
    }

    setIsRedeeming(true)
    try {
      const response = await apiClient.post('/giftcards/redeem', {
        code: giftCardCode.trim(),
        pin: giftCardPin.trim()
      })

      toast({
        title: "Success!",
        description: `Gift card redeemed! GH₵${response.data.amount_credited} added to your wallet.`,
      })

      // Clear form
      setGiftCardCode('')
      setGiftCardPin('')

      // Refresh wallet data
      const [walletData, txData] = await Promise.all([
        paymentsService.getWallet(),
        paymentsService.getTransactions()
      ])
      setWallet(walletData)
      setTransactions(txData)

    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.response?.data?.detail || "Failed to redeem gift card. Please check your code and PIN.",
        variant: "destructive"
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Profile</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">My Wallet</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-[#303A4D] to-[#303A4D]/80 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Wallet Balance</h2>
            </div>
            <p className="text-4xl font-bold mb-6">
              {loading ? '...' : `GH₵${Number(wallet?.balance || 0).toFixed(2)}`}
            </p>
            <Link href="/wallet/add-funds">
              <Button className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </Link>
          </Card>

          {/* Gift Card Redemption Button */}
          <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-[#FED141]/10 to-[#FED141]/5 border-[#FED141]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center">
                <Gift className="w-6 h-6 text-[#303A4D]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#303A4D]">Gift Cards</h2>
                <p className="text-sm text-gray-600">Redeem your gift card</p>
              </div>
            </div>
            <Button
              onClick={() => setShowRedeemModal(true)}
              className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
            >
              <Gift className="w-4 h-4 mr-2" />
              Redeem Gift Card
            </Button>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-1 grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Total Credits</p>
              </div>
              <p className="text-2xl font-bold text-[#303A4D]">
                GH₵{stats.totalCredits.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-sm text-gray-600">Total Debits</p>
              </div>
              <p className="text-2xl font-bold text-[#303A4D]">
                GH₵{stats.totalDebits.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-[#303A4D]">{stats.transactionCount}</p>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="mt-6 p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#303A4D]">Transaction History</h2>
            <Button variant="outline" className="border-[#303A4D]/20 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D] mx-auto mb-4"></div>
                <p className="text-[#303A4D] text-lg font-medium">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#303A4D] mb-2">No transactions yet</h3>
                <p className="text-gray-600 mb-6">Your transaction history will appear here</p>
                <Link href="/wallet/add-funds">
                  <Button className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                </Link>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.transaction_type === "credit" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {transaction.transaction_type === "credit" ? (
                        <ArrowDownLeft className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#303A4D]">{transaction.description || 'Transaction'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        • {transaction.reference_id || transaction.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.transaction_type === "credit" ? "+" : "-"}
                      GH₵{Number(transaction.amount || 0).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Gift Card Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowRedeemModal(false)
                setGiftCardCode('')
                setGiftCardPin('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center">
                <Gift className="w-6 h-6 text-[#303A4D]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#303A4D]">Redeem Gift Card</h2>
                <p className="text-sm text-gray-600">Enter your gift card details</p>
              </div>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Gift Card Code *
                </label>
                <input
                  type="text"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                  placeholder="GOSH-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  disabled={isRedeeming}
                />
                <p className="text-xs text-gray-500 mt-1">Enter the code from your gift card</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  PIN *
                </label>
                <input
                  type="password"
                  value={giftCardPin}
                  onChange={(e) => setGiftCardPin(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  disabled={isRedeeming}
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Enter the PIN from your gift card</p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowRedeemModal(false)
                    setGiftCardCode('')
                    setGiftCardPin('')
                  }}
                  disabled={isRedeeming}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleRedeemGiftCard()
                    if (!isRedeeming) {
                      setShowRedeemModal(false)
                      setGiftCardCode('')
                      setGiftCardPin('')
                    }
                  }}
                  disabled={isRedeeming || !giftCardCode.trim() || !giftCardPin.trim()}
                  className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
