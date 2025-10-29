/**
 * Fund Transfers Service
 * Handles fund transfer operations within bubbles
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { FundTransferCreate, FundTransferResponse, TransferStats } from '@/lib/types'

export const fundTransfersService = {
  /**
   * Create fund transfer
   */
  async createTransfer(data: FundTransferCreate): Promise<FundTransferResponse> {
    const response = await apiClient.post<FundTransferResponse>(API_ENDPOINTS.fundTransfers.create, data)
    return response.data
  },

  /**
   * Get user's transfers
   */
  async getTransfers(params?: { skip?: number; limit?: number; status?: string }): Promise<FundTransferResponse[]> {
    const response = await apiClient.get<FundTransferResponse[]>(API_ENDPOINTS.fundTransfers.list, { params })
    return response.data
  },

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<FundTransferResponse[]> {
    const response = await apiClient.get<FundTransferResponse[]>(API_ENDPOINTS.fundTransfers.pendingApprovals)
    return response.data
  },

  /**
   * Get transfer by ID
   */
  async getTransfer(id: number): Promise<FundTransferResponse> {
    const response = await apiClient.get<FundTransferResponse>(API_ENDPOINTS.fundTransfers.detail(id))
    return response.data
  },

  /**
   * Approve transfer
   */
  async approveTransfer(id: number): Promise<FundTransferResponse> {
    const response = await apiClient.post<FundTransferResponse>(API_ENDPOINTS.fundTransfers.approve(id))
    return response.data
  },

  /**
   * Cancel transfer
   */
  async cancelTransfer(id: number): Promise<FundTransferResponse> {
    const response = await apiClient.post<FundTransferResponse>(API_ENDPOINTS.fundTransfers.cancel(id))
    return response.data
  },

  /**
   * Get bubble transfers
   */
  async getBubbleTransfers(
    bubbleId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<FundTransferResponse[]> {
    const response = await apiClient.get<FundTransferResponse[]>(API_ENDPOINTS.fundTransfers.bubbleTransfers(bubbleId), {
      params,
    })
    return response.data
  },

  /**
   * Get system transfer statistics
   */
  async getSystemStats(): Promise<TransferStats> {
    const response = await apiClient.get<TransferStats>(API_ENDPOINTS.fundTransfers.systemStats)
    return response.data
  },

  /**
   * Get bubble transfer statistics
   */
  async getBubbleStats(bubbleId: number): Promise<TransferStats> {
    const response = await apiClient.get<TransferStats>(API_ENDPOINTS.fundTransfers.bubbleStats(bubbleId))
    return response.data
  },

  /**
   * Get Ghana transfer types
   */
  async getTransferTypes(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.fundTransfers.transferTypes)
    return response.data
  },

  /**
   * Validate transfer
   */
  async validateTransfer(data: FundTransferCreate): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.fundTransfers.validate, data)
    return response.data
  },

  /**
   * Get user transfer summary
   */
  async getUserSummary(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.fundTransfers.userSummary)
    return response.data
  },
}
