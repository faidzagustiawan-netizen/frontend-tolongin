import { apiClient } from './api';
import { ComponentData } from '../types';

export type QuestionBankScope = 'PLATFORM' | 'MINE' | 'ALL';

export interface QuestionBankTag {
  id: string;
  name: string;
  questionCount: number;
}

export interface QuestionBankItem {
  id: string;
  /** null berarti soal bawaan platform; terisi berarti koleksi perusahaan. */
  companyId: string | null;
  type: ComponentData['type'];
  question: string;
  description?: string | null;
  options?: any;
  metadata?: any;
  defaultPoints: number;
  category: string;
  difficulty: string;
  isActive: boolean;
  tags: { skill: { id: string; name: string } }[];
  /**
   * Berapa kali soal ini benar-benar dipakai di studi kasus.
   *
   * Koleksi soal selama ini kotak hitam — menabung berbiaya sekarang dan
   * berbuah entah kapan. Angka ini yang memperlihatkan buahnya.
   */
  _count?: { usedBy: number };
}

export interface QuestionBankQuery {
  scope?: QuestionBankScope;
  category?: string;
  difficulty?: string;
  type?: string;
  /** Id skill dipisah koma; soal cocok bila membawa salah satunya. */
  skillIds?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SaveQuestionBankItemPayload {
  type: ComponentData['type'];
  question: string;
  description?: string;
  options?: any;
  metadata?: any;
  defaultPoints?: number;
  category: string;
  difficulty: string;
  skillIds?: string[];
}

export const questionBankService = {
  getAll: async (params?: QuestionBankQuery) => {
    const { data } = await apiClient.get('/question-bank', { params });
    return data as {
      data: QuestionBankItem[];
      total: number;
      page: number;
      limit: number;
    };
  },
  getTags: async (scope: QuestionBankScope = 'ALL') => {
    const { data } = await apiClient.get('/question-bank/tags', {
      params: { scope },
    });
    return data as QuestionBankTag[];
  },
  getOne: async (id: string) => {
    const { data } = await apiClient.get(`/question-bank/${id}`);
    return data as QuestionBankItem;
  },
  save: async (payload: SaveQuestionBankItemPayload) => {
    const { data } = await apiClient.post('/question-bank', payload);
    return data as QuestionBankItem;
  },
  update: async (id: string, payload: Partial<SaveQuestionBankItemPayload>) => {
    const { data } = await apiClient.patch(`/question-bank/${id}`, payload);
    return data as QuestionBankItem;
  },
  /** Menarik soal dari peredaran; barisnya tetap ada demi jejak asal. */
  deactivate: async (id: string) => {
    const { data } = await apiClient.delete(`/question-bank/${id}`);
    return data as QuestionBankItem;
  },
};

/**
 * Mengubah soal bank menjadi komponen tahapan.
 *
 * Isinya disalin, bukan direferensikan: menyunting soal di bank tidak boleh
 * mengubah ujian yang sedang dikerjakan kandidat. `sourceItemId` hanya jejak
 * asal — dipakai untuk menelusuri soal mana yang dipakai di ujian mana.
 */
export const bankItemToComponent = (item: QuestionBankItem, order: number) => ({
  type: item.type,
  question: item.question,
  description: item.description ?? undefined,
  options: item.options ?? undefined,
  metadata: item.metadata ?? undefined,
  points: item.defaultPoints,
  order,
  sourceItemId: item.id,
});
