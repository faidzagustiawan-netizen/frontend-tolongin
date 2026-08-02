import { apiClient } from './api';

export const storageService = {
  getPresignedUrl: async (fileName: string, contentType: string) => {
    const { data } = await apiClient.get('/storage/presigned-url', {
      params: { fileName, contentType },
    });
    return { data };
  },
  uploadFileToR2: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.fileUrl;
  },
};
