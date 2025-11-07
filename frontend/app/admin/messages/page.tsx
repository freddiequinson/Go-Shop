"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send, Search, User, Clock, CheckCheck, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { messagesService } from "@/lib/api/services"
import { getUserFriendlyErrorMessage, getErrorTitle } from "@/lib/utils/error-messages"
import type { ConversationResponse, MessageResponse } from "@/lib/types"

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "active">("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      fetchMessages(String(selectedConversation.id))
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await messagesService.getConversations()
      const conversationsList = response.conversations || []
      setConversations(conversationsList)
      
      // Only auto-select if we have conversations and nothing is selected
      if (conversationsList.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsList[0])
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await messagesService.getMessages(Number(conversationId))
      setMessages(response.messages || [])
      
      // Messages are automatically marked as read when fetched
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      await messagesService.sendMessage(selectedConversation.id, {
        content: newMessage,
        message_type: "TEXT" as any,
      })

      setNewMessage("")
      await fetchMessages(String(selectedConversation.id))
      await fetchConversations() // Refresh to update last message
    } catch (error) {
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = 
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants?.some((p) => 
        p.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "unread" && (conv.unread_count || 0) > 0) ||
      (filterStatus === "active")
    
    return matchesSearch && matchesFilter
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Messages</h1>
        <p className="text-gray-600 mt-2">View and respond to customer inquiries</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="col-span-4 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="flex-1"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "unread" ? "default" : "outline"}
                onClick={() => setFilterStatus("unread")}
                className="flex-1"
              >
                Unread
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => setFilterStatus("active")}
                className="flex-1"
              >
                Active
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations found</div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants?.[0]
                const isSelected = selectedConversation?.id === conversation.id
                const hasUnread = (conversation.unread_count || 0) > 0

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {otherParticipant?.user?.full_name || "Customer"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversation.title || "Support Chat"}
                          </p>
                        </div>
                      </div>
                      {hasUnread && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message?.content || "No messages yet"}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {conversation.last_message?.created_at
                          ? formatTime(conversation.last_message.created_at)
                          : "No activity"}
                      </span>
                      {conversation.conversation_type && (
                        <Badge variant="outline" className="text-xs">
                          {conversation.conversation_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Messages Panel */}
        <Card className="col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.participants?.[0]?.user?.full_name || "Customer"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.title || "Support Chat"}
                    </p>
                  </div>
                </div>
                <Badge variant="default">
                  Active
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdmin = message.sender_id !== selectedConversation.participants?.[0]?.user_id
                    const isAutomated = false // Will be determined by message content or metadata

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isAdmin
                              ? "bg-blue-500 text-white"
                              : isAutomated
                              ? "bg-gray-100 text-gray-700 border border-gray-300"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          {isAutomated && (
                            <p className="text-xs text-gray-500 mb-1">🤖 Automated Response</p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isAdmin && message.is_read && (
                              <CheckCheck className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
