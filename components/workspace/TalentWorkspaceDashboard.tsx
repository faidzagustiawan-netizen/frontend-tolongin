'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Coins, Building2, User, BadgeCheck } from 'lucide-react';
import { Button } from '../common/Button';

export function TalentWorkspaceDashboard({ enrollments, tokenData: _tokenData }: { enrollments: any[], tokenData?: any }) {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header Section - Clean 2 Column Layout with Mascot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center font-jakarta mb-10">
        {/* Left Column: Title, Subtitle & Action Button */}
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-jakarta text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-foreground tracking-tight leading-[1.18]">
            Workspace Talenta<span className="text-[#1E7F4D]">.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium max-w-3xl">
            Semua tantangan dan studi kasus yang sedang Anda kerjakan atau telah selesai dievaluasi akan muncul di sini. Pilih salah satu untuk melanjutkan pengerjaan.
          </p>
          <div className="pt-2">
            <Link href="/challenges/create">
              <Button
                variant="ghost"
                size="md"
                className="!bg-transparent hover:!bg-[#1E7F4D]/10 !bg-none !text-[#1E7F4D] dark:!text-[#00BC7D] font-bold !rounded-full border-2 border-[#1E7F4D] px-6 py-3 text-sm sm:text-base flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
              >
                <span className="!text-[#1E7F4D] dark:!text-[#00BC7D]">Buat Studi Kasus Publik</span>
                <span className="flex items-center gap-1 bg-[#1E7F4D]/10 dark:bg-[#1E7F4D]/20 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold border border-[#1E7F4D]/30 !text-[#1E7F4D] dark:!text-[#00BC7D]">
                  <Coins className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0" />
                  -50
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Mascot Image */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <Image
            src="/mascot-chear.svg"
            alt="Mascot Chear"
            width={240}
            height={240}
            priority
            className="h-48 sm:h-56 lg:h-64 w-auto object-contain"
          />
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-bg border border-border rounded-3xl p-12 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center mx-auto text-muted-foreground shadow-inner">
            <Briefcase className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl font-bold text-foreground tracking-tight">Belum Ada Studi Kasus yang Diambil</h2>
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
            const title = enrollment.challenge?.title || '';
            const type = enrollment.challenge?.challengeType || 'COMPANY';

            const theme = type === 'COMPANY' ? {
              bgClass: 'bg-[#F1732E]',
              rewardClass: 'text-[#F1732E] dark:text-[#F1732E] font-extrabold',
              btnClass: 'bg-[#F1732E] border border-transparent text-white hover:bg-[#F58748] dark:bg-[#F1732E] dark:hover:bg-[#F58748] shadow-sm',
              bookmarkBtnClass: 'bg-[#F1732E] border-transparent text-white hover:bg-[#F1732E]/80 dark:bg-[#F1732E] dark:hover:bg-[#F1732E]/80 shadow-sm',
              cardBorderHoverClass: 'group-hover:border-[#F1732E]/30 dark:group-hover:border-[#F1732E]/30',
              cardBgClass: 'bg-[#F1732E]/10 dark:bg-[#F1732E]/20',
            } : {
              bgClass: 'bg-[#1E7F4D]',
              rewardClass: 'text-[#1E7F4D] dark:text-[#00BC7D] font-extrabold',
              btnClass: 'bg-[#1E7F4D] border border-transparent text-white hover:bg-[#28A567] dark:bg-[#1E7F4D] dark:hover:bg-[#28A567] shadow-sm',
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
                    style={{ background: `radial-gradient(circle at top right, ${type === 'COMPANY' ? '#F1732E' : '#1E7F4D'}, transparent 70%)` }} 
                  />

                  {/* Thumbnail Image (Flush to top, left, and right edges) */}
                  <div className="relative -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 h-40 sm:h-44 mb-4 overflow-hidden z-10 flex-shrink-0 bg-muted border-b border-border/50">
                    <img
                      src={type === 'COMPANY' ? '/bgchallenge-company.svg' : '/bgchallenge-talent.svg'}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* 1. Judul (Fixed height for 2 lines max) */}
                  <div className="relative h-14 sm:h-16 mb-2 z-10">
                    <h3 className="text-lg sm:text-[1.2rem] font-extrabold text-foreground leading-snug line-clamp-2">
                      {title}
                    </h3>
                  </div>

                  {/* 2. Diambil pada */}
                  <div className="h-5 mb-4 flex items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                      Diambil pada: {new Date(enrollment.startedAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  {/* 4. Status Tag (Fixed height 1 line) */}
                  <div className="h-7 mb-4 flex items-center gap-2 overflow-hidden">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor}`}>
                      {enrollment.status.replace('_', ' ')}
                    </span>
                  </div>

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
