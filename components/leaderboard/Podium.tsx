import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap, User } from 'lucide-react';
import Image from 'next/image';

interface PodiumProps {
  topThree: any[];
}

export const Podium = ({ topThree }: PodiumProps) => {
  if (!topThree || topThree.length < 3) return null;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400 shadow-yellow-400/20';
      case 2: return 'bg-gray-300/20 border-gray-300/50 text-gray-300 shadow-gray-300/10';
      case 3: return 'bg-[#CD7F32]/20 border-[#CD7F32]/50 text-[#CD7F32] shadow-[#CD7F32]/10';
      default: return '';
    }
  };

  const PodiumItem = ({ item, rank, delay }: { item: any; rank: number; delay: number }) => {
    const isFirst = rank === 1;
    const height = rank === 1 ? 'h-48 sm:h-56' : rank === 2 ? 'h-36 sm:h-44' : 'h-28 sm:h-36';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="flex flex-col items-center justify-end flex-1"
      >
        <div className="relative mb-4 flex flex-col items-center">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border flex items-center justify-center font-display font-bold text-lg sm:text-xl absolute -top-4 -right-4 z-20 ${getRankBadge(rank)}`}>
            {rank === 1 ? <Trophy className="h-5 w-5" /> : rank === 2 ? <Medal className="h-5 w-5" /> : <Medal className="h-4 w-4" />}
          </div>
          <div className={`relative rounded-full border-4 ${rank === 1 ? 'border-yellow-400 h-20 w-20 sm:h-24 sm:w-24' : rank === 2 ? 'border-gray-300 h-16 w-16 sm:h-20 sm:w-20' : 'border-[#CD7F32] h-14 w-14 sm:h-16 sm:w-16'} overflow-hidden shadow-xl z-10 bg-dark-bg flex items-center justify-center`}>
            {item.avatarUrl ? (
              <Image src={item.avatarUrl} alt={item.fullName} fill className="object-cover" />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>
        </div>

        <div className={`w-full max-w-[120px] sm:max-w-[160px] mx-auto rounded-t-2xl border-t border-l border-r border-white/10 ${height} flex flex-col items-center justify-start pt-4 px-2 text-center bg-gradient-to-t from-dark-bg ${rank === 1 ? 'to-yellow-400/20' : rank === 2 ? 'to-gray-400/20' : 'to-[#CD7F32]/20'}`}>
          <h4 className="font-bold text-white text-xs sm:text-sm truncate w-full">{item.fullName}</h4>
          <div className="flex items-center justify-center gap-1 mt-1 text-xs">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-gray-300 font-semibold">{item.xp} XP</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider hidden sm:block">Level {item.level}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex items-end justify-center max-w-3xl mx-auto mt-12 mb-16 px-4 gap-2 sm:gap-4">
      {topThree[1] && <PodiumItem item={topThree[1]} rank={2} delay={0.2} />}
      {topThree[0] && <PodiumItem item={topThree[0]} rank={1} delay={0.4} />}
      {topThree[2] && <PodiumItem item={topThree[2]} rank={3} delay={0.6} />}
    </div>
  );
};
