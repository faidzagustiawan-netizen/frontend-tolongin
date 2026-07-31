import { apiClient } from './api';

export interface SkillRef {
  id: string;
  name: string;
}

/**
 * Putusan atas bidang pekerjaan yang diketik sendiri oleh perusahaan.
 *
 * - `EXACT`      — sudah ada di direktori, tinggal dipakai.
 * - `CREATED`    — bidang baru yang sah, sudah ditambahkan.
 * - `SUGGESTION` — kemungkinan salah ketik; perusahaan yang memutuskan.
 * - `REJECTED`   — bukan bidang pekerjaan, tidak ditambahkan.
 */
export type CategoryResolution =
  | { status: 'EXACT'; category: SkillRef; reason: string; aiChecked: boolean }
  | { status: 'CREATED'; category: SkillRef; reason: string; aiChecked: boolean }
  | {
      status: 'SUGGESTION';
      input: string;
      suggestion: SkillRef;
      reason: string;
      aiChecked: boolean;
    }
  | {
      status: 'REJECTED';
      input: string;
      suggestions: SkillRef[];
      reason: string;
      aiChecked: boolean;
    };

export const skillsService = {
  searchSkills: async (query: string): Promise<SkillRef[]> => {
    const res = await apiClient.get('/skills', { params: { q: query } });
    return res.data;
  },
  // `createSkill` sengaja tidak lagi disediakan di sini. Endpoint POST /skills
  // masih ada dan kini tervalidasi, tetapi ia menulis ke direktori tanpa
  // memeriksa salah ketik — dan direktori itu sekarang juga menyetir bidang
  // pekerjaan yang dicari perusahaan. Semua penambahan dari antarmuka harus
  // lewat `resolveSkill` atau `resolveCategory`.
  /** Bidang pekerjaan yang benar-benar dipakai, terurut dari yang tersering. */
  listCategories: async (): Promise<(SkillRef & { usage: number })[]> => {
    const res = await apiClient.get('/skills/categories');
    return res.data;
  },
  /**
   * `force` dipakai setelah perusahaan melihat usulan pembetulan dan tetap
   * memilih ketikannya sendiri.
   */
  resolveCategory: async (
    name: string,
    force = false,
  ): Promise<CategoryResolution> => {
    const res = await apiClient.post('/skills/categories/resolve', {
      name,
      force,
    });
    return res.data;
  },
  /**
   * Versi keahlian dari pemeriksaan yang sama.
   *
   * Direktorinya satu tabel dengan bidang pekerjaan, tetapi ukuran kelayakannya
   * berbeda: "React" keahlian yang sah dan bukan bidang pekerjaan. Tanpa
   * endpoint terpisah, keahlian talenta akan dinilai dengan ukuran bidang dan
   * ditolak.
   */
  resolveSkill: async (
    name: string,
    force = false,
  ): Promise<CategoryResolution> => {
    const res = await apiClient.post('/skills/resolve', { name, force });
    return res.data;
  },
};
