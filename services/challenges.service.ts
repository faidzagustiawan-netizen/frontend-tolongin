import { apiClient } from './api';

export interface CreateChallengePayload {
  title: string;
  summary: string;
  description: string;
  category: 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT';
  difficulty: 'JUNIOR' | 'MEDIOR' | 'SENIOR';
  datasetUrl?: string;
  mockApiUrl?: string;
  brandGuidelineUrl?: string;
  rewardDescription?: string;
  deadlineAt?: string;
  gradingRubric?: Record<string, any>;
  components?: any[];
}

export interface GenerateAiChallengePayload {
  prompt: string;
  category: 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT';
  difficulty: 'JUNIOR' | 'MEDIOR' | 'SENIOR';
}

export interface CreateDiscussionPayload {
  message: string;
  parentId?: string;
}

export const challengesService = {
  getAll: async (params?: { category?: string; difficulty?: string; search?: string; companyId?: string }) => {
    const { data } = await apiClient.get('/challenges', { params });
    return { data };
  },
  getOne: async (slugOrId: string) => {
    const { data } = await apiClient.get(`/challenges/${slugOrId}`);
    return { data };
  },
  create: async (payload: CreateChallengePayload) => {
    const { data } = await apiClient.post('/challenges', payload);
    return { data };
  },
  generateAi: async (payload: GenerateAiChallengePayload) => {
    const { data } = await apiClient.post('/challenges/ai-generate', payload);
    return { data };
  },
  getDiscussions: async (challengeId: string) => {
    const { data } = await apiClient.get(`/challenges/${challengeId}/discussions`);
    return { data };
  },
  createDiscussion: async (challengeId: string, payload: CreateDiscussionPayload) => {
    const { data } = await apiClient.post(`/challenges/${challengeId}/discussions`, payload);
    return { data };
  },
};
