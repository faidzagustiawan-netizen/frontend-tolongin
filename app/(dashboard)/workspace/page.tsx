'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../services/submissions.service';
import { useUserStore } from '../../../store/userStore';
import { Button } from '../../../components/common/Button';
import { Input, Textarea } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import Link from 'next/link';
import {
  Briefcase, CheckCircle2, AlertCircle, RefreshCw, GitBranch, Layout, Globe, Send, Award, Clock, Timer, Lock, FileText,
  Users, Sparkles, Search, Filter, ExternalLink, ChevronRight, User as UserIcon, Building2, AlertTriangle, ArrowRight, Coins, Plus, Activity, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokenService } from '../../../services/tokenService';

export default function WorkspacePage() {
  const { user, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';

  // State untuk Pencarian Studi Kasus
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Query untuk Talenta
  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user && !isCompany,
  });

  const { data: tokenData, refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: !!user && !isCompany,
  });

  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);

  // Query untuk Perusahaan (Challenge Stats)
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['challenge-stats'],
    queryFn: () => submissionsService.getChallengeStats(),
    enabled: !!user && isCompany,
  });

  const enrollments = talentData?.data || [];
  const challenges = statsData?.data || [];

  if (isTalentLoading || isStatsLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-40 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  const calculateSlaStatus = (nearestDate: string | null) => {
    if (!nearestDate) return null;
    const now = new Date();
    const deadline = new Date(nearestDate);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Melewati Batas SLA', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (diffDays <= 2) return { text: `${diffDays} Hari Lagi (Kritis)`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: `${diffDays} Hari Lagi`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  };

  const filteredChallenges = challenges.filter((c: any) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // ==========================================
  // TAMPILAN DASHBOARD PERUSAHAAN (RECRUITER)
  // ==========================================
  if (isCompany) {
    const totalSubs = challenges.reduce((acc: number, curr: any) => acc + curr.stats.totalSubmissions, 0);
    const needReviewSubs = challenges.reduce((acc: number, curr: any) => acc + curr.stats.unreviewedCount, 0);

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#1E7F4D] p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">

  {/* Glow hijau-cyan */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />

          {/* Shape hijau terang */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="
                M38 0
                C55 5 72 18 100 32
                L100 100
                L0 100
                L0 0
                Z
              "
              fill="#1e7f4d"
            />
          </svg>

          {/* Overlay lembut */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight">
              Dashboard Studi Kasus Aktif
            </h1>

            <p className="max-w-2xl text-sm text-white/90 opacity-90 leading-relaxed">
              Pilih studi kasus untuk meninjau dan menilai pekerjaan dari para kandidat.
              Perhatikan peringatan batas SLA agar Trust Score Anda tetap terjaga.
            </p>
          </div>

          {/* Action */}
          <div className="relative z-10 flex flex-col items-end gap-4 flex-shrink-0">

            <Link href="/challenges/create">
              <Button
                size="sm"
                className="bg-white text-[#1E7F4D] hover:bg-gray-100 font-bold shadow-xl flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Buat Studi Kasus Baru
              </Button>
            </Link>

            <Button
              onClick={() => refetchStats()}
              size="sm"
              className="bg-white/15 text-white/90 border border-white/20 hover:bg-white/20 font-bold flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Muat Ulang
            </Button>

          </div>
        </div>

        {/* Recruiter Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Studi Kasus Aktif</p>
              <h3 className="font-display text-3xl font-extrabold text-white mt-1">{challenges.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shadow-inner">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Seluruh Submisi</p>
              <h3 className="font-display text-3xl font-extrabold text-white mt-1">{totalSubs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border border-amber-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-[#1e7f4d] uppercase font-semibold">Menunggu Penilaian</p>
              <h3 className="font-display text-3xl font-extrabold text-[#1e7f4d] mt-1">{needReviewSubs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* Toolbar */}
          <div className="p-4 border-b border-dark-border flex items-center justify-between bg-white/5">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Cari studi kasus..."
                className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-border rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-x-auto">
            {filteredChallenges.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Judul Challenge</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Kandidat</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Antrean Penilaian</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Batas Waktu SLA</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredChallenges.map((challenge: any, index: number) => {
                    const sla = calculateSlaStatus(challenge.stats.nearestSlaDate);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={challenge.id} 
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white max-w-[250px] truncate">{challenge.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{challenge.category.replace('_', ' ')} • {challenge.difficulty}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-white">{challenge.stats.totalSubmissions}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-2 ${challenge.stats.unreviewedCount > 0 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{challenge.stats.unreviewedCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sla ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border ${sla.bg} ${sla.color} ${sla.border}`}>
                              {sla.color === 'text-red-400' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />} 
                              {sla.text}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Tidak ada antrean</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {challenge.status === 'DRAFT' ? (
                            <Link href={`/challenges/create?id=${challenge.id}`}>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 hover:text-amber-300">
                                Lanjutkan Edit Draf <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/workspace/submissions/challenge/${challenge.id}`}>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300">
                                Lihat Kandidat <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Belum ada Challenge</h3>
                <p className="text-sm text-gray-400 max-w-md mb-6">Anda belum membuat studi kasus apa pun, atau kata kunci pencarian tidak cocok.</p>
                <Link href="/challenges/create">
                  <Button>Buat Challenge Sekarang</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN WORKSPACE TALENTA (DAFTAR KARTU)
  // ==========================================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#1E7F4D] p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">

  {/* Glow hijau-cyan */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />

  {/* Shape kanan */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="
              M38 0
              C55 5 72 18 100 32
              L100 100
              L0 100
              L0 0
              Z
            "
            fill="#1e7f4d"
          />
        </svg>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-2">

          <h1 className="font-display text-3xl font-extrabold text-white/90 tracking-tight">
            Workspace Talenta
          </h1>

          <p className="text-sm text-white/90 opacity-90 max-w-xl leading-relaxed">
            Semua tantangan dan studi kasus yang sedang Anda kerjakan atau telah
            selesai dievaluasi akan muncul di sini. Pilih salah satu untuk
            melanjutkan pengerjaan.
          </p>
        </div>

        {/* Right Side */}
        <div className="relative z-10 flex flex-col items-end gap-4 flex-shrink-0">

          {/* Token */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex flex-col items-end">
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
              Saldo Token
            </p>

            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-300" />
              <span className="font-display text-2xl font-extrabold text-white-keep font-mono">
                {tokenData?.tokenBalance || 0}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/challenges/create">
              <Button
                size="sm"
                className="bg-white text-[#1E7F4D] hover:bg-gray-100 font-bold shadow-xl flex items-center gap-2"
              >
                <Code2 className="h-4 w-4" />
                Buat Public Challenge (-50)
              </Button>
            </Link>

            <Link href="/talent/tokens">
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Top-Up Token
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-bg border border-border rounded-3xl p-12 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400 shadow-inner">
            <Briefcase className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl font-bold text-white tracking-tight">Belum Ada Tantangan yang Diambil</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Anda belum berpartisipasi dalam studi kasus mana pun. Eksplorasi tantangan perusahaan sekarang untuk membangun portofolio!
            </p>
          </div>
          <Link href="/challenges">
            <Button size="lg" className="mt-4">
              Cari Tantangan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments.map((enrollment: any) => {
            const isCompleted = enrollment.status === 'COMPLETED' || enrollment.status === 'PASSED';
            const isExpired = enrollment.status === 'EXPIRED';
            const statusColor = isCompleted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                              isExpired ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                              'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

            return (
              <Link key={enrollment.id} href={`/workspace/${enrollment.id}`} className="group">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full hover:border-emerald-500/50 transition-all relative overflow-hidden space-y-6">
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider border ${statusColor}`}>
                        {enrollment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {enrollment.challenge?.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 font-mono">Diambil pada: {new Date(enrollment.startedAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border relative z-10">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                      <Timer className="h-4 w-4" /> Masuk ke LMS
                    </span>
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Top-Up telah dipindahkan ke halaman /talent/tokens */}
    </div>
  );
}
