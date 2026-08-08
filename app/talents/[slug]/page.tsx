'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../../services/auth.service';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { TalentBadgesTab } from '../../../components/profile/TalentBadgesTab';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { TalentProfileTab } from '../../../components/profile/TalentProfileTab';

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: profileData, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', resolvedParams.slug],
    queryFn: () => authService.getProfile(resolvedParams.slug),
  });

  const profile = profileData?.data;
  const companySlug = profile?.companyProfile?.slug ?? profile?.companyProfile?.id;

  /**
   * Slug perusahaan dialihkan ke direktori perusahaan.
   *
   * `/users/:idOrSlug` di backend juga mencocokkan slug perusahaan, jadi rute
   * talenta ini bisa dibuka oleh slug perusahaan — dan dulu berhenti pada
   * kalimat "Ini adalah profil perusahaan." tanpa satu pun data. Halaman
   * `/companies/[slug]` sudah menampilkan profil itu dengan lengkap.
   */
  useEffect(() => {
    if (profile && profile.role === 'COMPANY' && companySlug) {
      router.replace(`/companies/${companySlug}`);
    }
  }, [profile, companySlug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
          <div className="h-60 bg-foreground/5 rounded-3xl w-full" />
          <div className="h-60 bg-foreground/5 rounded-3xl w-full" />
        </div>
      </div>
    );
  }

  /* Gagal memuat dibedakan dari profil yang memang tidak ada: yang pertama
     bisa dicoba ulang, yang kedua tidak. */
  if (error) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="text-center py-32 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground">Gagal Memuat Profil</h2>
          <p className="text-sm text-muted-foreground">
            Profilnya tidak berhasil diambil. Periksa koneksi Anda lalu coba lagi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Coba Lagi
            </Button>
            <Link href="/talents">
              <Button size="sm">Ke Direktori Talenta</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="text-center py-32 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">Pengguna yang Anda cari tidak ada atau tidak valid.</p>
          {/* `window.history.back()` diam saja bila pengunjung tiba dari tautan
              yang dibagikan — tidak ada riwayat untuk dimundurkan. Tautan ke
              direktori selalu punya tujuan. */}
          <Link href="/talents" className="inline-block">
            <Button size="sm">Ke Direktori Talenta</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = profile;

  // Pengalihan di `useEffect` di atas butuh satu render untuk berjalan; selama
  // render itu halaman menerangkan ke mana pengunjung dibawa alih-alih
  // menampilkan kartu kosong. Bila slug perusahaannya tidak terbaca, direktori
  // perusahaan tetap menjadi jalan keluar.
  if (user.role === 'COMPANY') {
    return (
      <div className="min-h-screen bg-bg">
        <div className="text-center py-32 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ini Profil Perusahaan</h2>
          <p className="text-sm text-muted-foreground">
            Membuka halaman perusahaannya...
          </p>
          <Link href={companySlug ? `/companies/${companySlug}` : '/companies'} className="inline-block">
            <Button size="sm">Lihat Profil Perusahaan</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isTalent = user.role === 'TALENT';
  const talentProfile = user.talentProfile;
  const companyProfile = user.companyProfile;

  return (
    <div className="min-h-screen bg-bg">
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
