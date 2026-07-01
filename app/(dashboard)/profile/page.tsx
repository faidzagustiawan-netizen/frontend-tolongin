'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../../../store/userStore';
import { challengesService } from '../../../services/challenges.service';
import { verificationService } from '../../../services/verification.service';
import { authService } from '../../../services/auth.service';
import { subscriptionsService } from '../../../services/subscriptions.service';
import { Button } from '../../../components/common/Button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { TalentProfileTab } from '../../../components/profile/TalentProfileTab';
import { CompanySettingsTab } from '../../../components/profile/CompanySettingsTab';
import { LivenessKycTab } from '../../../components/profile/LivenessKycTab';
import { BillingTab } from '../../../components/profile/BillingTab';
import { TalentBadgesTab } from '../../../components/profile/TalentBadgesTab';

export default function ProfilePage() {
  const { user, loadUserFromStorage, updateUserProfile } = useUserStore();
  const [showLivenessCam, setShowLivenessCam] = useState(false);
  const [isVerifyingKyb, setIsVerifyingKyb] = useState(false);
  const [isUpgradingTier, setIsUpgradingTier] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'STARTUP' | 'KONGLOMERAT' | 'CUSTOM' | null>(null);
  const [kybEntityName, setKybEntityName] = useState('');
  const [kybNumber, setKybNumber] = useState('');
  const [kybDocUrl, setKybDocUrl] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  const [showTestFaceCam, setShowTestFaceCam] = useState(false);
  const [testFaceResult, setTestFaceResult] = useState<boolean | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => authService.getProfile(user?.id!),
    enabled: !!user?.id,
  });

  const { data: verificationStatusData, refetch: refetchVerification } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => verificationService.getStatus(),
    enabled: !!user?.id,
  });

  const { data: subStatusData, refetch: refetchSub } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionsService.getStatus(),
    enabled: !!user?.id && user?.role === 'COMPANY',
  });

  const profile = profileData?.data;
  const verificationStatus = verificationStatusData?.data;
  const subStatus = subStatusData?.data;

  const { data: myChallengesData } = useQuery({
    queryKey: ['my-challenges', user?.id],
    queryFn: () => challengesService.getAll({ companyId: profile?.companyProfile?.id, includeDrafts: true }),
    enabled: !!user?.id && user?.role === 'COMPANY' && !!profile?.companyProfile?.id,
  });
  const myChallenges = myChallengesData?.data || [];

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data.talentProfile || profileData.data.companyProfile;
      if (p) updateUserProfile(p);
    }
  }, [profileData?.data, updateUserProfile]);

  const handleFaceCaptureComplete = async (descriptor: number[], imageDataUrl?: string) => {
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      if (!user?.id) throw new Error("Pengguna belum login");

      const payload: any = {
        biometricFeatureVector: descriptor,
      };
      
      if (imageDataUrl) {
        payload.avatarUrl = imageDataUrl;
      }

      await authService.updateProfile(payload);

      setVerificationSuccess('Verifikasi biometrik wajah berhasil disimpan secara lokal!');
      setShowLivenessCam(false);
      
      // Update local state temporarily, or refetch
      if (profile?.talentProfile) {
        updateUserProfile({ ...profile.talentProfile, faceVerificationStatus: 'VERIFIED', biometricFeatureVector: descriptor, ...(imageDataUrl ? { avatarUrl: imageDataUrl } : {}) });
      }
      refetchVerification();
      refetch();
    } catch (err: any) {
      setShowLivenessCam(false);
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan model wajah.';
      setVerificationError(msg);
    }
  };

  const handleFaceTestComplete = async (descriptor: number[]) => {
    try {
       const storedVector = talentProfile?.biometricFeatureVector;
       if (!storedVector || !Array.isArray(storedVector) || storedVector.length === 0) {
         alert('Belum ada data wajah terdaftar.');
         setShowTestFaceCam(false);
         return;
       }
       const desc1 = new Float32Array(descriptor);
       const desc2 = new Float32Array(storedVector as number[]);
       const faceapi = await import('@vladmandic/face-api');
       const distance = faceapi.euclideanDistance(desc1, desc2);
       if (distance < 0.6) {
         setTestFaceResult(true);
         alert('Berhasil! Wajah Anda cocok dengan profil (Tingkat Kemiripan: ' + ((1 - distance) * 100).toFixed(1) + '%)');
       } else {
         setTestFaceResult(false);
         alert('Gagal! Wajah tidak cocok dengan profil terdaftar (Tingkat Kemiripan: ' + ((1 - distance) * 100).toFixed(1) + '%)');
       }
       setShowTestFaceCam(false);
    } catch (err) {
       alert('Gagal melakukan tes wajah');
       setShowTestFaceCam(false);
    }
  };


  const handleKybSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kybNumber || !kybDocUrl) return;
    setIsVerifyingKyb(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    try {
      await verificationService.verifyKyb({
        businessRegistrationNumber: kybNumber,
        documentUrl: kybDocUrl,
        legalEntityName: kybEntityName || undefined,
      });
      setVerificationSuccess('Dokumen legalitas perusahaan berhasil dikirim dan sedang ditinjau oleh tim verifikator.');
      if (profile?.companyProfile) {
        updateUserProfile({ ...profile.companyProfile, kybStatus: 'VERIFIED' });
      }
      refetchVerification();
      refetch();
    } catch (err: any) {
      setVerificationError(err.message || 'Gagal mengirim dokumen KYB. Silakan coba lagi.');
    } finally {
      setIsVerifyingKyb(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const payload: any = { ...editFormData };
      if (payload.skills && typeof payload.skills === 'string') {
        payload.skills = payload.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      await authService.updateProfile(payload);
      setVerificationSuccess('Profil berhasil diperbarui!');
      setIsEditingProfile(false);
      refetch();
    } catch (err: any) {
      setVerificationError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditingProfile) {
      setEditFormData(isTalent ? {
        fullName: talentProfile?.fullName || '',
        headline: talentProfile?.headline || '',
        bio: talentProfile?.bio || '',
        skills: talentProfile?.skills?.join(', ') || '',
        githubUrl: talentProfile?.githubUrl || '',
        linkedinUrl: talentProfile?.linkedinUrl || '',
        figmaUrl: talentProfile?.figmaUrl || '',
        ktpNik: talentProfile?.ktpNik || '',
      } : {
        companyName: companyProfile?.companyName || '',
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.companySize || '',
        websiteUrl: companyProfile?.websiteUrl || '',
        description: companyProfile?.description || '',
      });
    }
    setIsEditingProfile(!isEditingProfile);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-60 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-32 space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sesi Pengguna Tidak Ditemukan</h2>
        <p className="text-sm text-gray-400">Silakan masuk kembali untuk melihat profil Anda.</p>
        <Button onClick={() => window.location.href = '/login'} size="sm">Masuk Sekarang</Button>
      </div>
    );
  }

  const isTalent = user.role === 'TALENT';
  const talentProfile = profile.talentProfile;
  const companyProfile = profile.companyProfile;

  const subscriptionPlans = [
    {
      tier: 'STARTUP' as const,
      name: 'Paket Murah',
      price: 'Rp 500.000',
      period: '/ bulan',
      desc: 'Ideal untuk startup tahap awal yang mencari talenta unggul.',
      features: ['Maksimal 1 studi kasus (aktif/draf)', 'Direktori studi kasus dasar', 'Koreksi kode otomatis AI', 'Dukungan komunitas'],
      popular: false,
    },
    {
      tier: 'KONGLOMERAT' as const,
      name: 'Paket Pro',
      price: 'Rp 2.500.000',
      period: '/ bulan',
      desc: 'Solusi lengkap untuk perusahaan berskala besar dan enterprise.',
      features: ['Maksimal 5 studi kasus (aktif/draf)', 'Pembuat studi kasus otomatis AI', 'Verifikasi AI Anti-Joki prioritas', 'Laporan analitik rekrutmen mendalam', 'Dedicated Account Support'],
      popular: true,
    },
    {
      tier: 'CUSTOM' as const,
      name: 'Paket Custom',
      price: 'Kustom',
      period: '/ kontrak',
      desc: 'Disesuaikan dengan kebutuhan infrastruktur dan integrasi ATS internal.',
      features: ['Studi kasus aktif tak terbatas', 'Semua fitur Paket Pro', 'Integrasi API langsung ke ATS internal', 'Rubrik penilaian kustom khusus', 'SLA jaminan uptime 99.9%', 'Pelatihan rekruter khusus'],
      popular: false,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <ProfileHeader
        user={user}
        isTalent={isTalent}
        talentProfile={talentProfile}
        companyProfile={companyProfile}
      />

      {!isTalent && companyProfile && companyProfile.trustScore < 80 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400 shadow-lg">
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            <strong>Peringatan SLA Penilaian:</strong> Trust Score Anda telah turun di bawah batas optimal. Sistem telah mendeteksi keterlambatan dalam memberikan umpan balik (feedback) pada submisi kandidat (&gt; 7 hari). Harap segera evaluasi submisi tertunda agar visibilitas studi kasus Anda tidak dikurangi.
          </p>
        </div>
      )}

      {verificationSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4 text-emerald-400 shadow-lg">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{verificationSuccess}</p>
        </div>
      )}

      {verificationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400 shadow-lg">
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{verificationError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-dark-border pb-4">
              <h3 className="font-display text-xl font-bold text-white">
                {isTalent ? 'Informasi Profil Talenta' : 'Informasi Perusahaan Mitra'}
              </h3>
              <Button 
                variant={isEditingProfile ? "secondary" : "primary"} 
                size="sm" 
                onClick={handleEditToggle}
              >
                {isEditingProfile ? 'Batal' : 'Edit Profil'}
              </Button>
            </div>

            {isTalent ? (
              <TalentProfileTab
                talentProfile={talentProfile}
                isEditingProfile={isEditingProfile}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
              />
            ) : (
              <CompanySettingsTab
                companyProfile={companyProfile}
                isEditingProfile={isEditingProfile}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
              />
            )}

            {isEditingProfile && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                  Simpan Perubahan
                </Button>
              </div>
            )}
          </div>

          {!isTalent && companyProfile && (
            <BillingTab
              companyProfile={companyProfile}
              myChallenges={myChallenges}
              subscriptionPlans={subscriptionPlans}
              isUpgradingTier={isUpgradingTier}
              selectedTier={selectedTier}
            />
          )}

          {isTalent && talentProfile?.earnedBadges?.length > 0 && (
            <TalentBadgesTab earnedBadges={talentProfile.earnedBadges} />
          )}
        </div>

        <div className="space-y-8">
          <LivenessKycTab
            isTalent={isTalent}
            talentProfile={talentProfile}
            companyProfile={companyProfile}
            verificationError={verificationError}
            showLivenessCam={showLivenessCam}
            setShowLivenessCam={setShowLivenessCam}
            showTestFaceCam={showTestFaceCam}
            setShowTestFaceCam={setShowTestFaceCam}
            handleFaceCaptureComplete={handleFaceCaptureComplete}
            handleFaceTestComplete={handleFaceTestComplete}
            handleKybSubmit={handleKybSubmit}
            kybEntityName={kybEntityName}
            setKybEntityName={setKybEntityName}
            kybNumber={kybNumber}
            setKybNumber={setKybNumber}
            kybDocUrl={kybDocUrl}
            setKybDocUrl={setKybDocUrl}
            isVerifyingKyb={isVerifyingKyb}
          />
        </div>
      </div>
    </div>
  );
}
