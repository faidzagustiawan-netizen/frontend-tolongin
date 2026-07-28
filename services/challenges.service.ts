import { apiClient } from './api';
import { Section, ComponentData } from '../types';

export interface SectionPayload {
  id?: string;
  title: string;
  description?: string;
  order: number;
  timeLimit?: number | null;
  stageType?: 'QUIZ' | 'ASSIGNMENT';
  components: ComponentData[];
}

export interface CreateChallengePayload {
  id?: string;
  title: string;
  summary: string;
  description: string;
  category: 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  datasetUrl?: string;
  mockApiUrl?: string;
  brandGuidelineUrl?: string;
  rewardDescription?: string;
  deadlineAt?: string;
  gradingRubric?: Record<string, unknown>;
  sections?: Section[];
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface GenerateAiChallengePayload {
  prompt: string;
  category: 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  blueprint?: any;
  previousBlueprint?: any;
}

export interface CreateDiscussionPayload {
  message: string;
  parentId?: string;
}

export const challengesService = {
  getAll: async (params?: { category?: string; difficulty?: string; challengeType?: string; search?: string; companyId?: string; includeDrafts?: boolean; sort?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get('/challenges', { params });
    // Backend mengembalikan { data, total, page, limit }. Cabang array
    // dipertahankan agar klien lama tidak pecah bila endpoint belum ter-deploy.
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, limit: data.length };
    }
    return data as { data: any[]; total: number; page: number; limit: number };
  },
  getOne: async (slugOrId: string) => {
    const { data } = await apiClient.get(`/challenges/${slugOrId}`);
    return { data };
  },
  create: async (payload: CreateChallengePayload) => {
    const { data } = await apiClient.post('/challenges', payload);
    return { data };
  },
  update: async (id: string, payload: Partial<CreateChallengePayload>) => {
    const { data } = await apiClient.patch(`/challenges/${id}`, payload);
    return { data };
  },
  generateAiBlueprint: async (payload: GenerateAiChallengePayload) => {
    const { data } = await apiClient.post('/challenges/ai-generate-blueprint', payload);
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
