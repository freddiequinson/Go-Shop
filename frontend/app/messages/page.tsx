"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Send, MoreVertical, Package, ShoppingCart, HelpCircle, FileText, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/contexts/auth-context"
import { messagesService } from "@/lib/api/services"
import { MessageType, ConversationType } from "@/lib/types"
import OnboardingTour from "@/components/onboarding/OnboardingTour"
import { messagesTourSteps } from "@/lib/onboarding-tours/user-tours"

export default function MessagesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionType, setMentionType] = useState<"order" | "product" | null>(null)
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [searchProducts, setSearchProducts] = useState<any[]>([])
  const [creatingSupport, setCreatingSupport] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

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
        // Handle both UUID strings and numeric IDs
        const conversationId = selectedConversation.includes('-') 
          ? selectedConversation 
          : parseInt(selectedConversation)
        const response = await messagesService.getMessages(conversationId as any)
        // Reverse messages so oldest is first (bottom)
        const sortedMessages = (response.messages || []).reverse()
        setMessages(sortedMessages)
        setLoadingMessages(false)
        // Scroll to bottom after messages load
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } catch (error) {
        console.error('Error fetching messages:', error)
        setLoadingMessages(false)
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
    
    console.log('Send message triggered', { messageInput, selectedConversation })
    
    if (!messageInput.trim()) {
      console.log('Message is empty')
      return
    }
    
    if (!selectedConversation) {
      console.log('No conversation selected')
      return
    }
    
    try {
      // Conversation ID can be UUID string or number
      const conversationId = selectedConversation.includes('-') 
        ? selectedConversation 
        : parseInt(selectedConversation)
      
      console.log('Sending message to conversation:', conversationId)
      
      await messagesService.sendMessage(conversationId as any, {
        content: messageInput,
        conversation_id: conversationId,
      } as any)
      
      console.log('Message sent successfully')
      setMessageInput("")
      
      // Refresh messages after a short delay to allow auto-response to be created
      setTimeout(async () => {
        const response = await messagesService.getMessages(conversationId as any)
        const sortedMessages = (response.messages || []).reverse()
        setMessages(sortedMessages)
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    } catch (error: any) {
      console.error('Error sending message:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error details:', JSON.stringify(error.response?.data, null, 2))
      console.error('Error status:', error.response?.status)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageInput(value)
    
    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true)
      setMentionSearch("")
    } else if (lastAtIndex !== -1 && value[lastAtIndex] === '@') {
      const searchTerm = value.substring(lastAtIndex + 1)
      if (!searchTerm.includes(' ')) {
        setMentionSearch(searchTerm)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (type: 'order' | 'product', item: any) => {
    const lastAtIndex = messageInput.lastIndexOf('@')
    const beforeAt = messageInput.substring(0, lastAtIndex)
    const mention = type === 'order' 
      ? `@order:${item.id} (Order #${item.order_number}) `
      : `@product:${item.id} (${item.name}) `
    setMessageInput(beforeAt + mention)
    setShowMentions(false)
  }

  const handleCreateSupportConversation = async () => {
    try {
      setCreatingSupport(true)
      console.log('Creating support conversation...')
      
      const conversation = await messagesService.createSupportConversation()
      console.log('Support conversation created:', conversation)
      
      // Add to conversations list and select it
      const updatedConversations = [conversation, ...conversations]
      setConversations(updatedConversations)
      setSelectedConversation(String(conversation.id))
      
      console.log('Conversation added to state, ID:', conversation.id)
      console.log('Selected conversation set to:', String(conversation.id))
    } catch (error: any) {
      console.error('Error creating support conversation:', error)
      console.error('Error details:', error.response?.data)
      alert(`Failed to create support conversation: ${error.response?.data?.detail || error.message}`)
    } finally {
      setCreatingSupport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingTour tourId="messages" steps={messagesTourSteps} />
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl font-semibold">Messages</h1>
            </div>
            {/* Mobile menu toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)]">
          {/* Conversations List - Mobile Sidebar */}
          <Card className={`lg:col-span-1 p-3 sm:p-4 bg-white overflow-hidden flex flex-col ${
            showSidebar ? 'fixed inset-0 z-30 lg:relative' : 'hidden lg:flex'
          }`} data-tour="conversations-list">
            <div className="mb-4" data-tour="search-conversations">
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
                <div className="text-center py-8">
                  <p className="text-[#303A4D]/60 mb-4">No conversations yet</p>
                  <Button 
                    onClick={handleCreateSupportConversation}
                    disabled={creatingSupport}
                    className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
                  >
                    {creatingSupport ? 'Creating...' : '💬 Contact Support'}
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const initials = conv.title?.substring(0, 2).toUpperCase() || '??'
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(String(conv.id))
                        setShowSidebar(false) // Close sidebar on mobile
                      }}
                      className={`w-full p-3 sm:p-4 rounded-lg text-left transition-colors ${
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
          <Card className="lg:col-span-2 bg-white overflow-hidden flex flex-col" data-tour="chat-area">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden h-8 w-8 flex-shrink-0"
                  onClick={() => setShowSidebar(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold text-sm sm:text-base">
                    {conversations.find((c) => String(c.id) === selectedConversation)?.title?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#303A4D] text-sm sm:text-base truncate">
                    {conversations.find((c) => String(c.id) === selectedConversation)?.title || 'Conversation'}
                  </h3>
                  <p className="text-xs text-[#303A4D]/60 truncate">
                    {conversations.find((c) => String(c.id) === selectedConversation)?.conversation_type || ''}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-[#303A4D]" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
              {loadingMessages ? (
                <div className="text-center py-8 text-[#303A4D]/60">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-[#FED141]/10 rounded-full mb-4">
                    <Send className="w-8 h-8 text-[#303A4D]/40" />
                  </div>
                  <p className="text-[#303A4D]/60 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id
                    const isSystemMessage = message.message_type === 'system'
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                          {!isCurrentUser && message.sender && (
                            <p className="text-xs font-semibold text-[#303A4D]/70 mb-1 px-2 flex items-center gap-1">
                              {isSystemMessage && <span className="text-[#FED141]">🤖</span>}
                              {message.sender.full_name || message.sender.username}
                              {isSystemMessage && <span className="text-[10px] bg-[#FED141]/20 px-1.5 py-0.5 rounded-full">Auto-reply</span>}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm ${
                              isCurrentUser
                                ? "bg-[#303A4D] text-white rounded-br-none shadow-[#303A4D]/20"
                                : isSystemMessage
                                  ? "bg-gradient-to-br from-[#FED141]/30 to-[#FED141]/10 text-[#303A4D] border-2 border-[#FED141]/50 rounded-bl-none"
                                  : "bg-white text-[#303A4D] border border-gray-200 rounded-bl-none"
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className="text-xs text-[#303A4D]/60 mt-1 px-2">
                            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-[#303A4D] mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessageInput("I have a question about my order #")
                      setShowQuickActions(false)
                    }}
                    className="justify-start"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ask about Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessageInput("I need help with a product: ")
                      setShowQuickActions(false)
                    }}
                    className="justify-start"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Product Question
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessageInput("I need help with payment/refund")
                      setShowQuickActions(false)
                    }}
                    className="justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Payment Issue
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessageInput("I need general assistance")
                      setShowQuickActions(false)
                    }}
                    className="justify-start"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    General Help
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="text-xs sm:text-sm h-7 sm:h-8"
                  data-tour="quick-actions-btn"
                >
                  {showQuickActions ? "Hide" : "Show"} Quick Actions
                </Button>
              </div>
              <div className="flex gap-2 sm:gap-3 relative">
                <div className="flex-1 relative">
                  <Input
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e as any)
                      }
                    }}
                    placeholder="Type @ to mention..."  
                    className="border-[#303A4D]/20 text-sm sm:text-base h-10 sm:h-11"
                    data-tour="message-input"
                  />
                  
                  {/* Mentions Dropdown */}
                  {showMentions && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-[#303A4D] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                      <div className="p-2 border-b">
                        <p className="text-sm font-semibold text-[#303A4D]">Mention:</p>
                      </div>
                      <button
                        onClick={() => setMentionType('order')}
                        className="w-full p-3 text-left hover:bg-[#FED141]/20 flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">Your Orders</span>
                      </button>
                      <button
                        onClick={() => setMentionType('product')}
                        className="w-full p-3 text-left hover:bg-[#FED141]/20 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        <span className="text-sm">Search Products</span>
                      </button>
                    </div>
                  )}
                </div>
                <Button type="submit" className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white h-10 w-10 sm:h-11 sm:w-11 p-0 flex-shrink-0">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <p className="text-xs text-[#303A4D]/60 mt-2 hidden sm:block" data-tour="auto-response-info">
                💡 Tip: Type @ to mention your orders or products directly in your message
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
