import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Award, Building2, ChevronRight, Briefcase } from 'lucide-react';
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
}) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'JUNIOR':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'MEDIOR':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'SENIOR':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace('_', ' ');
  };

  const daysLeft = deadlineAt ? Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-dark-card border border-border hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col justify-between h-full group"
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              {logoUrl ? (
                <Image src={logoUrl} alt={companyName} fill sizes="48px" className="object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-gray-400 relative z-10" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">
                  {companyName}
                </h4>
                {type === 'PUBLIC' && (
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    PUBLIC
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {getCategoryLabel(category)}
                </span>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor(difficulty)}`}>
                  {difficulty}
                </span>
                {type === 'COMPANY' && trustScore !== undefined && trustScore < 70 && (
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400" title="Perusahaan ini terdeteksi lambat dalam memberikan umpan balik (SLA Timeout)">
                    LAMBAT MERESPONS
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed">
          {summary}
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-dark-border/60">
        <div className="flex items-center justify-between text-xs text-gray-400">
          {rewardDescription && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium max-w-[60%] truncate">
              <Award className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{rewardDescription}</span>
            </div>
          )}
          {daysLeft !== null && (
            <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{daysLeft > 0 ? `${daysLeft} hari lagi` : 'Ditutup'}</span>
            </div>
          )}
        </div>

        <Link href={`/challenges/${slug}`} className="block w-full">
          <Button variant="outline" className="w-full justify-between group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-md">
            <span>Lihat Detail Studi Kasus</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
