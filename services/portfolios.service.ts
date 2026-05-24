import { apiClient } from './api';

export const portfoliosService = {
  getPublicPortfolios: async (params?: { search?: string; skill?: string; limit?: number }) => {
    const { data } = await apiClient.get('/portfolios', { params });
    return { data };
  },
  getLeaderboard: async (limit?: number) => {
    const { data } = await apiClient.get('/leaderboard', { params: { limit } });
    return { data };
  },
};
