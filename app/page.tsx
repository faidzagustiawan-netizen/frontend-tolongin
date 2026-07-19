'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { HeroSection } from '@/components/landing/HeroSection';
import { CoreValuesSection } from '@/components/landing/CoreValuesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { TestimonialMarquee } from '@/components/common/TestimonialMarquee';
import { CompanyWorkspaceDashboard } from '@/components/workspace/CompanyWorkspaceDashboard';
import { TalentWorkspaceDashboard } from '@/components/workspace/TalentWorkspaceDashboard';
import { submissionsService } from '@/services/submissions.service';
import { tokenService } from '@/services/tokenService';

export default function Home() {
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user && !isCompany && isAuthenticated,
  });

  const { data: tokenData } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: !!user && !isCompany && isAuthenticated,
  });

  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['challenge-stats'],
    queryFn: () => submissionsService.getChallengeStats(),
    enabled: !!user && isCompany && isAuthenticated,
  });

  if (isAuthenticated && user) {
    if (isTalentLoading || isStatsLoading) {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-12 bg-foreground/5 rounded-xl w-1/3" />
          <div className="h-40 bg-foreground/5 rounded-xl w-full" />
        </div>
      );
    }

    if (isCompany) {
      return <CompanyWorkspaceDashboard challenges={statsData?.data || []} refetchStats={refetchStats} />;
    }

    return <TalentWorkspaceDashboard enrollments={talentData?.data || []} tokenData={tokenData} />;
  }

  return (
    <div className="w-full flex flex-col items-center selection:bg-emerald-500/30 selection:text-emerald-200">
      <HeroSection />
      <CoreValuesSection />
      <TestimonialMarquee />
      <PricingSection />
      <CtaSection />
    </div>
  );
}
