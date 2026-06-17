import { create } from 'zustand';

export interface UserData {
  id: string;
  email: string;
  role: 'TALENT' | 'COMPANY' | 'ADMIN';
  profile?: any;
}

interface UserStore {
  user: UserData | null;
  isAuthenticated: boolean;
  setUser: (user: UserData | null) => void;
  updateUserProfile: (profile: any) => void;
  logout: () => void;
  loadUserFromStorage: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
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
}));
