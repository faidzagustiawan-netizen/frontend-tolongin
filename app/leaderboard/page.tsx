'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfoliosService } from '../../services/portfolios.service';
import { useUserStore } from '../../store/userStore';
import { Trophy, Award, User, Medal, Zap, Filter, MapPin, Globe, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400 shadow-yellow-400/20 shadow-lg scale-110 z-10';
      case 2: return 'bg-gray-300/20 border-gray-300/50 text-gray-300 shadow-gray-300/10 scale-105';
      case 3: return 'bg-[#CD7F32]/20 border-[#CD7F32]/50 text-[#CD7F32] shadow-[#CD7F32]/10 scale-105';
      default: return 'bg-white/5 border-white/10 text-gray-400';
    }
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

      {/* Gamification Filters */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col w-full sm:w-auto gap-2">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-cyan-400" /> Kategori Spesialisasi
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                  : 'bg-dark-bg border-dark-border text-gray-400 hover:text-white hover:border-emerald-500/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full sm:w-auto gap-2 border-t sm:border-t-0 sm:border-l border-dark-border pt-4 sm:pt-0 sm:pl-6">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-emerald-400" /> Region / Wilayah
          </label>
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            {REGIONS.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
      </div>

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
        <div className="max-w-5xl mx-auto space-y-4 relative">
          <AnimatePresence>
            {filteredLeaderboard.map((talent: any, index: number) => {
              const rank = index + 1;
              const rankInfo = getRankInfo(talent.level || 1);
              const isCurrentUser = user && user.email === talent.user?.email;

              return (
                <motion.div
                  key={talent.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`bg-dark-card border-2 hover:border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 transition-all relative overflow-hidden ${
                    isCurrentUser ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-dark-border'
                  }`}
                >
                  {isCurrentUser && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                  )}

                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border flex items-center justify-center font-display font-bold text-lg sm:text-xl flex-shrink-0 ${getRankBadge(rank)}`}>
                      {rank === 1 ? <Trophy className="h-6 w-6 sm:h-7 sm:w-7" /> : rank === 2 ? <Medal className="h-6 w-6 sm:h-7 sm:w-7" /> : rank === 3 ? <Medal className="h-5 w-5 sm:h-6 sm:w-6" /> : `#${rank}`}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                        {talent.avatarUrl ? (
                          <img src={talent.avatarUrl} alt={talent.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-base sm:text-lg font-bold ${isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                            {talent.fullName} {isCurrentUser && '(Anda)'}
                          </h4>
                          {talent.faceVerificationStatus === 'VERIFIED' && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {talent.mockRegion || 'Global'}</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${rankInfo.bg} ${rankInfo.border} ${rankInfo.color}`}>
                            {rankInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-8 bg-dark-bg sm:bg-transparent border border-dark-border sm:border-none rounded-xl p-4 sm:p-0 w-full sm:w-auto">
                    <div className="text-center">
                      <p className="text-2xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{talent.level || 1}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Level</p>
                    </div>
                    <div className="w-px h-8 bg-dark-border hidden sm:block" />
                    <div className="text-center">
                      <p className="text-2xl font-display font-extrabold text-white flex items-center justify-center gap-1">
                        <Zap className="h-5 w-5 text-amber-400 flex-shrink-0" />
                        {talent.xp || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Experience</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
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
