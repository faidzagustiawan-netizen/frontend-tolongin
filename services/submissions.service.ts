import { apiClient } from './api';

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
  getCompanySubmissions: async (challengeId?: string) => {
    const { data } = await apiClient.get('/workspace/company-submissions', { params: { challengeId } });
    return { data };
  },
  gradeSubmission: async (submissionId: string, payload: GradeSubmissionPayload) => {
    const { data } = await apiClient.put(`/workspace/grade/${submissionId}`, payload);
    return { data };
  },
};
