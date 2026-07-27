'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Timer, ArrowRight, Coins, Code2, Plus, Building2, User, BadgeCheck, Bookmark, Lock, CheckCircle2 } from 'lucide-react';
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
            const statusColor = isCompleted ? 'text-white bg-[#1E7F4D] border-transparent' :
                              isExpired ? 'text-white bg-[#991B1B] border-transparent' :
                              'text-white bg-[#A16207] border-transparent';

            const companyName = enrollment.challenge?.challengeType === 'PUBLIC' ? (enrollment.challenge?.creator?.fullName || 'Talenta') : (enrollment.challenge?.company?.companyName || 'Perusahaan Mitra');
            const logoUrl = enrollment.challenge?.challengeType === 'PUBLIC' ? enrollment.challenge?.creator?.avatarUrl : enrollment.challenge?.company?.logoUrl;
            const summary = enrollment.challenge?.summary || '';
            const title = enrollment.challenge?.title || '';
            const type = enrollment.challenge?.challengeType || 'COMPANY';

            const theme = type === 'COMPANY' ? {
              bgClass: 'bg-[#3B3669]',
              rewardClass: 'text-[#3B3669] dark:text-[#615FFF] font-extrabold',
              btnClass: 'bg-white border border-[#3B3669] text-[#3B3669] hover:bg-[#3B3669] hover:text-white dark:bg-card dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white shadow-sm',
              bookmarkBtnClass: 'bg-[#3B3669] border-transparent text-white hover:bg-[#3B3669]/80 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm',
              cardBorderHoverClass: 'group-hover:border-[#3B3669]/30 dark:group-hover:border-indigo-500/30',
              cardBgClass: 'bg-[#3B3669]/10 dark:bg-[#3B3669]/20',
            } : {
              bgClass: 'bg-[#1E7F4D]',
              rewardClass: 'text-[#1E7F4D] dark:text-[#00BC7D] font-extrabold',
              btnClass: 'bg-white border border-[#1E7F4D] text-[#1E7F4D] hover:bg-[#1E7F4D] hover:text-white dark:bg-card dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white shadow-sm',
              bookmarkBtnClass: 'bg-[#1E7F4D] border-transparent text-white hover:bg-[#1E7F4D]/80 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-sm',
              cardBorderHoverClass: 'group-hover:border-[#1E7F4D]/30 dark:group-hover:border-emerald-500/30',
              cardBgClass: 'bg-[#1E7F4D]/10 dark:bg-[#1E7F4D]/20',
            };

            return (
              <motion.div
                key={enrollment.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative flex flex-col h-full group"
              >
                {/* Top Tab (Outside main box, overlapping border with -mb-[1px]) */}
                <div className="flex justify-end w-full relative z-20 -mb-[1px]">
                  <div className="relative w-[55%] sm:w-[50%] h-8 sm:h-9 flex">
                    {/* Slanted left edge with rounded top-left */}
                    <div className={`absolute top-0 bottom-0 left-0 right-10 ${theme.bgClass} -skew-x-[20deg] origin-bottom rounded-tl-[12px]`} />
                    {/* Straight right edge with rounded top-right */}
                    <div className={`absolute top-0 bottom-0 right-0 w-[80%] ${theme.bgClass} rounded-tr-[24px]`} />
                    
                    {/* Content */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center gap-2 px-4 pb-0.5">
                      {type === 'COMPANY' ? (
                        <>
                          <Building2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                          <span className="text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Perusahaan</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-white" strokeWidth={2.5} />
                          <span className="text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Talenta</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area (White Box) */}
                <div className={`bg-white dark:bg-card border border-border shadow-sm rounded-[24px] rounded-tr-none p-5 sm:p-6 flex flex-col flex-grow relative z-10 transition-all group-hover:shadow-xl overflow-hidden ${theme.cardBorderHoverClass}`}>
                  
                  {/* Background Radial Gradient */}
                  <div 
                    className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20 dark:opacity-30 z-0" 
                    style={{ background: `radial-gradient(circle at top right, ${type === 'COMPANY' ? '#3B3669' : '#1E7F4D'}, transparent 70%)` }} 
                  />

                  {/* 1. Judul (Fixed height for 2 lines max) */}
                  <div className="relative h-14 sm:h-16 mb-2 z-10">
                    <h3 className="text-lg sm:text-[1.2rem] font-extrabold text-foreground leading-snug line-clamp-2">
                      {title}
                    </h3>
                  </div>

                  {/* 2. Diambil pada */}
                  <div className="h-5 mb-2.5 flex items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                      Diambil pada: {new Date(enrollment.startedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {/* 3. Deskripsi (Fixed height 1 line, truncate with ...) */}
                  <div className="h-5 mb-4 flex items-center">
                    {summary ? (
                      <p className="text-base text-foreground font-semibold truncate">
                        {summary}
                      </p>
                    ) : (
                      <p className="text-base text-muted-foreground italic truncate">Tidak ada deskripsi</p>
                    )}
                  </div>

                  {/* 4. Status Tag (Fixed height 1 line) */}
                  <div className="h-7 mb-5 flex items-center gap-2 overflow-hidden">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor}`}>
                      {enrollment.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* 5. Divider */}
                  <div className="border-t border-border w-full mb-4" />

                  {/* 6. Profil Uploader */}
                  <div className="h-12 mb-5 flex items-center gap-3">
                    <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-orange-500 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      {logoUrl ? (
                        <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm tracking-widest">
                          {companyName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-foreground line-clamp-1 flex items-center gap-1.5">
                      <span>{companyName}</span>
                      {type === 'COMPANY' && (
                        <span title="Perusahaan Resmi" className="inline-flex flex-shrink-0">
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 7. Footer Buttons */}
                  <div className="h-12 sm:h-10 flex items-center mt-auto">
                    <div className="w-full h-12 sm:h-10">
                      <Link href={`/workspace/${enrollment.id}`} className={`w-full h-full rounded-full text-sm font-bold flex items-center justify-center transition-all hover:scale-[1.02] ${theme.btnClass}`}>
                        Masuk ke LMS <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
