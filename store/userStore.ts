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
  /**
   * Pemilik akun perusahaan — yang mendaftar sendiri dan punya CompanyProfile.
   *
   * Sebelumnya kepemilikan disimpulkan dari `!profile?.isTeamMember`, dan itu
   * salah untuk anggota tim yang belum disetujui: profilnya `null`, sehingga
   * `!undefined` bernilai true dan ia tampil sebagai pemilik. Penanda ini
   * datang langsung dari server dan tidak punya keadaan ambigu.
   */
  isCompanyOwner?: boolean;
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

/**
 * Melengkapi sesi yang disimpan sebelum `isCompanyOwner` ada.
 *
 * Sesi lama di localStorage tidak membawa penanda ini, dan tanpa pengisian
 * ulang setiap pemilik perusahaan yang sedang masuk akan tampak seperti anggota
 * tim sampai ia login ulang — kehilangan menu Kelola Tim dan halaman langganan
 * miliknya sendiri. Penurunan ke tebakan lama hanya menyangkut tampilan;
 * backend memutuskannya dari CompanyProfile di basis data.
 */
function withOwnerFlag(user: UserData): UserData {
  if (typeof user?.isCompanyOwner === 'boolean') {
    return user;
  }

  return {
    ...user,
    isCompanyOwner: user?.role === 'COMPANY' && !user?.profile?.isTeamMember,
  };
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
          const user = withOwnerFlag(JSON.parse(userData));
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
        // Endpoint profil mengembalikan `companyProfile` hanya untuk pemilik,
        // jadi keberadaannya adalah jawaban yang sama dengan yang dipakai
        // server. Tanpa baris ini penanda dari sesi login hilang pada
        // penyegaran pertama dan pemilik ikut kehilangan akses ke layarnya.
        isCompanyOwner: data.companyProfile
          ? true
          : (current.isCompanyOwner ?? false),
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
