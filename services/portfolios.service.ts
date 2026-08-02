import { apiClient } from './api';
import type { PublicTalent } from './talents.service';

/**
 * Satu baris papan peringkat.
 *
 * Persis kolom yang di-select `PortfoliosService.getLeaderboard` — tidak lebih.
 * Sebelum ini tabelnya bertipe `any[]` dan meraba `talent.user?.email`,
 * `talent.email`, serta `talent.user?.id`; tidak satu pun pernah dikirim
 * server, jadi penandaan "ini Anda" hanya pernah bekerja lewat `userId`.
 */
export interface LeaderboardEntry extends PublicTalent {
  /** Id `User`, bukan `TalentProfile` — ini yang dibandingkan dengan sesi. */
  userId: string;
}

export interface LeaderboardQuery {
  limit?: number;
  /** Nama bidang, persis seperti di direktori keahlian. */
  roleCategory?: string;
  /** Dicocokkan sebagian di server, tidak peka huruf besar-kecil. */
  location?: string;
}

export const portfoliosService = {
  getPublicPortfolios: async (params?: { search?: string; skill?: string; limit?: number }) => {
    const { data } = await apiClient.get('/portfolios', { params });
    return { data };
  },

  /**
   * Penyaringan dikerjakan server, bukan peramban.
   *
   * `limit` berlaku setelah penyaringan, jadi memilih satu bidang memberi
   * peringkat teratas di dalam bidang itu — bukan sisa dari 50 besar global
   * yang kebetulan cocok.
   */
  getLeaderboard: async (query: LeaderboardQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number;
      }
    }

    const { data } = await apiClient.get<LeaderboardEntry[]>('/leaderboard', {
      params,
    });
    return { data };
  },
};
