import { create } from 'zustand';
import { UserProfile } from '../types';

export interface UserData {
  id: string;
  email: string;
  fullName?: string;
  isVerified?: boolean;
  role: 'TALENT' | 'COMPANY' | 'ADMIN';
  profile?: UserProfile;
}

interface UserStore {
  user: UserData | null;
  isAuthenticated: boolean;
  setUser: (user: UserData | null) => void;
  updateUserProfile: (profile: UserProfile) => void;
  logout: () => void;
  loadUserFromStorage: () => void;
  refreshFromServer: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  updateUserProfile: (profile) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, profile };
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
    return { user: updatedUser };
  }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
    }
    set({ user: null, isAuthenticated: false });
  },
  loadUserFromStorage: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      const token = localStorage.getItem('access_token');
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          set((state) => {
            // Prevent state update if user object hasn't changed to avoid render thrashing
            if (state.isAuthenticated && JSON.stringify(state.user) === JSON.stringify(user)) {
              return state;
            }
            return { user, isAuthenticated: true };
          });
        } catch (e) {
          console.error('Failed to parse user data from storage', e);
          set({ user: null, isAuthenticated: false });
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    }
  },
  /**
   * Menyegarkan profil dari server. Data di localStorage adalah potret saat
   * login, sehingga nilai yang bisa berubah di sisi server — terutama
   * subscriptionTier setelah pembayaran dan status verifikasi — akan basi
   * sampai pengguna login ulang.
   */
  refreshFromServer: async () => {
    if (typeof window === 'undefined') return;

    const current = get().user;
    if (!current?.id) return;

    try {
      // Impor dinamis agar store tidak menarik lapisan HTTP saat modul dimuat,
      // yang akan membuat lingkaran ketergantungan dengan interceptor api.ts.
      const { authService } = await import('../services/auth.service');
      const { data } = await authService.getProfile(current.id);
      if (!data) return;

      const fresh: UserData = {
        id: data.id ?? current.id,
        email: data.email ?? current.email,
        fullName: data.fullName ?? current.fullName,
        isVerified: data.isVerified ?? current.isVerified,
        role: data.role ?? current.role,
        profile: data.talentProfile ?? data.companyProfile ?? current.profile,
      };

      localStorage.setItem('user_data', JSON.stringify(fresh));
      set({ user: fresh, isAuthenticated: true });
    } catch {
      // Galat 401 sudah ditangani interceptor. Kegagalan lain (mis. jaringan)
      // sengaja diabaikan agar pengguna tetap bisa memakai data tersimpan.
    }
  },
}));
