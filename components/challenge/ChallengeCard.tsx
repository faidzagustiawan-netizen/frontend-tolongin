import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Award, Building2, ChevronRight, Briefcase, Lock, CheckCircle2 } from 'lucide-react';
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
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'INTERMEDIATE':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'ADVANCED':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-muted-foreground';
    }
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

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-card border ${isCompleted ? 'border-border/50 opacity-80' : 'border-border hover:border-emerald-500/50'} rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col justify-between h-full group`}
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`relative h-12 w-12 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md ${isCompleted ? 'grayscale' : ''}`}>
              {logoUrl ? (
                <Image src={logoUrl} alt={companyName} fill sizes="48px" className="object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground relative z-10" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                  {companyName}
                </h4>
                {type === 'PUBLIC' ? (
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500">
                    TALENTA
                  </span>
                ) : (
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                    PERUSAHAAN RESMI
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-muted-foreground">
                  {getCategoryLabel(category)}
                </span>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${getDifficultyColor(difficulty)}`}>
                  {difficulty}
                </span>
                {type === 'COMPANY' && trustScore !== undefined && trustScore < 70 && (
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500" title="Perusahaan ini terdeteksi lambat dalam memberikan umpan balik (SLA Timeout)">
                    LAMBAT MERESPONS
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-emerald-500 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
          {summary}
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {rewardDescription && (
            <div className="flex items-center gap-1.5 text-amber-500 font-medium max-w-[60%] truncate">
              <Award className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{rewardDescription}</span>
            </div>
          )}
          {timeStatusText && (
            <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{timeStatusText}</span>
            </div>
          )}
        </div>

        <Link href={`/challenges/${slug}`} className="block w-full">
          {isUpcoming ? (
            <Button variant="outline" className="w-full justify-between bg-muted text-muted-foreground border-border/50 cursor-not-allowed">
              <span>Mulai (Terkunci)</span>
              <Lock className="h-4 w-4" />
            </Button>
          ) : isCompleted ? (
            <Button variant="outline" className="w-full justify-between bg-card text-muted-foreground border-border/50">
              <span>Lihat Detail</span>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full justify-between group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-md">
              <span>Lihat Detail Studi Kasus</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </Link>
      </div>
    </motion.div>
  );
};
