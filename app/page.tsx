'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { HeroSection } from '@/components/landing/HeroSection';
import { CoreValuesSection } from '@/components/landing/CoreValuesSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { TestimonialMarquee } from '@/components/common/TestimonialMarquee';
import { CompanyWorkspaceDashboard } from '@/components/workspace/CompanyWorkspaceDashboard';
import { TalentWorkspaceDashboard } from '@/components/workspace/TalentWorkspaceDashboard';
import { CompanyAccessGate } from '@/components/company/CompanyAccessGate';
import { submissionsService } from '@/services/submissions.service';
import { tokenService } from '@/services/tokenService';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';

export default function Home() {
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const {
    data: talentData,
    isLoading: isTalentLoading,
    isError: isTalentError,
    refetch: refetchTalent,
  } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user && !isCompany && isAuthenticated,
  });

  const { data: tokenData } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: !!user && !isCompany && isAuthenticated,
  });

  // Perusahaan yang belum diverifikasi ditolak 403 oleh `VerifiedCompanyGuard`
  // di seluruh controller submissions. Permintaannya tidak dikirim sama sekali
  // supaya yang tampil adalah penjelasan dari CompanyAccessGate, bukan dasbor
  // kosong hasil permintaan yang gagal.
  const isPendingApproval = isCompany && user?.isVerified === false;

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['challenge-stats'],
    queryFn: () => submissionsService.getChallengeStats(),
    enabled: !!user && isCompany && isAuthenticated && !isPendingApproval,
  });

  if (isAuthenticated && user) {
    if (isPendingApproval) {
      return <CompanyAccessGate>{null}</CompanyAccessGate>;
    }

    if (isTalentLoading || isStatsLoading) {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-12 bg-foreground/5 rounded-xl w-1/3" />
          <div className="h-40 bg-foreground/5 rounded-xl w-full" />
        </div>
      );
    }

    // `data?.data || []` mengubah kegagalan menjadi daftar kosong, dan kedua
    // dasbor lalu berbunyi "belum ada apa-apa" kepada orang yang sebenarnya
    // punya isi. Kandidat dengan empat pendaftaran diberi tahu ia belum pernah
    // ikut satu pun studi kasus — persis kelas cacat yang sudah dibereskan di
    // layar-layar lain.
    const gagalMuat = isCompany ? isStatsError : isTalentError;
    if (gagalMuat) {
      return (
        <div className="w-full max-w-xl mx-auto px-4 py-24">
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-foreground">Ruang kerja gagal dimuat</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami tidak bisa mengambil data dari server. Ini bukan berarti ruang kerja Anda
                kosong — isinya aman, hanya tidak terbaca saat ini.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void (isCompany ? refetchStats() : refetchTalent())}
              className="rounded-xl h-11 px-6 text-xs font-bold"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      );
    }

    if (isCompany) {
      return <CompanyWorkspaceDashboard challenges={statsData?.data || []} />;
    }

    return <TalentWorkspaceDashboard enrollments={talentData?.data || []} tokenData={tokenData} />;
  }

  return (
    <div className="w-full flex flex-col items-center selection:bg-emerald-500/30 selection:text-emerald-200">
      <HeroSection />
      <CoreValuesSection />
      <TestimonialMarquee />
      <CtaSection />
    </div>
  );
}
