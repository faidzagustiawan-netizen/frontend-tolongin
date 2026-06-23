import { apiClient } from './api';

export const PaymentsService = {
  /**
   * Request Top-Up Token untuk Talent
   */
  async topupToken(tokenAmount: number): Promise<{ snapToken: string; redirectUrl: string; orderId: string }> {
    const response = await apiClient.post('/payments/topup', { tokenAmount });
    return response.data;
  },

  /**
   * Request Langganan Professional untuk Company
   */
  async subscribePremium(): Promise<{ snapToken: string; redirectUrl: string; orderId: string }> {
    const response = await apiClient.post('/payments/subscribe');
    return response.data;
  },
};
