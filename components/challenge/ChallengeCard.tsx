import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Award, Building2, ChevronRight, Briefcase, Lock, CheckCircle2, Clock, Bookmark, BadgeCheck } from 'lucide-react';
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
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'INTERMEDIATE':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'ADVANCED':
        return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
    }
  };

  const getCategoryColor = (cat: string) => {
    return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace('_', ' ');
  };

  const daysLeft = deadlineAt ? Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const daysUntilStart = startsAt ? Math.max(0, Math.ceil((new Date(startsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  let timeStatusText = daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} hari tersisa` : 'Ditutup') : null;
  if (isUpcoming && daysUntilStart !== null) {
    timeStatusText = `Mulai dalam ${daysUntilStart} hari`;
  }
  if (isCompleted) {
    timeStatusText = 'Selesai / Ditutup';
  }

  // Fallback values since deadline might be empty or we want to match the design EXACTLY for the date format.
  const formattedDate = deadlineAt 
    ? `berakhir ${new Date(deadlineAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`
    : timeStatusText || 'Tenggat waktu tidak ditentukan';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-white dark:bg-card border ${isCompleted ? 'border-border/50 opacity-80' : 'border-border hover:border-emerald-500/50'} rounded-[24px] p-4 sm:p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all flex flex-col justify-between h-full group`}
    >
      <div className="space-y-4">
        
        {/* Top Header: Logo + Title + Company Name */}
        <div className="flex gap-4 items-start">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white dark:bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-emerald-800 dark:text-emerald-500" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col gap-1.5 pt-0.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#546E7A] dark:text-muted-foreground">
                {companyName}
              </span>
              {type === 'COMPANY' ? (
                <span title="Perusahaan Resmi" className="inline-flex">
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 ml-1">
                  Talenta
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Info Box */}
        <div className="rounded-2xl p-4 sm:p-5 border bg-[#E8F5E9]/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10 space-y-4">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>72 jam (Estimasi)</span>
            </div>
            {rewardDescription && (
              <div className="flex items-center gap-2.5 text-sm font-bold text-amber-500 w-fit">
                <Award className="h-4 w-4 flex-shrink-0" />
                <span>{rewardDescription}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-3 pt-4 mt-auto">
        <button className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors flex-shrink-0 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30">
          <Bookmark className="h-4 w-4" />
        </button>

        <div className="flex-grow">
          {isUpcoming ? (
            <div className="w-full h-10 rounded-full text-sm font-bold bg-muted text-muted-foreground cursor-not-allowed flex items-center justify-center">
              Mulai (Terkunci) <Lock className="h-4 w-4 ml-2" />
            </div>
          ) : isCompleted ? (
            <Link href={`/challenges/${slug}`} className="w-full h-10 rounded-full text-sm font-bold bg-[#00C853] hover:bg-[#00C853]/90 text-white flex items-center justify-center transition-colors">
              Lihat Detail <CheckCircle2 className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <Link href={`/challenges/${slug}`} className="w-full h-10 rounded-full text-sm font-bold bg-[#1E7F4D] hover:bg-[#1E7F4D]/90 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-[1.02]">
              Lihat selengkapnya
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};
