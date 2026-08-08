'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { setSessionExpiredHandler } from '@/services/api';

/**
 * Halaman yang boleh dibuka tanpa masuk.
 *
 * Daftar ini dulu hanya berisi `/`, `/login`, dan `/register`. Akibatnya
 * seluruh etalase publik — direktori studi kasus, direktori talenta, profil
 * perusahaan, papan peringkat — memantulkan pengunjung ke halaman masuk,
 * padahal `app/sitemap.ts` mendaftarkan alamat-alamat itu ke mesin pencari.
 * Yang lebih parah, `/forgot-password` ikut terkunci: tautan "Lupa kata sandi?"
 * di halaman masuk memantul balik ke halaman masuk, sehingga pemulihan kata
 * sandi tidak pernah bisa diselesaikan siapa pun.
 */
const publicRoutes = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/challenges',
  '/companies',
  '/talents',
  '/leaderboard',
  '/terms',
  '/privacy',
]);

/**
 * Halaman rincian publik: `/challenges/<slug>`, `/talents/<slug>`,
 * `/companies/<slug>`.
 *
 * Pencocokan awalan saja tidak cukup, karena `/challenges/create`,
 * `/challenges/mine`, dan `/challenges/<slug>/edit` berada di bawah awalan yang
 * sama namun merupakan halaman dasbor. Karena itu rincian publik dibatasi tepat
 * satu ruas setelah awalan, dan halaman dasbor di bawahnya disebut satu per satu.
 */
const publicDetailPrefixes = ['/challenges/', '/companies/', '/talents/'];
const dashboardOnlyPaths = ['/challenges/create', '/challenges/mine'];

function isPublicPath(pathname: string): boolean {
  if (publicRoutes.has(pathname)) return true;

  if (
    dashboardOnlyPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return false;
  }

  return publicDetailPrefixes.some((prefix) => {
    if (!pathname.startsWith(prefix)) return false;
    const rest = pathname.slice(prefix.length);
    // Satu ruas saja. `/challenges/<slug>/edit` punya dua, jadi tetap tertutup.
    return rest.length > 0 && !rest.includes('/');
  });
}

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
    if (isReady && !isAuthenticated && !isPublicPath(pathname)) {
      // Alamat yang dituju dibawa serta supaya pengguna kembali ke tempat yang
      // ia klik setelah masuk, bukan mendarat di beranda dan mencarinya ulang.
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isReady, isAuthenticated, pathname, router]);

  // Prevent flash of content during hydration
  if (!isReady) {
    return null;
  }

  // If not authenticated and trying to access a protected route, prevent rendering the protected content
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
