'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../../services/auth.service';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { TalentBadgesTab } from '../../../components/profile/TalentBadgesTab';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { TalentProfileTab } from '../../../components/profile/TalentProfileTab';
import { Navbar } from '../../../components/common/Navbar';

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile', resolvedParams.slug],
    queryFn: () => authService.getProfile(resolvedParams.slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-60 bg-foreground/5 rounded-3xl w-full" />
          <div className="h-60 bg-foreground/5 rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !profileData?.data) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="text-center py-32 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">Pengguna yang Anda cari tidak ada atau tidak valid.</p>
          <Button onClick={() => window.history.back()} size="sm">Kembali</Button>
        </div>
      </div>
    );
  }

  const user = profileData.data;
  const isTalent = user.role === 'TALENT';
  const talentProfile = user.talentProfile;
  const companyProfile = user.companyProfile;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <ProfileHeader
          user={user}
          isTalent={isTalent}
          talentProfile={talentProfile}
          companyProfile={companyProfile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
              <h3 className="font-display text-xl font-bold text-foreground border-b border-border pb-4">
                {isTalent ? 'Informasi Profil' : 'Informasi Perusahaan'}
              </h3>

              {isTalent ? (
                <TalentProfileTab
                  talentProfile={talentProfile}
                  isEditingProfile={false}
                  editFormData={{}}
                  setEditFormData={() => {}}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Ini adalah profil perusahaan.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {isTalent && talentProfile?.earnedBadges?.length > 0 && (
              <TalentBadgesTab earnedBadges={talentProfile.earnedBadges} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
