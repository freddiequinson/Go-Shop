import { apiClient } from '../client'

export interface GiftCardRedeemRequest {
  code: string
  pin: string
}

export interface GiftCardRedeemResponse {
  success: boolean
  message: string
  amount_credited?: number
  giftcard_code?: string
  transaction_id?: string
}

export const giftCardService = {
  /**
   * Redeem a gift card and credit wallet
   */
  async redeemGiftCard(data: GiftCardRedeemRequest): Promise<GiftCardRedeemResponse> {
    const response = await apiClient.post<GiftCardRedeemResponse>('/giftcards/redeem', data)
    return response.data
  },

  /**
   * Get user's gift card history
   */
  async getGiftCardHistory(): Promise<any[]> {
    const response = await apiClient.get('/giftcards/history')
    return response.data
  }
}
