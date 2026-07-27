import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, Lock, CheckCircle2, Bookmark, BadgeCheck, Coins, Zap, User } from 'lucide-react';
import { Button } from '../common/Button';

export interface ChallengeCardProps {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  companyName: string;
  logoUrl?: string;
  rewardDescription?: string;
  deadlineAt?: string;
  type?: 'COMPANY' | 'PUBLIC';
  trustScore?: number;
  isUpcoming?: boolean;
  startsAt?: string;
  isCompleted?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  slug,
  title,
  summary,
  category,
  difficulty,
  companyName,
  logoUrl,
  rewardDescription,
  deadlineAt,
  type = 'COMPANY',
  trustScore,
  isUpcoming = false,
  startsAt,
  isCompleted = false,
}) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'BEGINNER':
        return 'text-white bg-[#A16207] border-transparent';
      case 'INTERMEDIATE':
        return 'text-white bg-[#DB2777] border-transparent';
      case 'ADVANCED':
        return 'text-white bg-[#991B1B] border-transparent';
      default:
        return 'text-white bg-gray-500 border-transparent';
    }
  };

  const getCategoryColor = (cat: string) => {
    return 'text-foreground bg-white dark:bg-card border-border';
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace('_', ' ');
  };

  const daysLeft = deadlineAt ? Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const daysUntilStart = startsAt ? Math.max(0, Math.ceil((new Date(startsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  let deadlineText = daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} hari tersisa` : 'Ditutup') : 'Tenggat waktu tidak ditentukan';
  if (isCompleted) {
    deadlineText = 'Selesai / Ditutup';
  } else if (isUpcoming && daysUntilStart !== null) {
    deadlineText = `Mulai dalam ${daysUntilStart} hari`;
  }

  // Remove generic prefixes from reward if they exist
  let cleanReward = rewardDescription ? rewardDescription.replace(/^(sistem reward|bounty|reward)[:\s-]*/i, '').trim() : '';
  cleanReward = cleanReward.replace(/^(hingga)[:\s-]*/i, '').trim();

  // Render reward string dynamically replacing Token and XP with icons
  const renderReward = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(Token|XP)/i);
    return (
      <span className="flex items-center flex-wrap">
        {parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          if (lowerPart === 'token') {
            return <Coins key={index} className="h-5 w-5 inline-block mx-1.5" />;
          }
          if (lowerPart === 'xp') {
            return <Zap key={index} className="h-5 w-5 inline-block mx-1.5" />;
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const theme = type === 'COMPANY' ? {
    bgClass: 'bg-[#3B3669]',
    rewardClass: 'text-[#3B3669] dark:text-[#615FFF] font-extrabold',
    btnClass: 'bg-white border border-[#3B3669] text-[#3B3669] hover:bg-[#3B3669] hover:text-white dark:bg-card dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white shadow-sm',
    bookmarkBtnClass: 'bg-[#3B3669] border-transparent text-white hover:bg-[#3B3669]/80 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm',
    cardBorderHoverClass: 'group-hover:border-[#3B3669]/30 dark:group-hover:border-indigo-500/30',
    cardBgClass: 'bg-[#3B3669]/10 dark:bg-[#3B3669]/20',
  } : {
    bgClass: 'bg-[#1E7F4D]',
    rewardClass: 'text-[#1E7F4D] dark:text-[#00BC7D] font-extrabold',
    btnClass: 'bg-white border border-[#1E7F4D] text-[#1E7F4D] hover:bg-[#1E7F4D] hover:text-white dark:bg-card dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white shadow-sm',
    bookmarkBtnClass: 'bg-[#1E7F4D] border-transparent text-white hover:bg-[#1E7F4D]/80 dark:bg-emerald-500 dark:hover:bg-emerald-400 shadow-sm',
    cardBorderHoverClass: 'group-hover:border-[#1E7F4D]/30 dark:group-hover:border-emerald-500/30',
    cardBgClass: 'bg-[#1E7F4D]/10 dark:bg-[#1E7F4D]/20',
  };

  return (
    <motion.div
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
          style={{ background: `radial-gradient(circle at top right, ${type === 'COMPANY' ? '#3B3669' : '#1E7F4D'}, transparent 70%)` }} 
        />

        {/* 1 & 2. Judul (Fixed height for 2 lines max) */}
        <div className="relative h-14 sm:h-16 mb-2 z-10">
          <h3 className="text-lg sm:text-[1.2rem] font-extrabold text-foreground leading-snug line-clamp-2">
            {title}
          </h3>
        </div>

        {/* 3. Reward (Fixed height 1 line) */}
        <div className="h-7 mb-1.5 flex items-center">
          {cleanReward ? (
            <div className={`flex items-center text-base sm:text-lg font-extrabold ${theme.rewardClass}`}>
              {renderReward(cleanReward)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          )}
        </div>

        {/* 4. Deadline (Fixed height 1 line) */}
        <div className="h-5 mb-2.5 flex items-center">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
            {deadlineText}
          </span>
        </div>

        {/* 5. Deskripsi (Fixed height 1 line, truncate with ...) */}
        <div className="h-5 mb-4 flex items-center">
          {summary ? (
            <p className="text-base text-foreground font-semibold truncate">
              {summary}
            </p>
          ) : (
            <p className="text-base text-muted-foreground italic truncate">Tidak ada deskripsi</p>
          )}
        </div>

        {/* 6. Role dan Level Tags (Fixed height 1 line) */}
        <div className="h-7 mb-5 flex items-center gap-2 overflow-hidden">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getCategoryColor(category)}`}>
            {getCategoryLabel(category)}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          {type === 'COMPANY' && trustScore !== undefined && trustScore < 70 && (
             <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
               Lambat Merespons
             </span>
          )}
        </div>

        {/* 7. Divider */}
        <div className="border-t border-border w-full mb-4" />

        {/* 8. Profil Uploader */}
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

        {/* 9. Footer Buttons */}
        <div className="h-12 sm:h-10 flex items-center mt-auto">
          <div className="w-full h-12 sm:h-10">
            {isUpcoming ? (
              <div className="w-full h-full rounded-full text-sm font-bold bg-muted text-muted-foreground cursor-not-allowed flex items-center justify-center">
                Mulai (Terkunci) <Lock className="h-4 w-4 ml-2" />
              </div>
            ) : isCompleted ? (
              <Link href={`/challenges/${slug}`} className="w-full h-full rounded-full text-sm font-bold bg-[#00C853] hover:bg-[#00C853]/90 text-white flex items-center justify-center transition-colors">
                Lihat Detail <CheckCircle2 className="h-4 w-4 ml-2" />
              </Link>
            ) : (
              <Link href={`/challenges/${slug}`} className={`w-full h-full rounded-full text-sm font-bold flex items-center justify-center transition-all hover:scale-[1.02] ${theme.btnClass}`}>
                Lihat selengkapnya
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
