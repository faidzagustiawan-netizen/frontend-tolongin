import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { LeaderboardEntry } from '@/services/portfolios.service';

interface PodiumProps {
  topThree: LeaderboardEntry[];
}

const PodiumItem = ({ item, rank, delay }: { item: LeaderboardEntry; rank: number; delay: number }) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/20 text-yellow-400';
      case 2: return 'bg-gray-300/20 text-gray-300';
      case 3: return 'bg-[#CD7F32]/20 text-[#CD7F32]';
      default: return '';
    }
  };

  const getPodiumImg = (rank: number) => `/images/leaderboard/podium-${rank}.png`;

  // Rank 1 (center) is z-20 (in front), Rank 2 (left) and Rank 3 (right) are z-10 (behind)
  const zIndexStyle = rank === 1 ? 'z-20' : 'z-10';

  // Vertical position adjustment: 1 higher, 2 stays same, 3 lower below 2
  const verticalOffset = rank === 1 
    ? '-translate-y-4 sm:-translate-y-6' 
    : rank === 2 
    ? 'translate-y-0' 
    : 'translate-y-6 sm:translate-y-10';

  // Avatar size per rank
  const avatarSize = rank === 1 
    ? 'h-20 w-20 sm:h-24 sm:w-24' 
    : rank === 2 
    ? 'h-16 w-16 sm:h-20 sm:w-20' 
    : 'h-14 w-14 sm:h-18 sm:w-18';

  // ClipPath trims pointer-events hitboxes to the exact green pillar shapes
  // so overlapping margins don't steal clicks or trigger empty space hover
  const getClipPath = (rank: number) => {
    switch (rank) {
      case 1: return 'polygon(18% 0, 82% 0, 82% 100%, 18% 100%)';
      case 2: return 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%)';
      case 3: return 'polygon(0 0, 85% 0, 85% 100%, 0 100%)';
      default: return 'none';
    }
  };

  return (
    // Outer wrapper: flex column container for layout width positioning
    <div className={`flex flex-col items-center justify-end w-36 sm:w-56 md:w-64 ${zIndexStyle} pointer-events-none`}>
      <motion.div
        initial={{ opacity: 0, y: 70 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 70 }}
        transition={{ duration: 0.65, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-end w-full relative pointer-events-none"
      >
        {/* 
          Single Unified Link with CSS clipPath trimming phantom click zones
        */}
        <Link
          href={`/talents/${item.slug || item.userId}`}
          className="flex flex-col items-center justify-end w-full group pointer-events-auto pt-6 sm:pt-10"
          style={{ clipPath: getClipPath(rank) }}
        >
          {/* User Info Above Podium */}
          <div className={`flex flex-col items-center mb-2 sm:mb-3 z-30 text-center px-1 transition-transform duration-300 ${verticalOffset}`}>
            {/* Avatar */}
            <div className="relative mb-1.5 sm:mb-2 overflow-visible">
              {/* Rank Badge */}
              <div className={`
                h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center
                font-bold text-xs sm:text-sm absolute -top-1 -right-2 sm:-top-1.5 sm:-right-3 z-40
                ${getRankBadge(rank)}
              `}>
                {rank === 1 ? <Trophy className="h-4 w-4 sm:h-5 sm:w-5" /> : <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </div>

              {/* Profile picture - bg white/black per theme */}
              <div className={`
                relative rounded-full ${avatarSize} overflow-hidden shadow-xl
                bg-white dark:bg-black
                flex items-center justify-center
                group-hover:scale-110 group-hover:ring-4 group-hover:ring-[#00BC7D]/40 transition-all duration-300
              `}>
                {item.avatarUrl ? (
                  <Image src={item.avatarUrl} alt={item.fullName} fill className="object-cover" />
                ) : (
                  <User className="h-7 w-7 sm:h-10 sm:w-10 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>

            {/* Name: black lightmode, white darkmode */}
            <h4 className="
              font-bold text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-[150px]
              text-black dark:text-white
              group-hover:text-emerald-600 dark:group-hover:text-emerald-300
              transition-colors drop-shadow-sm
            ">
              {item.fullName}
            </h4>

            {/* Level & XP Badges Row */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {/* Level Circle */}
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white border border-[#00BC7D] text-[#00BC7D] text-[10px] sm:text-xs font-extrabold flex items-center justify-center shadow-sm flex-shrink-0">
                {item.level || 1}
              </div>

              {/* XP Badge */}
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs bg-[#00BC7D] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md text-white font-bold group-hover:bg-[#00a870] transition-colors">
                <Zap className="h-3 w-3 text-white fill-white" />
                <span>{item.xp}</span>
              </div>
            </div>
          </div>

          {/* Original Podium PNG Image - Unified Hover & Attached */}
          <div className="w-full relative flex items-end justify-center" style={{ lineHeight: 0 }}>
            <img
              src={getPodiumImg(rank)}
              alt={`Podium ${rank}`}
              className="w-32 sm:w-48 md:w-56 h-auto object-contain max-h-[220px] sm:max-h-[320px] drop-shadow-xl scale-125 origin-bottom transition-all duration-300 group-hover:-translate-y-2 group-hover:brightness-110 group-hover:drop-shadow-[0_12px_24px_rgba(0,188,125,0.35)]"
            />
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export const Podium = ({ topThree }: PodiumProps) => {
  if (!topThree || topThree.length < 3) return null;

  return (
    <div className="flex items-end justify-center max-w-4xl mx-auto -mt-6 sm:-mt-8 mb-4 px-4 pt-2 sm:pt-4 -space-x-20 sm:-space-x-32 md:-space-x-33 relative z-10">
      {/* Rank 2 (Left) - Delay 0.3s */}
      {topThree[1] && <PodiumItem item={topThree[1]} rank={2} delay={0.3} />}
      
      {/* Rank 1 (Middle) - Delay 0.1s (Slides up first!) */}
      {topThree[0] && <PodiumItem item={topThree[0]} rank={1} delay={0.1} />}
      
      {/* Rank 3 (Right) - Delay 0.5s */}
      {topThree[2] && <PodiumItem item={topThree[2]} rank={3} delay={0.5} />}
    </div>
  );
};
