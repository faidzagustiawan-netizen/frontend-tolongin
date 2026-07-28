import { apiClient } from './api';

export const companiesService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get('/companies', { params });
    // Endpoint kini berpaginasi dan mengembalikan { data, total, page, limit }.
    // Cabang array dipertahankan agar klien lama tidak pecah bila backend
    // belum ter-deploy.
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  },

  getTeamMembers: async () => {
    const response = await apiClient.get('/companies/workspace/team');
    return response.data;
  },

  generateInviteCode: async () => {
    const response = await apiClient.post('/companies/workspace/invite-code');
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await apiClient.get('/companies/workspace/logs');
    return response.data;
  },
};
