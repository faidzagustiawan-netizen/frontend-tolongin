import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://podorukunspk.fun/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Dipasang oleh AuthProvider agar sesi yang habis bisa ditangani lewat router
 * Next (navigasi lunak) alih-alih window.location. Pemuatan ulang penuh
 * membuang state yang belum tersimpan — fatal di halaman workspace saat
 * kandidat sedang mengerjakan soal.
 */
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      if (!window.location.pathname.includes('/login')) {
        if (onSessionExpired) {
          onSessionExpired();
        } else {
          // Cadangan bila handler belum terpasang (mis. permintaan terjadi
          // sebelum provider ter-mount).
          window.location.href = '/login?expired=true';
        }
      }
    } else if (error.message === 'Network Error') {
      toast.error('Koneksi terputus. Pastikan perangkat Anda terhubung ke internet.');
    } else if (error.response?.status >= 500) {
      toast.error('Server sedang mengalami gangguan. Silakan coba lagi nanti.');
    }
    return Promise.reject(error.response?.data || error);
  },
);
