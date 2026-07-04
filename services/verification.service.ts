import { apiClient } from './api';

export interface VerifyFaceData {
  selfiePhotoUrl: string;
  idCardPhotoUrl: string;
}

export interface VerificationResponse {
  message?: string;
  isKtpValid?: boolean;
  isMatch?: boolean;
  confidenceScore?: number;
  ktpNik?: string;
  ktpName?: string;
  reason?: string;
}

export const verificationService = {
  verifyFace: async (data: VerifyFaceData): Promise<VerificationResponse> => {
    const response = await apiClient.post('/verification/face-ai', data);
    return response.data;
  },
  
  verifyExecution: async (data: { livePhotoUrl: string }): Promise<any> => {
    const response = await apiClient.post('/verification/verify-execution', data);
    return response.data;
  },
  
  verifyKyb: async (data: any): Promise<any> => {
    const response = await apiClient.post('/verification/kyb', data);
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get('/verification/status');
    return response.data;
  }
};
