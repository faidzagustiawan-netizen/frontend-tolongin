'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfoliosService } from '../../services/portfolios.service';
import { skillsService } from '../../services/skills.service';
import { useUserStore } from '../../store/userStore';
import { Trophy, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Podium } from '../../components/leaderboard/Podium';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import { FadeIn, StaggerContainer, StaggerItem } from '../../components/animations';

const RANKS = [
  { minLevel: 1, maxLevel: 1, name: 'Bronze', color: 'text-[#CD7F32]', border: 'border-[#CD7F32]/50', bg: 'bg-[#CD7F32]/10' },
  { minLevel: 2, maxLevel: 2, name: 'Silver', color: 'text-muted-foreground', border: 'border-gray-300/50', bg: 'bg-gray-400/10' },
  { minLevel: 3, maxLevel: 3, name: 'Gold', color: 'text-yellow-400', border: 'border-yellow-400/50', bg: 'bg-yellow-400/10' },
  { minLevel: 4, maxLevel: 4, name: 'Platinum', color: 'text-teal-300', border: 'border-teal-300/50', bg: 'bg-teal-300/10' },
  { minLevel: 5, maxLevel: 5, name: 'Diamond', color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10' },
  { minLevel: 6, maxLevel: 99, name: 'Grandmaster', color: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-400/10' },
];

/** Menampilkan seluruh bidang; bukan nilai yang pernah dikirim ke server. */
const ALL_ROLES = 'Semua Bidang';
/** Menampilkan seluruh wilayah; bukan nilai `location` milik siapa pun. */
const ALL_REGIONS = 'Semua Wilayah';

export default function LeaderboardPage() {
  const { user } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState(ALL_ROLES);
  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS);

  /**
   * Bidang diambil dari direktori keahlian — sumber yang sama dengan yang
   * dipakai `<select>` di profil talenta dan pemilih kategori di pembuatan
   * studi kasus.
   *
   * Sebelumnya daftar ini ditulis tangan di berkas ini ("Frontend
   * Engineering", "Backend & API", ...) sementara profil menyimpan "Frontend"
   * dan "Backend". Tidak satu pun cocok, jadi setiap penyaringan kategori
   * mengosongkan papan peringkat.
   */
  const { data: categories } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => skillsService.listCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    // Kategori ikut kunci: penyaringan dikerjakan server, jadi ganti bidang
    // berarti permintaan baru — bukan menyaring ulang 50 baris yang sama.
    queryKey: ['leaderboard', selectedCategory],
    queryFn: () =>
      portfoliosService.getLeaderboard({
        limit: 50,
        roleCategory:
          selectedCategory === ALL_ROLES ? undefined : selectedCategory,
      }),
  });

  const rawLeaderboard = useMemo(() => data?.data ?? [], [data]);

  const getRankInfo = (level: number) => {
    return RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];
  };

  const categoryOptions = useMemo(
    () => [ALL_ROLES, ...(categories ?? []).map((c) => c.name)],
    [categories],
  );

  /**
   * Wilayah disimpulkan dari baris yang benar-benar ada, bukan daftar tetap.
   *
   * `location` adalah ruas teks bebas di profil, jadi tidak ada himpunan nilai
   * sah yang bisa ditulis di muka — daftar tetap yang lama ("Jakarta",
   * "Bandung", "Yogyakarta") meleset dari apa pun yang diketik talenta.
   */
  const regionOptions = useMemo(() => {
    const found = new Set<string>();
    for (const talent of rawLeaderboard) {
      const location = talent.location?.trim();
      if (location) found.add(location);
    }
    return [ALL_REGIONS, ...Array.from(found).sort((a, b) => a.localeCompare(b))];
  }, [rawLeaderboard]);

  // Wilayah disaring di peramban: pilihannya sendiri berasal dari hasil ini,
  // jadi menyaringnya di server akan mempersempit daftar pilihan sampai hanya
  // menyisakan yang sedang dipilih.
  const filteredLeaderboard = useMemo(
    () =>
      selectedRegion === ALL_REGIONS
        ? rawLeaderboard
        : rawLeaderboard.filter((talent) => talent.location === selectedRegion),
    [rawLeaderboard, selectedRegion],
  );

  const topThree = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 font-jakarta font-[family-name:var(--font-plus-jakarta)]">
      {/* Hero Section Title & Description aligned to left edge of max-w-5xl table */}
      <div className="max-w-5xl mx-auto w-full text-left space-y-4">
        <h1 className="font-jakarta text-4xl sm:text-6xl font-bold text-foreground tracking-tight">
          Leaderboard
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl max-w-4xl mx-auto space-y-3">
          <p className="text-base text-red-400 font-medium">Gagal memuat papan peringkat.</p>
        </div>
      ) : (
        <div className="relative max-w-5xl mx-auto space-y-0">
          {/* Podium section: Smooth height expansion/collapse without fixed min-h layout jank */}
          <AnimatePresence>
            {topThree.length >= 3 && (
              <motion.div
                key="podium-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden relative z-10"
              >
                <Podium topThree={topThree} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Leaderboard Table Box */}
          <LeaderboardTable
            fullLeaderboard={filteredLeaderboard}
            currentUser={user}
            getRankInfo={getRankInfo}
            categories={categoryOptions}
            regions={regionOptions}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            hasPodium={topThree.length >= 3}
          />
        </div>
      )}
    </div>
  );
}
