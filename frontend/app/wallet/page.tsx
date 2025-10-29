"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/contexts/auth-context"
import { paymentsService } from "@/lib/api/services"

export default function WalletPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
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
    </div>
  )
}
