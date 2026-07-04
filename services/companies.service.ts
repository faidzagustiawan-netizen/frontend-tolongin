import { apiClient } from './api';

export const companiesService = {
  getAll: async () => {
    const response = await apiClient.get('/companies');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  },
};
