import { apiClient } from './api';
import type { VerificationStatus } from '@/types';

export interface VerifyFaceData {
  selfiePhotoUrl: string;
  idCardPhotoUrl: string;
}

export interface VerificationResponse {
  status?: string;
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
    // Timeout diperpanjang hingga 60 detik karena AI lokal DeepFace butuh waktu untuk load model TensorFlow
    const response = await apiClient.post('/verification/verify-execution', data, { timeout: 60000 });
    return response.data;
  },
  
  verifyKyb: async (data: any): Promise<any> => {
    const response = await apiClient.post('/verification/kyb', data);
    return response.data;
  },

  /**
   * `{ status }` — `faceVerificationStatus` untuk talenta, `kybStatus` untuk
   * perusahaan. Bentuknya rata, tanpa pembungkus `data`.
   */
  getStatus: async (): Promise<{ status: VerificationStatus }> => {
    const response = await apiClient.get('/verification/status');
    return response.data;
  }
};
