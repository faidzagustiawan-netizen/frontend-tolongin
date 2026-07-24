'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Timer, ArrowRight, Coins, Code2, Plus, Building2 } from 'lucide-react';
import { Button } from '../common/Button';

export function TalentWorkspaceDashboard({ enrollments, tokenData }: { enrollments: any[], tokenData: any }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#1E7F4D] p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="
              M38 0
              C55 5 72 18 100 32
              L100 100
              L0 100
              L0 0
              Z
            "
            fill="#1e7f4d"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Workspace Talenta
          </h1>
          <p className="text-sm text-white/90 max-w-xl leading-relaxed">
            Semua tantangan dan studi kasus yang sedang Anda kerjakan atau telah
            selesai dievaluasi akan muncul di sini. Pilih salah satu untuk
            melanjutkan pengerjaan.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-4 flex-shrink-0">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex flex-col items-end">
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
              Saldo Token
            </p>
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-300" />
              <span className="font-display text-2xl font-extrabold text-white font-mono">
                {tokenData?.tokenBalance || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/challenges/create">
              <Button
                size="sm"
                className="bg-white text-[#1E7F4D] hover:bg-gray-100 font-bold shadow-xl flex items-center gap-2"
              >
                <Code2 className="h-4 w-4" />
                Buat Public Challenge (-50)
              </Button>
            </Link>
            <Link href="/talent/tokens">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl flex items-center gap-2 text-white"
              >
                <Plus className="h-4 w-4" />
                Top-Up Token
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-bg border border-border rounded-3xl p-12 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center mx-auto text-muted-foreground shadow-inner">
            <Briefcase className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl font-bold text-foreground tracking-tight">Belum Ada Tantangan yang Diambil</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Anda belum berpartisipasi dalam studi kasus mana pun. Eksplorasi tantangan perusahaan sekarang untuk membangun portofolio!
            </p>
          </div>
          <Link href="/challenges">
            <Button size="lg" className="mt-4 text-foreground">
              Cari Tantangan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments.map((enrollment: any) => {
            const isCompleted = enrollment.status === 'COMPLETED' || enrollment.status === 'PASSED';
            const isExpired = enrollment.status === 'EXPIRED';
            const statusColor = isCompleted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                              isExpired ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                              'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

            const companyName = enrollment.challenge?.challengeType === 'PUBLIC' ? (enrollment.challenge?.creator?.fullName || 'Talenta') : (enrollment.challenge?.company?.companyName || 'Perusahaan Mitra');
            const logoUrl = enrollment.challenge?.challengeType === 'PUBLIC' ? enrollment.challenge?.creator?.avatarUrl : enrollment.challenge?.company?.logoUrl;

            return (
              <Link key={enrollment.id} href={`/workspace/${enrollment.id}`} className="group">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full hover:border-emerald-500/50 transition-all relative overflow-hidden space-y-6">
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-foreground/5 border border-foreground/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {logoUrl ? (
                            <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {companyName}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider border flex-shrink-0 ${statusColor}`}>
                        {enrollment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-lg group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {enrollment.challenge?.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">Diambil pada: {new Date(enrollment.startedAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border relative z-10">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <Timer className="h-4 w-4" /> Masuk ke LMS
                    </span>
                    <div className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
