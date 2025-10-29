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

export default function MessagesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState("1")
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
        const data = await messagesService.getConversations()
        setConversations(data)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [isAuthenticated])

  const hardcodedConversations = [
    {
      id: "1",
      name: "Ama Osei",
      avatar: "A",
      lastMessage: "Thanks for the tomatoes recommendation!",
      timestamp: "2m ago",
      unread: 2,
      online: true,
    },
    {
      id: "2",
      name: "Kwame Mensah",
      avatar: "K",
      lastMessage: "Are you joining the market visit on Friday?",
      timestamp: "1h ago",
      unread: 0,
      online: false,
    },
    {
      id: "3",
      name: "Accra Fresh Market",
      avatar: "AF",
      lastMessage: "New bulk buying opportunity available!",
      timestamp: "3h ago",
      unread: 1,
      online: true,
    },
  ]

  const messages = [
    {
      id: "1",
      senderId: "other",
      senderName: "Ama Osei",
      content: "Hi! I saw your post about the tomatoes. Are they still available?",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      senderId: "me",
      senderName: "You",
      content: "Yes! I got them from Makola Market. GH₵8/kg, very fresh!",
      timestamp: "10:32 AM",
    },
    {
      id: "3",
      senderId: "other",
      senderName: "Ama Osei",
      content: "That's a great price! Can you share the vendor's contact?",
      timestamp: "10:35 AM",
    },
    {
      id: "4",
      senderId: "me",
      senderName: "You",
      content: "Her name is Auntie Grace, stall 45 in the vegetable section.",
      timestamp: "10:36 AM",
    },
    {
      id: "5",
      senderId: "other",
      senderName: "Ama Osei",
      content: "Thanks for the tomatoes recommendation!",
      timestamp: "10:38 AM",
    },
  ]

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim()) {
      // API call would go here
      console.log("Sending message:", messageInput)
      setMessageInput("")
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
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedConversation === conv.id ? "bg-[#FED141]/20" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-[#303A4D] truncate">{conv.name}</h4>
                        <span className="text-xs text-[#303A4D]/60">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-[#303A4D]/60 truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-5 h-5 bg-[#C24628] text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-white overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
                    {conversations.find((c) => c.id === selectedConversation)?.avatar}
                  </div>
                  {conversations.find((c) => c.id === selectedConversation)?.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#303A4D]">
                    {conversations.find((c) => c.id === selectedConversation)?.name}
                  </h3>
                  <p className="text-xs text-[#303A4D]/60">
                    {conversations.find((c) => c.id === selectedConversation)?.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5 text-[#303A4D]" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${message.senderId === "me" ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.senderId === "me"
                          ? "bg-[#303A4D] text-white rounded-br-none"
                          : "bg-gray-100 text-[#303A4D] rounded-bl-none"
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                    <p className="text-xs text-[#303A4D]/60 mt-1 px-2">{message.timestamp}</p>
                  </div>
                </div>
              ))}
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
