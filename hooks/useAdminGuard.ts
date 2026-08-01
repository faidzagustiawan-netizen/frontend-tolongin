'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

/**
 * Menahan halaman admin dari peran lain, lalu memulangkan mereka.
 *
 * `AuthGuard` hanya memeriksa apakah pengguna sudah masuk, tidak pernah
 * memeriksa perannya — komentar di `admin/layout.tsx` yang menyerahkan
 * pengalihan kepadanya keliru. Akibatnya talenta yang membuka `/admin/users`
 * mendapat halaman kosong permanen: tata letaknya mengembalikan `null` dan
 * tidak ada apa pun yang memindahkannya ke mana pun.
 *
 * `isHydrated` membedakan "bukan admin" dari "sesi belum selesai dibaca dari
 * localStorage". Tanpa itu setiap muat ulang halaman admin memantulkan
 * adminnya sendiri keluar sebelum sesinya sempat terbaca.
 */
export function useAdminGuard() {
  const { user, isAuthenticated, isHydrated } = useUserStore();
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/');
    }
  }, [isHydrated, isAuthenticated, isAdmin, router]);

  return { isAdmin, isHydrated, user };
}
