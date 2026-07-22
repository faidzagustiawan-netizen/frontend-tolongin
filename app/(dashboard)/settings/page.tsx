'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/common/Button';
import { AlertCircle } from 'lucide-react';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AboutSection } from '@/components/profile/AboutSection';
import { EditIntroModal } from '@/components/profile/EditIntroModal';
import { EditAboutModal } from '@/components/profile/EditAboutModal';
import { AddSectionModal } from '@/components/profile/AddSectionModal';
import { EditPhotoModal } from '@/components/profile/EditPhotoModal';
import { EditLinksModal } from '@/components/profile/EditLinksModal';
import { SkillsSection } from '@/components/profile/SkillsSection';
import { ExperienceSection } from '@/components/profile/ExperienceSection';
import { EducationSection } from '@/components/profile/EducationSection';
import { LivenessKycTab } from '@/components/profile/LivenessKycTab';
import { TalentBadgesTab } from '@/components/profile/TalentBadgesTab';
import { PublicProfileCard } from '@/components/profile/PublicProfileCard';

export default function ProfilePage() {
  const { user, loadUserFromStorage, updateUserProfile } = useUserStore();
  const queryClient = useQueryClient();

  const [isEditIntroOpen, setIsEditIntroOpen] = useState(false);
  const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEditPhotoOpen, setIsEditPhotoOpen] = useState(false);
  const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [autoOpenSection, setAutoOpenSection] = useState<string | null>(null);
  
  // KYC specific states
  const [showLivenessCam, setShowLivenessCam] = useState(false);
  const [showTestFaceCam, setShowTestFaceCam] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => authService.getProfile(user?.id!),
    enabled: !!user?.id,
  });

  const profile = profileData?.data;
  const actualCompanyProfile = profile?.companyProfile || profile?.teamMemberships?.[0]?.company;
  const isTalent = user?.role === 'TALENT';
  const talentProfile = profile?.talentProfile;
  const companyProfile = actualCompanyProfile;

  useEffect(() => {
    if (profileData?.data) {
      const p = talentProfile || companyProfile;
      if (p) updateUserProfile(p);
      
      // Auto-show sections that have data
      if (isTalent && talentProfile) {
        const initialSections: string[] = [];
        if (talentProfile.experiences?.length > 0) initialSections.push('experience');
        if (talentProfile.educations?.length > 0) initialSections.push('education');
        if (talentProfile.skills?.length > 0) initialSections.push('skills');
        if (talentProfile.earnedBadges?.length > 0) initialSections.push('badges');
        setVisibleSections(prev => Array.from(new Set([...prev, ...initialSections])));
      }
    }
  }, [profileData?.data, talentProfile, companyProfile, isTalent, updateUserProfile]);

  const handleUpdateProfile = async (payload: any) => {
    try {
      await authService.updateProfile(payload);
      toast.success('Profil berhasil diperbarui!');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Gagal memperbarui profil.');
      throw err;
    }
  };

  const handleAddSection = (key: string) => {
    if (key === 'about') {
      setIsAddSectionOpen(false);
      setIsEditAboutOpen(true);
      return;
    }

    if (!visibleSections.includes(key)) {
      setVisibleSections([...visibleSections, key]);
    }
    setAutoOpenSection(key);
    setIsAddSectionOpen(false);
  };

  const handleRemoveSection = (key: string) => {
    setVisibleSections(visibleSections.filter(s => s !== key));
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 space-y-8 animate-pulse">
        <div className="h-64 bg-foreground/5 rounded-3xl w-full" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-32 space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Sesi Pengguna Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground">Silakan masuk kembali untuk melihat profil Anda.</p>
        <Button onClick={() => window.location.href = '/login'} size="sm">Masuk Sekarang</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          <ProfileHeader
            user={user}
            isTalent={isTalent}
            talentProfile={talentProfile}
            companyProfile={companyProfile}
            onEditIntroClick={() => setIsEditIntroOpen(true)}
            onAddSectionClick={() => setIsAddSectionOpen(true)}
            onEditPhotoClick={() => setIsEditPhotoOpen(true)}
          />

          {isTalent && (visibleSections.includes('about') || talentProfile?.bio) && (
            <AboutSection 
              bio={talentProfile?.bio}
              onEditClick={() => setIsEditAboutOpen(true)}
              autoOpenAddModal={autoOpenSection === 'about'}
              onModalOpened={() => setAutoOpenSection(null)}
            />
          )}

          {isTalent && visibleSections.includes('experience') && (
            <ExperienceSection 
              experiences={talentProfile?.experiences || []} 
              onUpdate={(experiences) => handleUpdateProfile({ experiences })}
              onRemoveSection={() => handleRemoveSection('experience')}
              autoOpenAddModal={autoOpenSection === 'experience'}
              onModalOpened={() => setAutoOpenSection(null)}
            />
          )}

          {isTalent && visibleSections.includes('education') && (
            <EducationSection 
              educations={talentProfile?.educations || []} 
              onUpdate={(educations) => handleUpdateProfile({ educations })}
              onRemoveSection={() => handleRemoveSection('education')}
              autoOpenAddModal={autoOpenSection === 'education'}
              onModalOpened={() => setAutoOpenSection(null)}
            />
          )}

          {isTalent && visibleSections.includes('skills') && (
            <SkillsSection 
              skills={talentProfile?.skills || []} 
              onUpdate={(skills) => handleUpdateProfile({ skills })}
              onRemoveSection={() => handleRemoveSection('skills')}
              autoOpenAddModal={autoOpenSection === 'skills'}
              onModalOpened={() => setAutoOpenSection(null)}
            />
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          <PublicProfileCard 
            linkedinUrl={talentProfile?.linkedinUrl || ''} 
            githubUrl={talentProfile?.githubUrl || ''}
            figmaUrl={talentProfile?.figmaUrl || ''}
            onEditClick={() => setIsEditLinksOpen(true)}
          />
          
          {/* Liveness KYC always shown on the right for talent */}
          {isTalent && (
            <LivenessKycTab
              isTalent={isTalent}
              talentProfile={talentProfile}
              companyProfile={companyProfile}
              showLivenessCam={showLivenessCam}
              setShowLivenessCam={setShowLivenessCam}
              showTestFaceCam={showTestFaceCam}
              setShowTestFaceCam={setShowTestFaceCam}
              handleFaceCaptureComplete={async () => {}} 
              handleFaceTestComplete={async () => {}}
              handleKybSubmit={async () => {}}
              kybEntityName=""
              setKybEntityName={() => {}}
              kybNumber=""
              setKybNumber={() => {}}
              kybDocUrl=""
              setKybDocUrl={() => {}}
              isVerifyingKyb={false}
              verificationError={null}
            />
          )}

          {isTalent && visibleSections.includes('badges') && (
            <div className="bg-card border border-border rounded-3xl p-8 shadow-lg">
              <TalentBadgesTab earnedBadges={talentProfile?.earnedBadges || []} />
            </div>
          )}
        </div>
      </div>

      <EditIntroModal 
        isOpen={isEditIntroOpen}
        onClose={() => setIsEditIntroOpen(false)}
        talentProfile={talentProfile}
        onSave={handleUpdateProfile}
      />

      <EditAboutModal 
        isOpen={isEditAboutOpen}
        onClose={() => setIsEditAboutOpen(false)}
        talentProfile={talentProfile}
        onSave={handleUpdateProfile}
      />

      <AddSectionModal 
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        onAddSection={handleAddSection}
        visibleSections={visibleSections}
        isAboutAdded={!!talentProfile?.bio}
      />

      <EditPhotoModal
        isOpen={isEditPhotoOpen}
        onClose={() => setIsEditPhotoOpen(false)}
        talentProfile={talentProfile}
        onSave={handleUpdateProfile}
      />

      <EditLinksModal
        isOpen={isEditLinksOpen}
        onClose={() => setIsEditLinksOpen(false)}
        talentProfile={talentProfile}
        onSave={handleUpdateProfile}
      />
    </div>
  );
}

