/**
 * Payments Service
 * Handles payment and wallet operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  WalletResponse,
  TransactionResponse,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerificationResponse,
  WalletCreditRequest,
  WalletDebitRequest,
  PaymentStats,
} from '@/lib/types'

export const paymentsService = {
  /**
   * Get user's wallet
   */
  async getWallet(): Promise<WalletResponse> {
    const response = await apiClient.get<WalletResponse>(API_ENDPOINTS.payments.wallet)
    return response.data
  },

  /**
   * Get wallet transactions
   */
  async getTransactions(params?: { skip?: number; limit?: number }): Promise<TransactionResponse[]> {
    const response = await apiClient.get<TransactionResponse[]>(API_ENDPOINTS.payments.transactions, { params })
    return response.data
  },

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(data: PaymentInitRequest): Promise<PaymentInitResponse> {
    const response = await apiClient.post<PaymentInitResponse>(API_ENDPOINTS.payments.initialize, data)
    return response.data
  },

  /**
   * Verify payment
   */
  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    const response = await apiClient.post<PaymentVerificationResponse>(API_ENDPOINTS.payments.verify(reference))
    return response.data
  },

  /**
   * Credit wallet (admin only)
   */
  async creditWallet(data: WalletCreditRequest): Promise<WalletResponse> {
    const response = await apiClient.post<WalletResponse>(API_ENDPOINTS.payments.credit, data)
    return response.data
  },

  /**
   * Debit wallet (admin only)
   */
  async debitWallet(data: WalletDebitRequest): Promise<WalletResponse> {
    const response = await apiClient.post<WalletResponse>(API_ENDPOINTS.payments.debit, data)
    return response.data
  },

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<PaymentStats> {
    const response = await apiClient.get<PaymentStats>(API_ENDPOINTS.payments.stats)
    return response.data
  },

  /**
   * Get Ghana banks list
   */
  async getGhanaBanks(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.payments.banks)
    return response.data
  },

  /**
   * Fund wallet with mobile money or card
   */
  async fundWallet(amount: number, paymentMethod: string, phoneNumber?: string): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.payments.fundWallet, {
      amount_cedis: amount,
      payment_method: paymentMethod,
      phone_number: phoneNumber,
    })
    return response.data
  },

  /**
   * Verify Paystack payment
   */
  async verifyPaystackPayment(reference: string): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.payments.verify(reference))
    return response.data
  },
}
