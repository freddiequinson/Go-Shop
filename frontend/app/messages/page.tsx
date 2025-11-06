"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Send, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/contexts/auth-context"
import { messagesService } from "@/lib/api/services"
import { MessageType } from "@/lib/types"

export default function MessagesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const response = await messagesService.getConversations()
        // Extract conversations array from response object
        const conversationsData = response.conversations || []
        setConversations(conversationsData)
        // Auto-select first conversation if available
        if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(String(conversationsData[0].id))
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        setConversations([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [isAuthenticated])

  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !isAuthenticated) return
      
      try {
        setLoadingMessages(true)
        const response = await messagesService.getMessages(parseInt(selectedConversation))
        setMessages(response.messages || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedConversation, isAuthenticated])

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim() && selectedConversation) {
      try {
        await messagesService.sendMessage(parseInt(selectedConversation), {
          content: messageInput,
          message_type: MessageType.TEXT,
        })
        setMessageInput("")
        // Refresh messages
        const response = await messagesService.getMessages(parseInt(selectedConversation))
        setMessages(response.messages || [])
      } catch (error) {
        console.error('Error sending message:', error)
      }
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
            <h1 className="text-2xl font-bold text-[#303A4D]">Messages</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 p-4 bg-white overflow-hidden flex flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-[#303A4D]/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-[#303A4D]/60">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-[#303A4D]/60">No conversations yet</div>
              ) : (
                filteredConversations.map((conv) => {
                  const initials = conv.title?.substring(0, 2).toUpperCase() || '??'
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(String(conv.id))}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        selectedConversation === String(conv.id) ? "bg-[#FED141]/20" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
                            {initials}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-[#303A4D] truncate">{conv.title || 'Conversation'}</h4>
                            <span className="text-xs text-[#303A4D]/60">
                              {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-[#303A4D]/60 truncate">{conv.type}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="w-5 h-5 bg-[#C24628] text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-white overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
                    {conversations.find((c) => c.id === selectedConversation)?.title?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#303A4D]">
                    {conversations.find((c) => c.id === selectedConversation)?.title || 'Conversation'}
                  </h3>
                  <p className="text-xs text-[#303A4D]/60">
                    {conversations.find((c) => c.id === selectedConversation)?.type || ''}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-[#303A4D]" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-8 text-[#303A4D]/60">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[#303A4D]/60">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.id
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isCurrentUser
                              ? "bg-[#303A4D] text-white rounded-br-none"
                              : "bg-gray-100 text-[#303A4D] rounded-bl-none"
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <p className="text-xs text-[#303A4D]/60 mt-1 px-2">
                          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border-[#303A4D]/20"
                />
                <Button type="submit" className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
