import { apiClient } from '../client'

export interface CouponValidateRequest {
  code: string
  order_amount: number
  user_id?: string | number
}

export interface CouponBenefits {
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount?: number
  min_order_value?: number
}

export interface CouponValidateResponse {
  valid: boolean
  message: string
  error?: string
  benefits?: CouponBenefits
}

export const couponService = {
  /**
   * Validate a coupon code
   */
  async validateCoupon(data: CouponValidateRequest): Promise<CouponValidateResponse> {
    const response = await apiClient.post<CouponValidateResponse>('/coupons/validate', data)
    return response.data
  },

  /**
   * Get list of public coupons
   */
  async getPublicCoupons(): Promise<any[]> {
    const response = await apiClient.get('/coupons/public')
    return response.data
  }
}
