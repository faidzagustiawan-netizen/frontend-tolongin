'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';
  const isPendingApproval = isCompany && user?.isVerified === false;

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  if (isPendingApproval) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-lg p-8 bg-card border border-border rounded-2xl shadow-xl">
          <div className="mx-auto w-20 h-20 bg-yellow-500/10 text-yellow-500 flex items-center justify-center rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground">Menunggu Persetujuan Admin</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pendaftaran perusahaan Anda berhasil diterima. Saat ini, tim admin kami sedang meninjau informasi perusahaan Anda (KYB). Proses ini biasanya memakan waktu 1x24 jam kerja.
          </p>
          <div className="bg-foreground/5 p-4 rounded-xl text-left border border-border">
            <p className="text-xs font-semibold text-foreground mb-1">Status Verifikasi:</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              <span className="text-sm font-medium text-yellow-600">Pending Review</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-4 border-t border-border">
            Kami akan memberitahu Anda via email jika akun sudah disetujui.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
