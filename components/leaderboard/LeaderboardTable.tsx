import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, MapPin, Zap, User, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface RankInfo {
  minLevel: number;
  maxLevel: number;
  name: string;
  color: string;
  border: string;
  bg: string;
}

interface LeaderboardTableProps {
  leaderboard: any[];
  currentUserEmail?: string;
  getRankInfo: (level: number) => RankInfo;
  startIndex?: number;
}

export const LeaderboardTable = ({ leaderboard, currentUserEmail, getRankInfo, startIndex = 0 }: LeaderboardTableProps) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400 shadow-yellow-400/20 shadow-lg scale-110 z-10';
      case 2: return 'bg-gray-300/20 border-gray-300/50 text-gray-300 shadow-gray-300/10 scale-105';
      case 3: return 'bg-[#CD7F32]/20 border-[#CD7F32]/50 text-[#CD7F32] shadow-[#CD7F32]/10 scale-105';
      default: return 'bg-white/5 border-white/10 text-gray-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 relative">
      <AnimatePresence>
        {leaderboard.map((talent: any, index: number) => {
          const rank = startIndex + index + 1;
          const rankInfo = getRankInfo(talent.level || 1);
          const isCurrentUser = currentUserEmail && currentUserEmail === talent.user?.email;

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
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                    {talent.avatarUrl ? (
                      <Image src={talent.avatarUrl} alt={talent.fullName} fill sizes="64px" className="object-cover" />
                    ) : (
                      <User className="relative z-10 h-6 w-6 text-gray-400" />
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
  );
};
