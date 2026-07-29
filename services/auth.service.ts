import { apiClient } from './api';
import { UserProfile } from '../types';
import { clearAuthSession, persistAuthSession } from '../lib/authStorage';

export interface LoginPayload {
  email: string;
  password?: string;
  /** Tanpa ini sesi berakhir saat tab ditutup. Lihat lib/authStorage.ts. */
  remember?: boolean;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  role?: 'TALENT' | 'COMPANY';
  fullName?: string;
  companyName?: string;
  industry?: string;
  subscriptionTier?: 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM';
}

export const authService = {
  login: async ({ remember = false, ...payload }: LoginPayload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    if (data.accessToken) {
      persistAuthSession(data.accessToken, data.user, remember);
    }
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    if (data.accessToken) {
      // Pendaftaran selalu diingat: pengguna baru saja membuat akun ini.
      persistAuthSession(data.accessToken, data.user, true);
    }
    return data;
  },
  registerTeam: async (payload: RegisterPayload, inviteCode: string) => {
    const { data } = await apiClient.post('/auth/register-team', {
      ...payload,
      inviteCode,
    });
    if (data.accessToken) {
      persistAuthSession(data.accessToken, data.user, true);
    }
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data as { message: string };
  },
  resetPassword: async (token: string, password: string) => {
    const { data } = await apiClient.post('/auth/reset-password', {
      token,
      password,
    });
    return data as { message: string };
  },
  getProfile: async (userId: string) => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return { data };
  },
  updateProfile: async (payload: Partial<UserProfile>) => {
    const { data } = await apiClient.patch('/users/me/profile', payload);
    return { data };
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      clearAuthSession();
      window.location.href = '/';
    }
  },
};
