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
