import { apiClient } from './api';

export const skillsService = {
  searchSkills: async (query: string) => {
    const res = await apiClient.get('/skills', { params: { q: query } });
    return res.data;
  },
  createSkill: async (name: string) => {
    const res = await apiClient.post('/skills', { name });
    return res.data;
  }
};
