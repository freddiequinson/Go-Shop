"use client"

import { useState, useEffect } from "react"
import { X, Mail, Phone, User, Send, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import apiClient from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  itemType: "giftcard" | "coupon"
  itemCode: string
  onSendSuccess?: () => void
}

interface UserOption {
  id: string
  email: string
  phone_number: string
  full_name: string
  user_type: string
}

export default function SendModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemCode,
  onSendSuccess
}: SendModalProps) {
  const { toast } = useToast()
  const [sendMethod, setSendMethod] = useState<"manual" | "user">("manual")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen && sendMethod === "user") {
      fetchUsers()
    }
  }, [isOpen, sendMethod])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await apiClient.get("/users/")
      setUsers(response.data.users || response.data || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSend = async () => {
    try {
      setSending(true)

      const endpoint = itemType === "giftcard" 
        ? `/giftcards/${itemId}/send`
        : `/coupons/${itemId}/send`

      const payload: any = {
        message: message || undefined
      }

      if (sendMethod === "manual") {
        if (!email && !phone) {
          toast({
            title: "Error",
            description: "Please provide either email or phone number",
            variant: "destructive"
          })
          return
        }
        payload.recipient_email = email || undefined
        payload.recipient_phone = phone || undefined
      } else {
        if (!selectedUserId) {
          toast({
            title: "Error",
            description: "Please select a user",
            variant: "destructive"
          })
          return
        }
        payload.recipient_user_id = selectedUserId
      }

      const response = await apiClient.post(endpoint, null, { params: payload })

      toast({
        title: "Success",
        description: `${itemType === "giftcard" ? "Gift card" : "Coupon"} sent successfully!`,
      })

      onSendSuccess?.()
      handleClose()
    } catch (error: any) {
      console.error("Failed to send:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || `Failed to send ${itemType}`,
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setPhone("")
    setMessage("")
    setSelectedUserId("")
    setUserSearch("")
    setSendMethod("manual")
    onClose()
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.phone_number?.includes(userSearch)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#303A4D]">
            Send {itemType === "giftcard" ? "Gift Card" : "Coupon"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Code Display */}
        <div className="mb-6 p-4 bg-[#FED141]/10 border-2 border-[#FED141] rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Code:</p>
          <p className="text-2xl font-bold text-[#303A4D] tracking-wider">{itemCode}</p>
        </div>

        {/* Send Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#303A4D] mb-3">
            Send To:
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSendMethod("manual")}
              className={`p-4 rounded-lg border-2 transition-all ${
                sendMethod === "manual"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Mail className="w-6 h-6 mx-auto mb-2 text-[#303A4D]" />
              <p className="font-medium text-[#303A4D]">Manual Entry</p>
              <p className="text-xs text-gray-600">Email or Phone</p>
            </button>
            <button
              onClick={() => setSendMethod("user")}
              className={`p-4 rounded-lg border-2 transition-all ${
                sendMethod === "user"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-2 text-[#303A4D]" />
              <p className="font-medium text-[#303A4D]">Existing User</p>
              <p className="text-xs text-gray-600">Select from list</p>
            </button>
          </div>
        </div>

        {/* Manual Entry Form */}
        {sendMethod === "manual" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
              />
            </div>
            <p className="text-sm text-gray-600">
              * Provide at least one contact method
            </p>
          </div>
        )}

        {/* User Selection */}
        {sendMethod === "user" && (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#FED141] mx-auto" />
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        selectedUserId === user.id ? "bg-[#FED141]/10" : ""
                      }`}
                    >
                      <p className="font-medium text-[#303A4D]">{user.full_name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone_number && (
                        <p className="text-sm text-gray-600">{user.phone_number}</p>
                      )}
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded mt-1 inline-block">
                        {user.user_type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Custom Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#303A4D] mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            rows={3}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90 text-white"
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
