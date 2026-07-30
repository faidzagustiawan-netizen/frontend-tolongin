import { apiClient } from './api';
import { SubmissionResponse } from '../types';

export interface EnrollPayload {
  challengeId: string;
}

export interface SubmitSolutionPayload {
  enrollmentId: string;
  /**
   * Tahap yang dikumpulkan. Kosong berarti pengumpulan menyeluruh — bentuk
   * lama, satu submisi untuk seluruh studi kasus, yang tetap dipakai studi
   * kasus tanpa tahapan bergerbang.
   */
  sectionId?: string;
  solutionFilesUrl?: string;
  repositoryUrl?: string;
  figmaUrl?: string;
  liveDemoUrl?: string;
  notes?: string;
  responses?: any[];
}

export type HiringStatus =
  | 'NONE'
  | 'SHORTLISTED'
  | 'INTERVIEW_INVITED'
  | 'HIRED'
  | 'REJECTED';

export type SubmissionStatus =
  | 'PENDING_AI'
  | 'UNDER_REVIEW'
  | 'PASSED'
  | 'FAILED';

export interface GradeSubmissionPayload {
  finalScore: number;
  reviewerFeedback: string;
  status: 'PASSED' | 'FAILED' | 'UNDER_REVIEW';
  hiringStatus?: HiringStatus;
}

export interface CompanySubmissionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubmissionStatus;
  hiringStatus?: HiringStatus;
  sort?: 'recent' | 'oldest' | 'score';
}

export const submissionsService = {
  enroll: async (payload: EnrollPayload) => {
    const { data } = await apiClient.post('/workspace/enroll', payload);
    return { data };
  },
  getMyEnrollments: async () => {
    const { data } = await apiClient.get('/workspace/my-enrollments');
    return { data };
  },
  submitSolution: async (payload: SubmitSolutionPayload) => {
    const { data } = await apiClient.post('/workspace/submit', payload);
    return { data };
  },
  saveDraft: async (enrollmentId: string, responses: any) => {
    const { data } = await apiClient.put(`/workspace/draft/${enrollmentId}`, { draftData: responses });
    return { data };
  },
  getCompanySubmissions: async (
    challengeId?: string,
    query?: CompanySubmissionsQuery,
  ) => {
    // Nilai kosong tidak dikirim supaya tidak menjadi filter `status=""` yang
    // tidak sah di server.
    const params: Record<string, string | number> = {};
    if (challengeId) params.challengeId = challengeId;
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value as string | number;
      }
    }

    const { data } = await apiClient.get('/workspace/company-submissions', {
      params,
    });
    // Endpoint kini berpaginasi. Bentuk lama (array polos) tetap ditangani
    // agar klien yang belum diperbarui tidak pecah.
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: 1,
        limit: data.length,
        challenge: null,
      };
    }
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      limit: data.limit,
      challenge: data.challenge ?? null,
    };
  },
  getCompanySubmission: async (submissionId: string) => {
    const { data } = await apiClient.get(`/workspace/company-submissions/${submissionId}`);
    return { data };
  },
  getChallengeStats: async () => {
    const { data } = await apiClient.get('/workspace/challenge-stats');
    return { data };
  },
  gradeSubmission: async (submissionId: string, payload: GradeSubmissionPayload) => {
    const { data } = await apiClient.put(`/workspace/grade/${submissionId}`, payload);
    return { data };
  },
  /**
   * Memindahkan kandidat antar-tahap rekrutmen. Terpisah dari penilaian karena
   * penilaian hanya boleh sekali sedangkan tahap rekrutmen berpindah berkali-kali.
   */
  updateHiringStatus: async (
    submissionId: string,
    hiringStatus: HiringStatus,
    note?: string,
  ) => {
    const { data } = await apiClient.patch(
      `/workspace/submissions/${submissionId}/hiring-status`,
      { hiringStatus, note },
    );
    return { data };
  },
};
