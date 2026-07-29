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
  startsAt?: string;
  deadlineAt?: string;
  gradingRubric?: Record<string, unknown>;
  /** Pengaturan anti-kecurangan. Kolom tersendiri di backend, bukan bagian rubrik. */
  proctoringSettings?: Record<string, unknown>;
  isPrivate?: boolean;
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

/**
 * Backend memakai ValidationPipe global dengan `forbidNonWhitelisted: true`,
 * jadi satu properti asing saja membuat seluruh permintaan ditolak 400.
 * Section dan komponen yang dimuat kembali dari API membawa kolom milik
 * database (`challengeId`, `sectionId`, `createdAt`, `updatedAt`) yang tidak
 * ada di DTO, dan builder menyimpan state UI di objek yang sama. Payload
 * karena itu disusun ulang secara eksplisit sebelum dikirim.
 */
const sanitizeComponent = (comp: ComponentData) => ({
  type: comp.type,
  question: comp.question ?? '',
  description: comp.description,
  options: comp.options,
  metadata: comp.metadata,
  points: comp.points,
  order: comp.order,
});

const sanitizeSection = (section: SectionPayload, idx: number) => ({
  title: section.title,
  description: section.description,
  order: section.order ?? idx,
  stageType: section.stageType,
  timeLimit: section.timeLimit,
  components: (section.components || []).map(sanitizeComponent),
});

const sanitizePayload = <T extends Partial<CreateChallengePayload>>(payload: T) => {
  // `id` hanya penanda internal untuk memilih create vs update, bukan bagian
  // dari badan permintaan.
  const { id: _id, sections, ...rest } = payload;
  return {
    ...rest,
    ...(sections ? { sections: sections.map(sanitizeSection) } : {}),
  };
};

export const challengesService = {
  getAll: async (params?: { category?: string; difficulty?: string; challengeType?: string; search?: string; companyId?: string; includeDrafts?: boolean; mine?: boolean; sort?: string; page?: number; limit?: number }) => {
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
    const { data } = await apiClient.post('/challenges', sanitizePayload(payload));
    return { data };
  },
  update: async (id: string, payload: Partial<CreateChallengePayload>) => {
    const { data } = await apiClient.patch(`/challenges/${id}`, sanitizePayload(payload));
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
  /**
   * Pustaka template studi kasus.
   *
   * Dulu dipanggil dengan `fetch` mentah langsung dari komponen halaman:
   * tanpa header Authorization, tanpa penanganan 401, dan galatnya hanya
   * masuk ke konsol sehingga layar menampilkan "belum ada template" padahal
   * permintaannya yang gagal.
   */
  getTemplates: async () => {
    const { data } = await apiClient.get('/templates');
    return Array.isArray(data) ? data : [];
  },
  cloneTemplate: async (templateId: string) => {
    const { data } = await apiClient.post(`/templates/${templateId}/clone`);
    return data;
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
