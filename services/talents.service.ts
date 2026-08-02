import { apiClient } from './api';

export interface PublicTalent {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  xp: number;
  level: number;
  skills: string[];
  location?: string | null;
  roleCategory?: string | null;
  faceVerificationStatus?: string | null;
}

export interface TalentDirectoryQuery {
  search?: string;
  skill?: string;
  /**
   * Nama bidang, persis seperti di direktori keahlian.
   *
   * Sudah lama diterima `GET /talents` dan disaring di Prisma, tetapi tidak
   * pernah disebut di sini — jadi penyaringnya tidak bisa dipanggil dari mana
   * pun di antarmuka.
   */
  roleCategory?: string;
  page?: number;
  limit?: number;
}

export const talentsService = {
  /** Direktori talenta publik. Tidak pernah memuat email atau data identitas. */
  list: async (query: TalentDirectoryQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number;
      }
    }

    const { data } = await apiClient.get('/talents', { params });
    return data as {
      data: PublicTalent[];
      total: number;
      page: number;
      limit: number;
    };
  },
};
