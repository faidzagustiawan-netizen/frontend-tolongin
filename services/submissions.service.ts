import { apiClient } from './api';
import { SubmissionResponse } from '../types';

export interface EnrollPayload {
  challengeId: string;
}

export interface SubmitSolutionPayload {
  enrollmentId: string;
  solutionFilesUrl?: string;
  repositoryUrl?: string;
  figmaUrl?: string;
  liveDemoUrl?: string;
  notes?: string;
  responses?: any[];
}

export interface GradeSubmissionPayload {
  finalScore: number;
  reviewerFeedback: string;
  status: 'PASSED' | 'FAILED' | 'UNDER_REVIEW';
  hiringStatus?: 'NONE' | 'SHORTLISTED' | 'INTERVIEW_INVITED' | 'HIRED' | 'REJECTED';
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
    pagination?: { page?: number; limit?: number },
  ) => {
    const { data } = await apiClient.get('/workspace/company-submissions', {
      params: { challengeId, ...pagination },
    });
    // Endpoint kini berpaginasi. Bentuk lama (array polos) tetap ditangani
    // agar klien yang belum diperbarui tidak pecah.
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, limit: data.length };
    }
    return {
      data: data.data,
      total: data.total,
      page: data.page,
      limit: data.limit,
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
};
