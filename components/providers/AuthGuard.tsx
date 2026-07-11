'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

const publicRoutes = ['/', '/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUserFromStorage } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setIsReady(true);
  }, [loadUserFromStorage]);

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
