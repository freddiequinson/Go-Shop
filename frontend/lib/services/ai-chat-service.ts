/**
 * AI Chat Service
 * Handles communication with the AI chatbot backend
 */

import { getApiBaseUrl } from '../api/url-helper'

const getAPIBaseURL = () => getApiBaseUrl()

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface ShoppingListItem {
  product_id: string
  name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

export interface ShoppingList {
  dish: string
  servings: number
  total_cost: number
  items: ShoppingListItem[]
  missing_items?: string[]
  alternatives_suggested?: string[]
  cooking_tips?: string
}

export interface ChatResponse {
  success: boolean
  message: string
  shopping_list?: ShoppingList
  has_shopping_list: boolean
  tokens_used?: number
}

export interface QuickAction {
  id: string
  text: string
  icon: string
  prompt: string
}

class AIChatService {
  /**
   * Send a message to the AI chatbot
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${getAPIBaseURL()}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending message to AI:', error)
      return {
        success: false,
        message: 'Sorry, I\'m having trouble connecting right now. Please try again! 🙏',
        has_shopping_list: false,
      }
    }
  }

  /**
   * Get budget meal suggestions
   */
  async getBudgetMeals(budget: number, servings: number = 4): Promise<ChatResponse> {
    try {
      const response = await fetch(`${getAPIBaseURL()}/ai/suggest-budget-meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget,
          servings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get budget meals')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting budget meals:', error)
      return {
        success: false,
        message: 'Sorry, I couldn\'t get budget meal suggestions right now.',
        has_shopping_list: false,
      }
    }
  }

  /**
   * Get recipe ingredients
   */
  async getRecipeIngredients(
    dishName: string,
    servings: number = 4,
    budget?: number
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${getAPIBaseURL()}/ai/recipe-ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dish_name: dishName,
          servings,
          budget,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recipe ingredients')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting recipe ingredients:', error)
      return {
        success: false,
        message: 'Sorry, I couldn\'t get recipe ingredients right now.',
        has_shopping_list: false,
      }
    }
  }

  /**
   * Get quick action prompts
   */
  async getQuickActions(): Promise<QuickAction[]> {
    try {
      const response = await fetch(`${getAPIBaseURL()}/ai/quick-actions`)

      if (!response.ok) {
        throw new Error('Failed to get quick actions')
      }

      const data = await response.json()
      return data.actions || []
    } catch (error) {
      console.error('Error getting quick actions:', error)
      return [
        {
          id: 'budget_meal',
          text: 'Show me budget meals',
          icon: '💰',
          prompt: 'I have a budget of GH₵50. What meals can I cook?',
        },
        {
          id: 'jollof',
          text: 'I want to cook Jollof Rice',
          icon: '🍚',
          prompt: 'I want to cook Jollof Rice for 6 people.',
        },
      ]
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${getAPIBaseURL()}/ai/health`)

      if (!response.ok) {
        return { status: 'unavailable', message: 'AI service is unavailable' }
      }

      return await response.json()
    } catch (error) {
      return { status: 'error', message: 'Cannot connect to AI service' }
    }
  }
}

export const aiChatService = new AIChatService()
