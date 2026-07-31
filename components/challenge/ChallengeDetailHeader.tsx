import React from 'react';
import Image from 'next/image';
import { Building2, Calendar, Award, ShieldCheck, ArrowRight } from 'lucide-react';
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
  onLoginClick
}: ChallengeDetailHeaderProps) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'BEGINNER': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'INTERMEDIATE': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'ADVANCED': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
              {challenge.company?.logoUrl ? (
                <Image src={challenge.company.logoUrl} alt={challenge.company.companyName} fill sizes="64px" className="object-cover" />
              ) : (
                <Building2 className="relative z-10 h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-200">{challenge.company?.companyName || 'Perusahaan Mitra'}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-muted-foreground">
                  {challenge.category?.trim() || 'Lintas bidang'}
                </span>
                <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            {challenge.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {challenge.summary}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/80 text-sm text-muted-foreground">
            {challenge.rewardDescription && (
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Award className="h-5 w-5 flex-shrink-0" />
                <span>{challenge.rewardDescription}</span>
              </div>
            )}
            {challenge.deadlineAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                <span>Batas Waktu: {new Date(challenge.deadlineAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between w-full md:w-80 flex-shrink-0 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Dilindungi Digital NDA
            </div>
            <h3 className="text-lg font-bold text-foreground">Mulai Mengerjakan</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dengan mendaftar, Anda akan mendapatkan akses penuh ke dataset, mock API, dan panduan merek perusahaan.
            </p>
          </div>

          {isAuthenticated ? (
            userRole === 'TALENT' ? (
              <Button onClick={onEnrollClick} size="lg" className="w-full shadow-xl">
                <span>Ambil Tantangan Ini</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Hanya akun Talenta yang dapat mengambil tantangan studi kasus.</p>
              </div>
            )
          ) : (
            <Button onClick={onLoginClick} size="lg" className="w-full">
              Masuk untuk Mendaftar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
