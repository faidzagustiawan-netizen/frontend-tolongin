import { apiClient } from './api';

export type StageAttemptStatus =
  | 'LOCKED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AWAITING_GRADE'
  | 'PASSED'
  | 'FAILED'
  | 'EXPIRED';

/**
 * Keadaan satu tahap menurut server.
 *
 * Sengaja tidak ada satu pun kolom yang menyuruh klien menyimpulkan sendiri:
 * `unlocked`, `lockReason`, dan `remainingSeconds` sudah berupa jawaban. Batas
 * waktu yang dihitung di peramban bisa dihentikan dengan menutup tab, dan syarat
 * nilai yang diperiksa di peramban bisa dilewati — jadi keputusannya hanya boleh
 * datang dari satu tempat.
 */
export interface StageView {
  sectionId: string;
  title: string;
  order: number;
  status: StageAttemptStatus;
  unlocked: boolean;
  lockReason: string | null;
  timeLimit: number | null;
  opensAt: string | null;
  closesAt: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  /** Sisa waktu menurut jam server pada saat permintaan dilayani. */
  remainingSeconds: number | null;
  score: number | null;
}

/** Kandidat yang menunggu keputusan manual perusahaan pada satu tahap. */
export interface PendingApproval {
  attemptId: string;
  enrollmentId: string;
  lockReason: string | null;
  section: { id: string; title: string; order: number };
  talent: {
    slug: string;
    fullName: string;
    headline: string | null;
    avatarUrl: string | null;
  };
  /** Nilai tahap-tahap sebelumnya — dasar keputusan perusahaan. */
  previousScores: Array<{ title: string; score: number | null }>;
}

export const stagesService = {
  getStages: async (enrollmentId: string) => {
    const { data } = await apiClient.get<StageView[]>(
      `/stages/enrollment/${enrollmentId}`,
    );
    return data;
  },

  /**
   * Mencap dimulainya pengerjaan satu tahap. Idempoten di server, jadi menekan
   * tombolnya dua kali tidak memperpanjang maupun mereset waktu.
   */
  startStage: async (enrollmentId: string, sectionId: string) => {
    const { data } = await apiClient.post<StageView>(
      `/stages/enrollment/${enrollmentId}/${sectionId}/start`,
    );
    return data;
  },

  /**
   * Kandidat yang menunggu persetujuan manual pada satu studi kasus.
   *
   * Rute tersendiri dari daftar submisi: tahap yang menunggu persetujuan belum
   * punya submisi apa pun, karena kandidat belum boleh masuk.
   */
  getPendingApprovals: async (challengeId: string) => {
    const { data } = await apiClient.get<PendingApproval[]>(
      `/stages/challenge/${challengeId}/approvals`,
    );
    return data;
  },

  /** Meloloskan kandidat ke satu tahap. Hanya pemilik studi kasus. */
  approveAttempt: async (attemptId: string) => {
    const { data } = await apiClient.post<{
      attemptId: string;
      approvedAt: string;
      alreadyApproved: boolean;
    }>(`/stages/attempt/${attemptId}/approve`);
    return data;
  },
};
