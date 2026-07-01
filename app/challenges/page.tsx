'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { challengesService } from '../../services/challenges.service';
import { useUserStore } from '../../store/userStore';
import { ChallengeCard } from '../../components/challenge/ChallengeCard';
import { Button } from '../../components/common/Button';
import { Briefcase, RefreshCw, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { CreateChallengeModal } from '../../components/challenge/CreateChallengeModal';
import { ChallengeFilterBar } from '../../components/challenge/ChallengeFilterBar';

export default function ChallengesDirectoryPage() {
  const { user, loadUserFromStorage } = useUserStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['challenges', debouncedSearch, selectedCategory, selectedDifficulty],
    queryFn: () =>
      challengesService.getAll({
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
      }),
  });

  const categories = [
    { id: '', name: 'Semua Kategori' },
    { id: 'UI_UX', name: 'UI/UX Design' },
    { id: 'FRONTEND', name: 'Frontend Engineering' },
    { id: 'BACKEND', name: 'Backend & API' },
    { id: 'DATA_SCIENCE', name: 'Data Science & AI' },
    { id: 'MARKETING', name: 'Digital Marketing & SEO' },
    { id: 'PRODUCT', name: 'Product Management' },
  ];

  const difficulties = [
    { id: '', name: 'Semua Level' },
    { id: 'JUNIOR', name: 'Junior (1-2 Thn)' },
    { id: 'MEDIOR', name: 'Medior (3-5 Thn)' },
    { id: 'SENIOR', name: 'Senior (5+ Thn)' },
  ];

  const challenges = data?.data || [];
  const isCompanyOrAdmin = user && (user.role === 'COMPANY' || user.role === 'ADMIN');
  const userProfile = useUserStore((state) => state.user?.profile);
  const isStartupTier = userProfile?.subscriptionTier === 'STARTUP';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4 relative">
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Pilih Tantangan & Buktikan Kinerja Anda
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Selesaikan studi kasus langsung dari perusahaan mitra terkemuka. Setiap pengumpulan akan dievaluasi seketika oleh AI dan diteruskan ke tim rekruter.
        </p>

        {/* Company Action Button */}
        {isCompanyOrAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-6"
          >
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-display font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all group"
            >
              <Plus className="h-5 w-5 flex-shrink-0 group-hover:rotate-90 transition-transform" />
              <span>Rilis Studi Kasus Baru (Manual / AI Generator)</span>
              <Sparkles className="h-4 w-4 text-amber-300 ml-1 flex-shrink-0 animate-pulse" />
            </button>
          </motion.div>
        )}
      </div>

      <ChallengeFilterBar
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        categories={categories}
        difficulties={difficulties}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-dark-card border border-dark-border rounded-3xl h-80 animate-pulse p-6" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-3xl space-y-4">
          <p className="text-base text-red-400 font-medium">Gagal memuat daftar studi kasus.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </div>
      ) : challenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {challenges.map((challenge: any) => (
            <ChallengeCard
              key={challenge.id}
              id={challenge.id}
              slug={challenge.slug}
              title={challenge.title}
              summary={challenge.summary}
              category={challenge.category}
              difficulty={challenge.difficulty}
              type={challenge.type}
              companyName={challenge.type === 'PUBLIC' ? 'Public Challenge' : challenge.company?.companyName || 'Perusahaan Mitra'}
              logoUrl={challenge.company?.logoUrl}
              rewardDescription={challenge.type === 'PUBLIC' ? 'Reward: +50 Tokens & +150 XP' : challenge.rewardDescription}
              deadlineAt={challenge.deadlineAt}
              trustScore={challenge.company?.trustScore}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-3xl space-y-3 max-w-lg mx-auto">
          <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-base text-gray-300 font-semibold">Tidak ada studi kasus yang cocok dengan pencarian Anda.</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Coba gunakan kata kunci lain atau reset filter pencarian di atas untuk melihat seluruh direktori.
          </p>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL RILIS STUDI KASUS (COMPANY/ADMIN) */}
      {/* ======================================= */}
      <CreateChallengeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => refetch()}
        isStartupTier={!!isStartupTier}
      />
    </div>
  );
}
