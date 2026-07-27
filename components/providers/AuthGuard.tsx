'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { setSessionExpiredHandler } from '@/services/api';

const publicRoutes = ['/', '/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUserFromStorage, refreshFromServer, logout } =
    useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setIsReady(true);
  }, [loadUserFromStorage]);

  // localStorage hanya menyimpan potret saat login. Nilai seperti
  // subscriptionTier bisa berubah setelah pembayaran, jadi profil disegarkan
  // dari server sekali saat aplikasi dibuka.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      void refreshFromServer();
    }
  }, [isReady, isAuthenticated, refreshFromServer]);

  // Sesi kedaluwarsa ditangani lewat router agar tidak memuat ulang halaman
  // penuh dan membuang state yang belum tersimpan.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
      router.replace('/login?expired=true');
    });
    return () => setSessionExpiredHandler(null);
  }, [logout, router]);

  useEffect(() => {
    if (isReady) {
      const isPublic = publicRoutes.includes(pathname);
      if (!isAuthenticated && !isPublic) {
        router.replace('/login');
      }
    }
  }, [isReady, isAuthenticated, pathname, router]);

  // Prevent flash of content during hydration
  if (!isReady) {
    return null;
  }

  // If not authenticated and trying to access a protected route, prevent rendering the protected content
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
