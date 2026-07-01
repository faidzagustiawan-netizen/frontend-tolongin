'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfoliosService } from '../../services/portfolios.service';
import { useUserStore } from '../../store/userStore';
import { Trophy, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

import { LeaderboardFilterBar } from '../../components/leaderboard/LeaderboardFilterBar';
import { Podium } from '../../components/leaderboard/Podium';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';

const RANKS = [
  { minLevel: 1, maxLevel: 1, name: 'Bronze', color: 'text-[#CD7F32]', border: 'border-[#CD7F32]/50', bg: 'bg-[#CD7F32]/10' },
  { minLevel: 2, maxLevel: 2, name: 'Silver', color: 'text-gray-300', border: 'border-gray-300/50', bg: 'bg-gray-400/10' },
  { minLevel: 3, maxLevel: 3, name: 'Gold', color: 'text-yellow-400', border: 'border-yellow-400/50', bg: 'bg-yellow-400/10' },
  { minLevel: 4, maxLevel: 4, name: 'Platinum', color: 'text-teal-300', border: 'border-teal-300/50', bg: 'bg-teal-300/10' },
  { minLevel: 5, maxLevel: 5, name: 'Diamond', color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10' },
  { minLevel: 6, maxLevel: 99, name: 'Grandmaster', color: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-400/10' },
];

const CATEGORIES = ['All Roles', 'Frontend', 'Backend', 'UI/UX', 'Data Science'];
const REGIONS = ['Global', 'Indonesia', 'Jakarta', 'Bandung', 'Yogyakarta'];

export default function LeaderboardPage() {
  const { user } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState('All Roles');
  const [selectedRegion, setSelectedRegion] = useState('Global');
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => portfoliosService.getLeaderboard(50),
  });

  const rawLeaderboard = data?.data || [];

  const getRankInfo = (level: number) => {
    return RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];
  };

  // Mocking filtering since backend doesn't have region and precise roles
  const filteredLeaderboard = rawLeaderboard.filter((talent: any) => {
    if (selectedCategory === 'All Roles') return true;
    const skills = (talent.skills || []).join(' ').toLowerCase();
    if (selectedCategory === 'Frontend') return skills.includes('react') || skills.includes('next') || skills.includes('frontend');
    if (selectedCategory === 'Backend') return skills.includes('node') || skills.includes('nest') || skills.includes('backend') || skills.includes('go') || skills.includes('postgres');
    if (selectedCategory === 'UI/UX') return skills.includes('figma') || skills.includes('design') || skills.includes('ui');
    if (selectedCategory === 'Data Science') return skills.includes('python') || skills.includes('data') || skills.includes('ai') || skills.includes('llm');
    return true;
  }).map((talent: any, index: number) => ({
    ...talent,
    mockRegion: index % 3 === 0 ? 'Jakarta' : index % 3 === 1 ? 'Bandung' : 'Yogyakarta'
  })).filter((talent: any) => {
    if (selectedRegion === 'Global' || selectedRegion === 'Indonesia') return true;
    return talent.mockRegion === selectedRegion;
  });

  const topThree = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-200">Global Tech Talent Ranking</span>
        </motion.div>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
          Arena <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Peringkat</span> Talenta
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Peringkat dihitung dari kontribusi nyata (XP) melalui penyelesaian studi kasus perusahaan. Jadilah standar industri yang baru.
        </p>
      </div>

      <LeaderboardFilterBar
        categories={CATEGORIES}
        regions={REGIONS}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />

      {isLoading ? (
        <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-dark-card border border-dark-border rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl max-w-4xl mx-auto space-y-3">
          <p className="text-base text-red-400 font-medium">Gagal memuat papan peringkat.</p>
        </div>
      ) : filteredLeaderboard.length > 0 ? (
        <>
          <Podium topThree={topThree} />
          {remaining.length > 0 && (
            <LeaderboardTable
              leaderboard={remaining}
              currentUserEmail={user?.email}
              getRankInfo={getRankInfo}
              startIndex={3}
            />
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-2xl max-w-4xl mx-auto space-y-3">
          <Filter className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-base text-gray-300 font-semibold">Tidak ada talenta yang cocok dengan filter.</p>
          <p className="text-xs text-gray-500">Coba ubah filter kategori atau region Anda.</p>
        </div>
      )}
    </div>
  );
}
