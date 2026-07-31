import { apiClient } from './api';
import {
  Section,
  ComponentData,
  GateScoreBasis,
  StageGateMode,
  StagePendingPolicy,
} from '../types';

/**
 * Bidang pekerjaan sebagai taksonomi bank soal.
 *
 * Satu nama untuk daftarnya, bukan union yang ditulis ulang di tiap tempat:
 * yang terakhir itu sudah pernah membuat penambahan `OTHER` gagal kompilasi di
 * tiga berkas berbeda.
 */
export type ChallengeCategoryValue =
  | 'UI_UX'
  | 'FRONTEND'
  | 'BACKEND'
  | 'DATA_SCIENCE'
  | 'MARKETING'
  | 'PRODUCT'
  | 'OTHER';

export interface SectionPayload {
  id?: string;
  title: string;
  description?: string;
  order: number;
  timeLimit?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  gateMode?: StageGateMode;
  minScore?: number | null;
  maxAdvancing?: number | null;
  scoreBasis?: GateScoreBasis;
  gateSourceIds?: string[];
  pendingPolicy?: StagePendingPolicy;
  graceDays?: number | null;
  components: ComponentData[];
}

/** Pengaturan tahap yang boleh diubah walau studi kasus sudah terbit. */
export interface UpdateStageGatePayload {
  timeLimit?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  gateMode?: StageGateMode;
  minScore?: number | null;
  maxAdvancing?: number | null;
  scoreBasis?: GateScoreBasis;
  gateSourceIds?: string[];
  pendingPolicy?: StagePendingPolicy;
  graceDays?: number | null;
}

export interface CreateChallengePayload {
  id?: string;
  title: string;
  summary: string;
  description: string;
  /**
   * Posisi yang direkrut, teks bebas.
   *
   * Sudah lama ditanyakan di layar pembuka tetapi dulu hanya dipakai menyemai
   * judul lalu dibuang. Kategori cuma enam keranjang untuk menyaring bank soal;
   * ini yang menyebut pekerjaannya apa sebenarnya.
   */
  role?: string;
  category: ChallengeCategoryValue;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  /** Menyalin soal tulisan sendiri ke koleksi perusahaan saat diterbitkan. */
  saveQuestionsToBank?: boolean;
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
  // CLOSED hanya bisa datang dari server (lewat `archive`), tidak pernah
  // dikirim oleh formulir — tetapi draf yang dimuat ulang bisa membawanya.
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export interface GenerateAiChallengePayload {
  prompt: string;
  /** Posisi yang direkrut; ikut disimpan seperti di jalur manual. */
  role?: string;
  category: ChallengeCategoryValue;
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
  // Jejak asal soal yang dipungut dari bank. Harus ikut disebut di sini:
  // payload disusun ulang secara eksplisit, jadi kolom yang tidak disalin
  // hilang tanpa jejak.
  sourceItemId: (comp as { sourceItemId?: string }).sourceItemId,
});

const sanitizeSection = (section: SectionPayload, idx: number) => ({
  // Id tahap ikut dikirim supaya backend memperbarui baris yang sama alih-alih
  // membuatnya ulang. Tanpa ini `ChallengeSection.id` berganti tiap simpan, dan
  // syarat masuk antar-tahap — yang menunjuk tahap lain lewat id — ikut rusak.
  id: section.id,
  title: section.title,
  description: section.description,
  order: section.order ?? idx,
  timeLimit: section.timeLimit,
  // Jadwal dan syarat masuk. Harus disebut satu per satu di sini: payload
  // disusun ulang secara eksplisit, jadi kolom yang tidak disalin hilang tanpa
  // jejak — itu yang dulu terjadi pada `timeLimit`.
  opensAt: section.opensAt,
  closesAt: section.closesAt,
  gateMode: section.gateMode,
  minScore: section.minScore,
  maxAdvancing: section.maxAdvancing,
  scoreBasis: section.scoreBasis,
  gateSourceIds: section.gateSourceIds,
  pendingPolicy: section.pendingPolicy,
  graceDays: section.graceDays,
  components: (section.components || []).map(sanitizeComponent),
});

/**
 * Menyalin id tahap dari jawaban server ke state builder.
 *
 * Tanpa ini `section.id` selamanya undefined: backend memperlakukan setiap tahap
 * sebagai tahap baru, sehingga seluruh `ChallengeSection.id` berganti pada tiap
 * autosave. Itu tidak terlihat selama tahap hanya berisi soal, tetapi syarat
 * masuk antar-tahap menunjuk tahap lain lewat id — rujukannya membusuk sebelum
 * studi kasus sempat terbit.
 *
 * Pencocokan lewat `order` karena itu satu-satunya penanda yang dipegang kedua
 * sisi sebelum id ada.
 */
export const mergeServerSectionIds = (
  sections: Section[] | undefined,
  serverSections: Array<{ id: string; order: number }> | undefined,
): Section[] | undefined => {
  if (!sections || !serverSections || serverSections.length === 0) return sections;

  const idByOrder = new Map(serverSections.map((s) => [s.order, s.id]));
  let changed = false;

  const merged = sections.map((section, idx) => {
    const id = idByOrder.get(section.order ?? idx);
    if (!id || section.id === id) return section;
    changed = true;
    return { ...section, id };
  });

  // Referensi lama dikembalikan bila tidak ada yang berubah, supaya pemanggil
  // bisa membedakan "perlu disimpan ke state" dari "sudah sama".
  return changed ? merged : sections;
};

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
  // getTemplates dan cloneTemplate dihapus bersama konsep templatenya.
  // Satuan yang bisa dipakai ulang sekarang adalah satu soal di bank, bukan
  // satu ujian utuh — lihat questionBank.service.ts.

  /**
   * Menutup studi kasus. Statusnya menjadi CLOSED dan slot kuota paket kembali
   * bebas — satu-satunya jalan pemilik melepas kuotanya sendiri, sebab studi
   * kasus yang sudah terbit tidak bisa disunting maupun dihapus.
   */
  archive: async (id: string) => {
    const { data } = await apiClient.patch(`/challenges/${id}/archive`);
    return { data };
  },

  /**
   * Mengubah jadwal dan syarat masuk satu tahap.
   *
   * Rute tersendiri, bukan `update`, karena boleh dipakai pada studi kasus yang
   * sudah terbit: soalnya tetap terkunci, hanya ambang lolos dan jadwal yang
   * bisa disesuaikan setelah terlihat hasilnya di kandidat sungguhan.
   */
  updateStageGate: async (
    challengeId: string,
    sectionId: string,
    payload: UpdateStageGatePayload,
  ) => {
    const { data } = await apiClient.patch(
      `/challenges/${challengeId}/stages/${sectionId}/gate`,
      payload,
    );
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
