import React from 'react';
import Image from 'next/image';
import { BadgeCheck, Grid, Clock, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface ChallengeDetailHeaderProps {
  challenge: any;
  isAuthenticated: boolean;
  userRole?: string;
  onEnrollClick: () => void;
  onLoginClick: () => void;
}

export const ChallengeDetailHeader = ({
  challenge,
  isAuthenticated,
  userRole,
  onEnrollClick,
  onLoginClick,
}: ChallengeDetailHeaderProps) => {
  const isProctored = challenge?.gradingRubric?.requireProctoring ?? true;
  const isDeadlinePassed = challenge?.deadlineAt
    ? new Date(challenge.deadlineAt).getTime() < Date.now()
    : false;

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm w-full relative">
      {/* Banner Image */}
      <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-background">
        <Image
          src={
            challenge?.bannerUrl ||
            (challenge?.challengeType === 'PUBLIC'
              ? '/bgchallenge-talent.svg'
              : '/bgchallenge-company.svg')
          }
          alt={challenge?.title || 'Banner Studi Kasus'}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>

      {/* Content Area (Rounded at Top-Left & Top-Right) */}
      <div className="bg-card rounded-t-3xl relative z-10 -mt-6 pt-2 px-8 pb-8">
        {/* Logo overlay & Issuer */}
        <div className="flex items-end gap-5 -mt-12 mb-6 relative z-20">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center border-4 border-card shadow-sm overflow-hidden shrink-0">
            {challenge?.challengeType === 'PUBLIC' ? (
              challenge?.creator?.avatarUrl ? (
                <img src={challenge.creator.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl font-display">
                  {(challenge?.creator?.fullName || 'T')[0].toUpperCase()}
                </span>
              )
            ) : challenge?.company?.logoUrl ? (
              <img src={challenge.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-5xl font-display">T</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-foreground tracking-tight">
              {challenge?.challengeType === 'PUBLIC'
                ? (challenge?.creator?.fullName || 'Talenta')
                : (challenge?.company?.companyName || 'Platform')}
            </span>
            {(challenge?.company || challenge?.challengeType === 'PUBLIC') && (
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-8">
          {challenge?.title}
        </h1>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 md:gap-x-20 mb-8 max-w-4xl">
          <div className="flex items-center">
            <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
              <Grid className="w-4 h-4" />
              <span className="text-sm font-semibold">Kategori</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              <span className="text-[10px] uppercase border border-border px-3 py-1 rounded-full tracking-wider">
                {challenge?.category?.trim() || 'Lintas bidang'}
              </span>
            </div>
          </div>

          <div className="flex items-center md:pl-16">
            <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Batas waktu</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {challenge?.gradingRubric?.durationHours || 72} Jam
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm font-semibold">Mode proctoring</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {isProctored ? 'Aktif (Biometrik Wajib)' : 'Non-Aktif'}
            </div>
          </div>

          <div className="flex items-center md:pl-16">
            <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Evaluasi AI</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              Instant Feedback
            </div>
          </div>
        </div>

        {/* Description & Action CTA (At Bottom-Right of Card) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-4 pt-4 border-t border-border/40">
          {/* Cadangannya dulu kalimat contoh tentang churn, disajikan seolah
              itu deskripsi resmi studi kasus ini — data milik contoh lain
              tampil sebagai data nyata. */}
          {(challenge?.shortDescription || challenge?.summary) && (
            <div className="text-base text-foreground font-medium flex-1">
              {challenge.shortDescription || challenge.summary}
            </div>
          )}

          <div className="shrink-0 self-end sm:self-auto">
            {isAuthenticated ? (
              userRole === 'TALENT' ? (
                /* Tenggat yang lewat dulu tidak menonaktifkan apa pun: alasan
                   penolakan baru muncul sesudah server menolak, padahal kartu di
                   direktori sudah menandainya "Ditutup". */
                isDeadlinePassed ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs font-bold text-amber-400">Pendaftaran Sudah Ditutup</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Tenggat studi kasus ini telah lewat.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={onEnrollClick}
                    size="lg"
                    className="!bg-[#1E7F4D] hover:!bg-[#16643c] !bg-none text-white font-bold shadow-xl border-none"
                  >
                    <span>Ambil Studi Kasus Ini</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )
              ) : (
                <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Hanya akun Talenta yang dapat mengambil tantangan.</p>
                </div>
              )
            ) : (
              <Button 
                onClick={onLoginClick} 
                size="lg"
                className="!bg-[#1E7F4D] hover:!bg-[#16643c] !bg-none text-white font-bold border-none"
              >
                Masuk untuk Mendaftar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
