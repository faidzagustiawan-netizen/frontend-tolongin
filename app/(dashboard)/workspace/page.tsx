'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../services/submissions.service';
import { useUserStore } from '../../../store/userStore';
import { tokenService } from '../../../services/tokenService';
import { CompanyWorkspaceDashboard } from '../../../components/workspace/CompanyWorkspaceDashboard';
import { TalentWorkspaceDashboard } from '../../../components/workspace/TalentWorkspaceDashboard';

export default function WorkspacePage() {
  const { user, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user && !isCompany,
  });

  const { data: tokenData } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: !!user && !isCompany,
  });

  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['challenge-stats'],
    queryFn: () => submissionsService.getChallengeStats(),
    enabled: !!user && isCompany,
  });

  if (isTalentLoading || isStatsLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-40 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  if (isCompany) {
    return <CompanyWorkspaceDashboard challenges={statsData?.data || []} refetchStats={refetchStats} />;
  }

  return <TalentWorkspaceDashboard enrollments={talentData?.data || []} tokenData={tokenData} />;
}
