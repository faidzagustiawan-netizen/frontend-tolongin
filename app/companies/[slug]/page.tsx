'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../../../services/companies.service';
import { ChallengeCard } from '../../../components/challenge/ChallengeCard';
import { Button } from '../../../components/common/Button';
import { Building2, ShieldCheck, Globe, Users, Briefcase, CalendarClock, CheckCircle2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.slug as string;
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'completed'>('ongoing');

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesService.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="h-64 bg-card rounded-3xl border border-border"></div>
        <div className="h-96 bg-card rounded-3xl border border-border"></div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-medium">Gagal memuat profil perusahaan.</p>
      </div>
    );
  }

  const { challenges } = company;
  
  const getTabChallenges = () => {
    switch (activeTab) {
      case 'ongoing': return challenges.ongoing || [];
      case 'upcoming': return challenges.upcoming || [];
      case 'completed': return challenges.completed || [];
      default: return [];
    }
  };

  const activeChallenges = getTabChallenges();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* HEADER SECTION */}
      <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-3xl bg-muted/50 border-2 border-border p-2 flex items-center justify-center overflow-hidden flex-shrink-0 bg-white">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
                  {company.companyName}
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Trust {company.trustScore}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border">
                  <Briefcase className="w-4 h-4" /> {company.industry}
                </span>
                {company.companySize && (
                  <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-border">
                    <Users className="w-4 h-4" /> {company.companySize}
                  </span>
                )}
                {company.websiteUrl && (
                  <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors bg-muted/50 px-3 py-1 rounded-full border border-border">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-4xl text-sm md:text-base">
              {company.description || 'Tidak ada deskripsi perusahaan.'}
            </p>
          </div>
        </div>
      </div>

      {/* CHALLENGES TABS SECTION */}
      <div className="space-y-8">
        <div className="flex items-center justify-center border-b border-border">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                activeTab === 'ongoing' ? 'text-emerald-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> Sedang Berlangsung ({challenges.ongoing?.length || 0})
              </span>
              {activeTab === 'ongoing' && (
                <motion.div layoutId="activeTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                activeTab === 'upcoming' ? 'text-amber-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4" /> Akan Datang ({challenges.upcoming?.length || 0})
              </span>
              {activeTab === 'upcoming' && (
                <motion.div layoutId="activeTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                activeTab === 'completed' ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Selesai ({challenges.completed?.length || 0})
              </span>
              {activeTab === 'completed' && (
                <motion.div layoutId="activeTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* LOGIC EXPLANATION */}
        <div className="bg-muted/30 border border-border rounded-xl p-4 text-sm text-muted-foreground max-w-3xl mx-auto text-center">
          {activeTab === 'ongoing' && 'Studi kasus ini sedang aktif. Anda bisa mendaftar dan langsung mulai mengerjakannya sekarang.'}
          {activeTab === 'upcoming' && 'Studi kasus ini belum dimulai. Anda bisa melihat detailnya, namun soal belum dapat diakses.'}
          {activeTab === 'completed' && 'Studi kasus ini telah ditutup. Tidak menerima pendaftaran atau pengumpulan tugas lagi.'}
        </div>

        {/* CHALLENGES GRID */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {activeChallenges.length > 0 ? (
              activeChallenges.map((challenge: any) => (
                <ChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  slug={challenge.slug}
                  title={challenge.title}
                  summary={challenge.summary}
                  category={challenge.category}
                  difficulty={challenge.difficulty}
                  type={challenge.challengeType}
                  companyName={company.companyName}
                  logoUrl={company.logoUrl}
                  rewardDescription={challenge.rewardDescription}
                  deadlineAt={challenge.deadlineAt}
                  trustScore={company.trustScore}
                  isUpcoming={activeTab === 'upcoming'}
                  startsAt={challenge.startsAt}
                  isCompleted={activeTab === 'completed'}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-card border border-border rounded-3xl">
                <p className="text-muted-foreground font-medium">Tidak ada studi kasus di kategori ini.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
