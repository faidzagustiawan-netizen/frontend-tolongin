'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../../../store/userStore';
import { verificationService } from '../../../services/verification.service';
import { authService } from '../../../services/auth.service';
import { subscriptionsService, UpgradeSubscriptionPayload } from '../../../services/subscriptions.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { LivenessCam } from '../../../components/workspace/LivenessCam';
import { User, ShieldCheck, Award, Building2, AlertCircle, CheckCircle2, RefreshCw, Upload, FileText, Crown, Zap, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [verificationMethod, setVerificationMethod] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const [uploadedSelfieUrl, setUploadedSelfieUrl] = useState<string | null>(null);
  const [uploadedKtpUrl, setUploadedKtpUrl] = useState<string | null>(null);
  const [isUploadingVerify, setIsUploadingVerify] = useState(false);

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

  useEffect(() => {
    if (profileData?.data) {
      const p = profileData.data.talentProfile || profileData.data.companyProfile;
      if (p) updateUserProfile(p);
    }
  }, [profileData?.data, updateUserProfile]);

  const handleFaceCaptureComplete = async (selfieUrl: string, idCardUrl: string) => {
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      await verificationService.verifyFace({ selfiePhotoUrl: selfieUrl, idCardPhotoUrl: idCardUrl });
      setVerificationSuccess('Verifikasi biometrik wajah berhasil! Akun Anda kini berstatus Verified Talent.');
      setShowLivenessCam(false);
      if (profile?.talentProfile) {
        updateUserProfile({ ...profile.talentProfile, faceVerificationStatus: 'VERIFIED' });
      }
      refetchVerification();
      refetch();
    } catch (err: any) {
      setShowLivenessCam(false);
      const msg = typeof err.message === 'string' 
        ? err.message 
        : (Array.isArray(err.message) ? err.message.join(', ') : (err.error || 'Gagal memverifikasi dokumen. Pastikan pencahayaan terang dan foto tajam.'));
      setVerificationError(msg);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'SELFIE' | 'KTP') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'SELFIE') setUploadedSelfieUrl(reader.result as string);
        else setUploadedKtpUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUploadedPhotos = async () => {
    if (!uploadedSelfieUrl || !uploadedKtpUrl) return;
    setIsUploadingVerify(true);
    await handleFaceCaptureComplete(uploadedSelfieUrl, uploadedKtpUrl);
    setIsUploadingVerify(false);
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

  const handleUpgradeTier = async (tier: 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM') => {
    setIsUpgradingTier(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    setSelectedTier(tier);

    try {
      await subscriptionsService.upgrade({ tier, durationInMonths: 12 });
      setVerificationSuccess(`Berhasil beralih ke paket langganan ${tier}! Fitur premium Anda telah aktif.`);
      refetchSub();
      refetch();
    } catch (err: any) {
      setVerificationError(err.message || 'Gagal memperbarui paket langganan. Silakan coba lagi.');
    } finally {
      setIsUpgradingTier(false);
      setSelectedTier(null);
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
      name: 'Startup Mitra',
      price: 'Gratis',
      period: 'selamanya',
      desc: 'Ideal untuk startup tahap awal yang mencari talenta unggul.',
      features: ['Direktori studi kasus dasar', 'Maksimal 5 studi kasus aktif', 'Koreksi kode otomatis AI', 'Dukungan komunitas'],
      popular: false,
    },
    {
      tier: 'KONGLOMERAT' as const,
      name: 'Konglomerat Pro',
      price: 'Rp 2.500.000',
      period: '/ bulan',
      desc: 'Solusi lengkap untuk perusahaan berskala besar dan enterprise.',
      features: ['Studi kasus aktif tak terbatas', 'Pembuat studi kasus otomatis AI', 'Verifikasi AI Anti-Joki prioritas', 'Laporan analitik rekrutmen mendalam', 'Dedicated Account Support'],
      popular: true,
    },
    {
      tier: 'CUSTOM' as const,
      name: 'Enterprise Custom',
      price: 'Kustom',
      period: '/ kontrak',
      desc: 'Disesuaikan dengan kebutuhan infrastruktur dan integrasi ATS internal.',
      features: ['Semua fitur Konglomerat Pro', 'Integrasi API langsung ke ATS internal', 'Rubrik penilaian kustom khusus', 'SLA jaminan uptime 99.9%', 'Pelatihan rekruter khusus'],
      popular: false,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xl">
            {isTalent && talentProfile?.avatarUrl ? (
              <img src={talentProfile.avatarUrl} alt={talentProfile.fullName} className="h-full w-full object-cover" />
            ) : !isTalent && companyProfile?.logoUrl ? (
              <img src={companyProfile.logoUrl} alt={companyProfile.companyName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {isTalent ? talentProfile?.fullName || user.email : companyProfile?.companyName || user.email}
              </h1>
              {((isTalent && talentProfile?.faceVerificationStatus === 'VERIFIED') || (!isTalent && companyProfile?.kybStatus === 'VERIFIED')) && (
                <span className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold shadow-md">
                  <ShieldCheck className="h-4 w-4" /> Terverifikasi
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{isTalent ? talentProfile?.headline || 'Talenta Tolongin.co' : companyProfile?.industry || 'Perusahaan Mitra'}</p>
            <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
          </div>
        </div>

        {isTalent && talentProfile && (
          <div className="flex items-center gap-6 bg-dark-bg border border-dark-border rounded-2xl p-6 shadow-xl relative z-10">
            <div className="text-center px-4 border-r border-dark-border">
              <h4 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{talentProfile.level}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Level Talenta</p>
            </div>
            <div className="text-center px-4">
              <h4 className="font-display text-3xl font-extrabold text-white">{talentProfile.xp}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Total XP</p>
            </div>
          </div>
        )}

        {!isTalent && companyProfile && (
          <div className="flex items-center gap-6 bg-dark-bg border border-dark-border rounded-2xl p-6 shadow-xl relative z-10">
            <div className="text-center px-4 border-r border-dark-border">
              <h4 className={`font-display text-3xl font-extrabold ${companyProfile.trustScore >= 80 ? 'text-emerald-400' : companyProfile.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {companyProfile.trustScore ?? 100}
              </h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Trust Score</p>
            </div>
          </div>
        )}
      </div>

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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nama Lengkap" defaultValue={talentProfile?.fullName} value={isEditingProfile ? editFormData.fullName : undefined} onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="Keahlian Utama (Headline)" defaultValue={talentProfile?.headline} value={isEditingProfile ? editFormData.headline : undefined} onChange={(e) => setEditFormData({...editFormData, headline: e.target.value})} disabled={!isEditingProfile} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="NIK KTP" defaultValue={talentProfile?.ktpNik} value={isEditingProfile ? editFormData.ktpNik : undefined} onChange={(e) => setEditFormData({...editFormData, ktpNik: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="Daftar Keahlian (Pisahkan dengan koma)" defaultValue={talentProfile?.skills?.join(', ')} value={isEditingProfile ? editFormData.skills : undefined} onChange={(e) => setEditFormData({...editFormData, skills: e.target.value})} disabled={!isEditingProfile} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="URL GitHub" defaultValue={talentProfile?.githubUrl} value={isEditingProfile ? editFormData.githubUrl : undefined} onChange={(e) => setEditFormData({...editFormData, githubUrl: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="URL LinkedIn" defaultValue={talentProfile?.linkedinUrl} value={isEditingProfile ? editFormData.linkedinUrl : undefined} onChange={(e) => setEditFormData({...editFormData, linkedinUrl: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="URL Figma" defaultValue={talentProfile?.figmaUrl} value={isEditingProfile ? editFormData.figmaUrl : undefined} onChange={(e) => setEditFormData({...editFormData, figmaUrl: e.target.value})} disabled={!isEditingProfile} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio / Tentang Saya</label>
                  {isEditingProfile ? (
                    <textarea 
                      className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      rows={4}
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 leading-relaxed bg-dark-bg border border-dark-border p-4 rounded-xl">
                      {talentProfile?.bio || 'Belum ada bio.'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nama Perusahaan" defaultValue={companyProfile?.companyName} value={isEditingProfile ? editFormData.companyName : undefined} onChange={(e) => setEditFormData({...editFormData, companyName: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="Bidang Industri" defaultValue={companyProfile?.industry} value={isEditingProfile ? editFormData.industry : undefined} onChange={(e) => setEditFormData({...editFormData, industry: e.target.value})} disabled={!isEditingProfile} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Ukuran Perusahaan" defaultValue={companyProfile?.companySize} value={isEditingProfile ? editFormData.companySize : undefined} onChange={(e) => setEditFormData({...editFormData, companySize: e.target.value})} disabled={!isEditingProfile} />
                  <Input label="URL Website" defaultValue={companyProfile?.websiteUrl} value={isEditingProfile ? editFormData.websiteUrl : undefined} onChange={(e) => setEditFormData({...editFormData, websiteUrl: e.target.value})} disabled={!isEditingProfile} />
                </div>
                <Input label="Paket Langganan Aktif Saat Ini" defaultValue={companyProfile?.subscriptionTier} disabled />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi Perusahaan</label>
                  {isEditingProfile ? (
                    <textarea 
                      className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      rows={4}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 leading-relaxed bg-dark-bg border border-dark-border p-4 rounded-xl">
                      {companyProfile?.description || 'Belum ada deskripsi perusahaan.'}
                    </p>
                  )}
                </div>
              </div>
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <Crown className="h-4 w-4" /> Manajemen Berlangganan
              </div>
              <h3 className="font-display text-2xl font-bold text-white">Tingkatkan Paket Perusahaan Anda</h3>
              <p className="text-sm text-gray-400">
                Pilih paket langganan yang paling sesuai untuk memaksimalkan efisiensi rekrutmen dan asesmen otomatis AI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {subscriptionPlans.map((plan) => {
                  const isCurrentPlan = companyProfile?.subscriptionTier === plan.tier;
                  const isSelectedLoading = isUpgradingTier && selectedTier === plan.tier;

                  return (
                    <div
                      key={plan.tier}
                      className={`relative bg-dark-card border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                        plan.popular ? 'border-emerald-500/50 shadow-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.05] to-transparent' : 'border-dark-border'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Rekomendasi
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-display text-lg font-bold text-white">{plan.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
                        </div>

                        <div className="pt-2">
                          <span className="font-display text-2xl font-bold text-white">{plan.price}</span>
                          <span className="text-xs text-gray-400 font-medium ml-1">{plan.period}</span>
                        </div>

                        <ul className="space-y-2.5 pt-4 border-t border-dark-border/80 text-xs text-gray-300">
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-center gap-2 font-medium">
                              <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-8">
                        {isCurrentPlan ? (
                          <Button className="w-full bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default shadow-none font-semibold" disabled>
                            Paket Saat Ini Aktif
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUpgradeTier(plan.tier)}
                            isLoading={isSelectedLoading}
                            variant={plan.popular ? 'primary' : 'secondary'}
                            className="w-full font-semibold shadow-xl"
                          >
                            Pilih Paket Ini
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isTalent && talentProfile?.earnedBadges?.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
              <h3 className="font-display text-xl font-bold text-white border-b border-dark-border pb-4">Lencana Kompetensi (Gamifikasi)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {talentProfile.earnedBadges.map((tb: any) => (
                  <div key={tb.badge.id} className="bg-dark-bg border border-dark-border rounded-2xl p-5 text-center space-y-3 shadow-md">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tb.badge.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{tb.badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Keamanan & Validasi
            </div>
            <h3 className="font-display text-xl font-bold text-white">Status Verifikasi Identitas</h3>

            {isTalent ? (
              <div className="space-y-6">
                {verificationError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-400 shadow-lg text-xs leading-relaxed">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5 text-red-300">Verifikasi Ditolak:</span>
                      {verificationError}
                    </div>
                  </div>
                )}
                <div className="bg-dark-bg border border-dark-border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">AI Liveness Check</h4>
                    <p className="text-xs text-gray-400">Verifikasi biometrik wajah & KTP</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    talentProfile?.faceVerificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {talentProfile?.faceVerificationStatus || 'UNVERIFIED'}
                  </span>
                </div>

                {talentProfile?.faceVerificationStatus !== 'VERIFIED' && !showLivenessCam && (
                  <Button onClick={() => setShowLivenessCam(true)} className="w-full shadow-xl">
                    Mulai Verifikasi Wajah AI
                  </Button>
                )}

                {talentProfile?.faceVerificationStatus === 'VERIFIED' && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
                      <div className="h-16 w-16 rounded-xl bg-black overflow-hidden border border-emerald-500/50 flex-shrink-0 shadow-md">
                        {talentProfile.avatarUrl ? (
                          <img src={talentProfile.avatarUrl} alt="Verified Biometric" className="h-full w-full object-cover transform scale-x-[-1]" />
                        ) : (
                          <User className="h-8 w-8 text-emerald-400 mx-auto my-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold inline-block">Wajah KTP Terdaftar</span>
                        <p className="text-xs text-gray-300 leading-relaxed">Foto biometrik ini digunakan sistem anti-joki untuk verifikasi otomatis saat Anda mengumpulkan studi kasus.</p>
                      </div>
                    </div>

                    {!showLivenessCam ? (
                      <Button variant="outline" onClick={() => setShowLivenessCam(true)} className="w-full text-xs">
                        <RefreshCw className="h-4 w-4 mr-2" /> Ambil Ulang Foto Verifikasi Wajah (Retake)
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setShowLivenessCam(false)} className="w-full text-xs text-red-400 border border-red-500/20 bg-red-500/10">
                        Batal Pengambilan Ulang
                      </Button>
                    )}
                  </div>
                )}

                {showLivenessCam && (
                  <div className="pt-4 border-t border-dark-border space-y-6">
                    <div className="flex bg-dark-bg p-1.5 rounded-2xl border border-dark-border">
                      <button
                        type="button"
                        onClick={() => setVerificationMethod('CAMERA')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                          verificationMethod === 'CAMERA' ? 'bg-emerald-500 text-white shadow-lg font-extrabold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        📷 Kamera Web (Live)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerificationMethod('UPLOAD')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                          verificationMethod === 'UPLOAD' ? 'bg-emerald-500 text-white shadow-lg font-extrabold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        📂 Unggah File Foto
                      </button>
                    </div>

                    {verificationMethod === 'CAMERA' ? (
                      <LivenessCam onCaptureComplete={handleFaceCaptureComplete} />
                    ) : (
                      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl space-y-6 text-center animate-fadeIn">
                        <h3 className="text-lg font-bold text-white">Unggah Berkas KTP & Foto Wajah (Selfie)</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Pastikan foto KTP dan wajah Anda jelas, tajam, dan memiliki pencahayaan terang agar lolos pemindaian AI anti-joki.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-300">1. Foto KTP Asli</label>
                            <div className="border-2 border-dashed border-dark-border hover:border-cyan-500/50 rounded-2xl p-4 text-center cursor-pointer relative bg-dark-bg transition-all min-h-[160px] flex flex-col items-center justify-center overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'KTP')}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              {uploadedKtpUrl ? (
                                <img src={uploadedKtpUrl} alt="Preview KTP" className="max-h-36 w-full object-contain rounded-xl mx-auto" />
                              ) : (
                                <div className="py-4 space-y-2 pointer-events-none">
                                  <Upload className="h-8 w-8 text-cyan-400 mx-auto animate-bounce" />
                                  <p className="text-xs text-gray-400 font-medium">Pilih atau seret foto KTP ke sini</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-300">2. Foto Selfie Wajah</label>
                            <div className="border-2 border-dashed border-dark-border hover:border-emerald-500/50 rounded-2xl p-4 text-center cursor-pointer relative bg-dark-bg transition-all min-h-[160px] flex flex-col items-center justify-center overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'SELFIE')}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              {uploadedSelfieUrl ? (
                                <img src={uploadedSelfieUrl} alt="Preview Selfie" className="max-h-36 w-full object-contain rounded-xl mx-auto" />
                              ) : (
                                <div className="py-4 space-y-2 pointer-events-none">
                                  <Upload className="h-8 w-8 text-emerald-400 mx-auto animate-bounce" />
                                  <p className="text-xs text-gray-400 font-medium">Pilih atau seret foto Selfie ke sini</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleSubmitUploadedPhotos}
                          disabled={!uploadedSelfieUrl || !uploadedKtpUrl || isUploadingVerify}
                          isLoading={isUploadingVerify}
                          className="w-full font-bold shadow-xl py-3"
                        >
                          Kirim & Mulai Pemindaian AI
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-dark-bg border border-dark-border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Legalitas Bisnis (KYB)</h4>
                    <p className="text-xs text-gray-400">Verifikasi NIB / NPWP Perusahaan</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    companyProfile?.kybStatus === 'VERIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : companyProfile?.kybStatus === 'PENDING'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {companyProfile?.kybStatus || 'UNVERIFIED'}
                  </span>
                </div>

                {companyProfile?.kybStatus !== 'VERIFIED' && companyProfile?.kybStatus !== 'PENDING' && (
                  <form onSubmit={handleKybSubmit} className="space-y-4 pt-4 border-t border-dark-border">
                    <Input
                      label="Nama Entitas Hukum Resmi"
                      type="text"
                      placeholder="PT Teknologi Tolongin Indonesia"
                      value={kybEntityName}
                      onChange={(e) => setKybEntityName(e.target.value)}
                    />
                    <Input
                      label="Nomor Induk Berusaha (NIB) / NPWP"
                      type="text"
                      placeholder="1234567890123"
                      value={kybNumber}
                      onChange={(e) => setKybNumber(e.target.value)}
                    />
                    <Input
                      label="Tautan Dokumen Legalitas (PDF/Image)"
                      type="url"
                      placeholder="https://storage.tolongin.co/docs/nib.pdf"
                      value={kybDocUrl}
                      onChange={(e) => setKybDocUrl(e.target.value)}
                    />
                    <Button type="submit" isLoading={isVerifyingKyb} className="w-full shadow-xl">
                      Kirim Dokumen KYB
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
