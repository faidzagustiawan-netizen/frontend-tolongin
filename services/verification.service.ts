import { apiClient } from './api';

export interface VerifyFacePayload {
  selfiePhotoUrl: string;
  idCardPhotoUrl: string;
}

export interface VerifyKybPayload {
  businessRegistrationNumber: string;
  documentUrl: string;
  legalEntityName?: string;
}

export const verificationService = {
  verifyFace: async (payload: VerifyFacePayload) => {
    const { data } = await apiClient.post('/verification/face-ai', payload);
    return { data };
  },
  verifyKyb: async (payload: VerifyKybPayload) => {
    const { data } = await apiClient.post('/verification/kyb', payload);
    return { data };
  },
  verifyExecution: async (payload: { livePhotoUrl: string }) => {
    const { data } = await apiClient.post('/verification/verify-execution', payload);
    return { data };
  },
  getStatus: async () => {
    const { data } = await apiClient.get('/verification/status');
    return { data };
  },
};
