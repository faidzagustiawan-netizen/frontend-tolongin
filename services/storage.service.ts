import { apiClient } from './api';
import axios from 'axios';

export const storageService = {
  getPresignedUrl: async (fileName: string, contentType: string) => {
    const { data } = await apiClient.get('/storage/presigned-url', {
      params: { fileName, contentType },
    });
    return { data };
  },
  uploadFileToR2: async (file: File): Promise<string> => {
    // 1. Dapatkan presigned URL dari backend
    const { data: presignedData } = await storageService.getPresignedUrl(file.name, file.type);
    const { presignedUrl, fileUrl } = presignedData;

    // 2. Lakukan PUT request langsung ke Cloudflare R2 / AWS S3
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });

    // 3. Kembalikan tautan publik untuk disimpan ke database
    return fileUrl;
  },
};
