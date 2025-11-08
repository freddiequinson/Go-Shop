"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ShoppingCart, Loader2, Sparkles, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { aiChatService, ChatMessage, ShoppingList } from '@/lib/services/ai-chat-service'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AIChatbotProps {
  showOnPages?: string[] // Pages where chatbot should appear
}

export default function AIChatbot({ showOnPages = ['/', '/shop'] }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [quickActions, setQuickActions] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load quick actions on mount
  useEffect(() => {
    const loadQuickActions = async () => {
      const actions = await aiChatService.getQuickActions()
      setQuickActions(actions)
    }
    loadQuickActions()
  }, [])

  // Send welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Akwaaba! 👋 I'm Gloria, your GoShop Ghana shopping assistant! I can help you plan meals, create shopping lists, and answer questions about gift cards, wallet, bubbles, and more. How can I help?",
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen])

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await aiChatService.sendMessage(inputMessage, messages)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If response contains shopping list, store it
      if (response.has_shopping_list && response.shopping_list) {
        setShoppingList(response.shopping_list)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (prompt: string) => {
    setInputMessage(prompt)
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage()
    }, 100)
  }

  const handleAddToCart = async () => {
    if (!shoppingList) return

    // Check if user is logged in
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to your cart.',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    try {
      let successCount = 0
      let failCount = 0

      // Get auth token
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: 'Login Required',
          description: 'Please login to add items to your cart.',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      // Add each item to cart via API
      for (const item of shoppingList.items) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/cart/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              product_id: String(item.product_id),
              quantity: Number(item.quantity),
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            // Log error for debugging
            const errorData = await response.json().catch(() => ({}))
            console.error(`Failed to add ${item.name}:`, errorData)
          }
        } catch (err) {
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Added to Cart! 🎉',
          description: `${successCount} item(s) from your ${shoppingList.dish} shopping list added to cart.`,
        })
        setShoppingList(null) // Clear shopping list after adding
        
        // Refresh the page to update cart count
        window.location.reload()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add items to cart. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to add items to cart. Please try again.',
        variant: 'destructive',
        })
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 group"
          aria-label="Open chat with Gloria"
        >
          {/* Main bubble */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FED141] to-[#F1B424] rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse" />
            
            {/* Main button */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#FED141] via-[#F1B424] to-[#FED141] rounded-full shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 border-4 border-white">
              {/* Icon container */}
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-3xl">👩🏾‍🍳</span>
                </div>
                {/* Sparkle */}
                <Sparkles className="w-5 h-5 text-white absolute -top-1 -right-1 animate-pulse drop-shadow-lg" />
              </div>
              
              {/* Online indicator */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
              </div>
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-[#303A4D] text-white px-4 py-2 rounded-xl shadow-xl whitespace-nowrap text-sm font-medium">
              Chat with Gloria 💬
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#303A4D]" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div ref={chatWindowRef} className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-[#FED141]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FED141] to-[#F1B424] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">👩🏾‍🍳</span>
              </div>
              <div>
                <h3 className="font-bold text-[#303A4D]">Gloria</h3>
                <p className="text-xs text-[#303A4D]/70">Your Shopping Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-[#303A4D]" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F2E6]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#303A4D] text-white'
                      : 'bg-white text-[#303A4D] shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && (
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <Loader2 className="w-5 h-5 text-[#FED141] animate-spin" />
                </div>
              </div>
            )}

            {/* Shopping List Preview */}
            {shoppingList && (
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-[#FED141]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#303A4D]">🛒 {shoppingList.dish}</h4>
                  <span className="text-sm text-[#303A4D]/60">{shoppingList.servings} servings</span>
                </div>
                
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {shoppingList.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-[#303A4D]">
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                      <span className="font-medium text-[#303A4D]">GH₵{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2 mb-3">
                  <div className="flex justify-between font-bold text-[#303A4D]">
                    <span>Total:</span>
                    <span>GH₵{shoppingList.total_cost.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart
                </Button>
              </div>
            )}

            {/* Quick Actions (show when no messages) */}
            {messages.length === 1 && quickActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#303A4D]/60 text-center mb-2">Quick suggestions:</p>
                {quickActions.slice(0, 4).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="w-full bg-white hover:bg-[#FED141]/20 text-[#303A4D] rounded-xl px-4 py-3 text-sm text-left transition-colors border border-[#303A4D]/10 hover:border-[#FED141]"
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-[#303A4D]/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#F4F2E6] border-2 border-transparent rounded-full px-4 py-3 text-sm text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#FED141] transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="w-12 h-12 bg-[#303A4D] hover:bg-[#3B4559] disabled:bg-[#303A4D]/50 rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
