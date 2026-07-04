'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalToaster } from '../components/common/GlobalToaster';
import { SocketProvider } from '../contexts/SocketContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {children}
      </SocketProvider>
      <GlobalToaster />
    </QueryClientProvider>
  );
}
