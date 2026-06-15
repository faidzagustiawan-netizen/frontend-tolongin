import { apiClient } from './api';

export const tokenService = {
  async getBalance(): Promise<{ tokenBalance: number }> {
    const response = await apiClient.get('/tokens/balance');
    return response.data;
  },

  async getHistory(): Promise<any[]> {
    const response = await apiClient.get('/tokens/history');
    return response.data;
  },

  async topUp(amount: number): Promise<{ success: boolean; amount: number; message: string }> {
    const response = await apiClient.post('/tokens/topup', { amount });
    return response.data;
  },
};
