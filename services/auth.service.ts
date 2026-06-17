import { apiClient } from './api';

export interface LoginPayload {
  email: string;
  password?: string;
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
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  },
  getProfile: async (userId: string) => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return { data };
  },
  updateProfile: async (payload: any) => {
    const { data } = await apiClient.patch('/users/me/profile', payload);
    return { data };
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
  },
};
