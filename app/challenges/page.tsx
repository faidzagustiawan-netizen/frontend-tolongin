'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { challengesService } from '../../services/challenges.service';
import { useUserStore } from '../../store/userStore';
import { ChallengeCard } from '../../components/challenge/ChallengeCard';
import { Button } from '../../components/common/Button';
import { Briefcase, RefreshCw, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '../../components/animations';

import { CreateChallengeModal } from '../../components/challenge/CreateChallengeModal';
import { ChallengeFilterBar } from '../../components/challenge/ChallengeFilterBar';

const CATEGORIES = [
  { id: 'UI_UX', name: 'UI/UX Design' },
  { id: 'FRONTEND', name: 'Frontend Engineering' },
  { id: 'BACKEND', name: 'Backend & API' },
  { id: 'DATA_SCIENCE', name: 'Data Science & AI' },
  { id: 'MARKETING', name: 'Digital Marketing & SEO' },
  { id: 'PRODUCT', name: 'Product Management' },
];

const DIFFICULTIES = [
  { id: 'BEGINNER', name: 'Beginner' },
  { id: 'INTERMEDIATE', name: 'Intermediate' },
  { id: 'ADVANCED', name: 'Advanced' },
];

const PUBLISHERS = [
  { id: 'COMPANY', name: 'Perusahaan' },
  { id: 'PUBLIC', name: 'Talenta' },
];

/**
 * Membangun deretan nomor halaman dengan elipsis, agar jumlah tombol tetap
 * konstan berapa pun banyaknya halaman. Sebelumnya seluruh nomor dirender
 * sekaligus — 500 studi kasus berarti 56 tombol berjejer dalam satu baris.
 */
function buildPageWindow(current: number, total: number): (number | 'gap')[] {
  const safeCurrent = Math.min(total, Math.max(1, current));
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, safeCurrent - 1);
  const end = Math.min(total - 1, safeCurrent + 1);

  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('gap');

  pages.push(total);
  return pages;
}

export default function ChallengesDirectoryPage() {
  const { user, loadUserFromStorage } = useUserStore();

  // Search & Multi-Select Filters State (Default is ALL selected)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES.map(c => c.id));
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(DIFFICULTIES.map(d => d.id));
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>(PUBLISHERS.map(p => p.id));
  const [sortBy, setSortBy] = useState<string>('TERBARU'); // 'TERBARU' | 'TERLAMA'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      // Event resize menyala tiap piksel saat jendela diseret. Tanpa peredam,
      // setiap frame memicu setState dan memaksa render ulang seluruh grid.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setItemsPerPage(window.innerWidth < 768 ? 4 : 9);
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // 250 ms sudah cukup untuk menahan ketikan beruntun tanpa terasa lambat.
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, selectedDifficulties, selectedPublishers, sortBy, itemsPerPage]);

  // Filter dan penomoran halaman dikerjakan di server. Sebelumnya seluruh
  // direktori diunduh sekaligus lalu disaring di peramban, sehingga muatan
  // permintaan tumbuh sebanding dengan jumlah studi kasus.
  const isAllCategories = selectedCategories.length === CATEGORIES.length;
  const isAllDifficulties = selectedDifficulties.length === DIFFICULTIES.length;
  const isAllPublishers = selectedPublishers.length === PUBLISHERS.length;

  const queryParams = {
    search: debouncedSearch.trim() || undefined,
    // Tidak ada satu pun kotak tercentang diperlakukan sama dengan "semua",
    // mengikuti kebiasaan umum filter. Sebelumnya hasilnya justru kosong dan
    // pengguna harus menebak sendiri kenapa daftarnya hilang.
    category:
      isAllCategories || selectedCategories.length === 0
        ? undefined
        : selectedCategories.join(','),
    difficulty:
      isAllDifficulties || selectedDifficulties.length === 0
        ? undefined
        : selectedDifficulties.join(','),
    challengeType:
      isAllPublishers || selectedPublishers.length === 0
        ? undefined
        : selectedPublishers.join(','),
    sort: sortBy,
    page: currentPage,
    limit: itemsPerPage,
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['challenges', queryParams],
    queryFn: () => challengesService.getAll(queryParams),
    // Data halaman sebelumnya tetap tampil selama halaman baru diambil,
    // sehingga grid tidak berkedip menjadi kerangka kosong tiap pindah halaman.
    placeholderData: (previous) => previous,
  });

  const challenges = data?.data ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const isCompanyOrAdmin = user && (user.role === 'COMPANY' || user.role === 'ADMIN');
  const userProfile = useUserStore((state) => state.user?.profile);
  const isStartupTier = userProfile?.subscriptionTier === 'STARTUP';

  const pageWindow = useMemo(
    () => buildPageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
    // Langsung digulir, tanpa setTimeout. Penundaan sebelumnya membuat konten
    // sudah berganti lebih dulu sementara halaman baru naik setelahnya.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header Section - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start font-jakarta mb-2">
        {/* Left Column: Title */}
        <div className="lg:col-span-7 space-y-3">
          <h1 className="font-jakarta text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-foreground tracking-tight leading-[1.18]">
            Pilih tantangan, buktikan kinerja nyata<span className="text-[#1E7F4D]">.</span>
          </h1>
        </div>

        {/* Right Column: Description + Company Action */}
        <div className="lg:col-span-5 space-y-5 lg:pt-3 max-w-md ml-auto">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            Selesaikan studi kasus nyata dari mitra industri. Dapatkan evaluasi AI seketika dan buka jalan langsung menuju tim rekruter.
          </p>

          {/* Company Action Button */}
          {isCompanyOrAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-1"
            >
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-display font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:scale-105 transition-all group"
              >
                <Plus className="h-4 w-4 flex-shrink-0 group-hover:rotate-90 transition-transform" />
                <span>Rilis Studi Kasus Baru (Manual / AI Generator)</span>
                <Sparkles className="h-4 w-4 text-amber-300 flex-shrink-0 animate-pulse" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <ChallengeFilterBar
        search={search}
        setSearch={setSearch}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        selectedPublishers={selectedPublishers}
        setSelectedPublishers={setSelectedPublishers}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={CATEGORIES}
        difficulties={DIFFICULTIES}
        publishers={PUBLISHERS}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-3xl h-80 animate-pulse p-6" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl space-y-4">
          <p className="text-base text-red-400 font-medium">Gagal memuat daftar studi kasus.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </div>
      ) : challenges.length > 0 ? (
        <div className={`space-y-12 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          {/* key sengaja dilepas: sebelumnya berisi gabungan seluruh id kartu,
              sehingga tiap pindah halaman seluruh grid dibongkar-pasang ulang
              alih-alih hanya menukar isinya. */}
          <StaggerContainer key={`page-${currentPage}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challenges.map((challenge: any) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard
                  id={challenge.id}
                  slug={challenge.slug}
                  title={challenge.title}
                  summary={challenge.summary}
                  category={challenge.category}
                  role={challenge.role}
                  difficulty={challenge.difficulty}
                  type={challenge.challengeType}
                  companyName={challenge.challengeType === 'PUBLIC' ? (challenge.creator?.fullName || 'Talenta') : (challenge.company?.companyName || 'Perusahaan Mitra')}
                  logoUrl={challenge.challengeType === 'PUBLIC' ? challenge.creator?.avatarUrl : challenge.company?.logoUrl}
                  rewardDescription={challenge.rewardDescription}
                  deadlineAt={challenge.deadlineAt}
                  trustScore={challenge.company?.trustScore}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl border-border text-foreground hover:bg-[#1E7F4D]/10 hover:text-[#1E7F4D] hover:border-[#1E7F4D]/50 transition-colors"
              >
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1.5 px-4">
                {pageWindow.map((page, i) =>
                  page === 'gap' ? (
                    <span
                      key={`gap-${i}`}
                      className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground select-none"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-label={`Halaman ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page ? 'bg-[#1E7F4D] text-white shadow-md' : 'text-muted-foreground hover:bg-[#1E7F4D]/10 hover:text-[#1E7F4D]'}`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl border-border text-foreground hover:bg-[#1E7F4D]/10 hover:text-[#1E7F4D] hover:border-[#1E7F4D]/50 transition-colors"
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-3xl space-y-3 max-w-lg mx-auto">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-base text-muted-foreground font-semibold">Tidak ada studi kasus yang cocok dengan pencarian Anda.</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
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
