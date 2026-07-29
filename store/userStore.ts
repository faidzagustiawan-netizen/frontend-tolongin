import { create } from 'zustand';
import { UserProfile } from '../types';
import { clearAllChallengeDrafts } from '../lib/challengeDraftStorage';
import {
  clearAuthSession,
  readAuthToken,
  readStoredUserRaw,
  updateStoredUser,
} from '../lib/authStorage';

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
  /**
   * false sampai sesi tersimpan selesai dibaca.
   *
   * Tanpa penanda ini setiap penjaga peran tidak bisa membedakan "belum tahu
   * siapa penggunanya" dari "bukan perusahaan", sehingga menyegarkan halaman
   * /company/* sempat menampilkan penolakan akses — atau layar putih — kepada
   * akun perusahaan yang sah.
   */
  isHydrated: boolean;
  setUser: (user: UserData | null) => void;
  updateUserProfile: (profile: UserProfile) => void;
  logout: () => void;
  loadUserFromStorage: () => void;
  refreshFromServer: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isHydrated: true }),
  updateUserProfile: (profile) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, profile };
    updateStoredUser(updatedUser);
    return { user: updatedUser };
  }),
  logout: () => {
    if (typeof window !== 'undefined') {
      clearAuthSession();
      // Draf pembuatan challenge berisi isi soal beserta kunci jawabannya.
      // Peramban bersama tidak boleh menyimpannya setelah pemiliknya keluar.
      clearAllChallengeDrafts();
    }
    set({ user: null, isAuthenticated: false, isHydrated: true });
  },
  loadUserFromStorage: () => {
    if (typeof window !== 'undefined') {
      const userData = readStoredUserRaw();
      const token = readAuthToken();
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          set((state) => {
            // Prevent state update if user object hasn't changed to avoid render thrashing
            if (state.isHydrated && state.isAuthenticated && JSON.stringify(state.user) === JSON.stringify(user)) {
              return state;
            }
            return { user, isAuthenticated: true, isHydrated: true };
          });
        } catch (e) {
          console.error('Failed to parse user data from storage', e);
          set({ user: null, isAuthenticated: false, isHydrated: true });
        }
      } else {
        set({ user: null, isAuthenticated: false, isHydrated: true });
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

      updateStoredUser(fresh);
      set({ user: fresh, isAuthenticated: true, isHydrated: true });
    } catch {
      // Galat 401 sudah ditangani interceptor. Kegagalan lain (mis. jaringan)
      // sengaja diabaikan agar pengguna tetap bisa memakai data tersimpan.
    }
  },
}));
