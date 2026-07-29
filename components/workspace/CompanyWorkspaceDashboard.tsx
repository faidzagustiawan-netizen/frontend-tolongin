'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  Users,
  Activity,
  Search,
  AlertTriangle,
  Clock,
  ChevronRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useUserStore } from '../../store/userStore';
import { getPlan } from '../../lib/plans';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  ARCHIVED: 'bg-foreground/10 text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  PUBLISHED: 'Terbit',
  ARCHIVED: 'Diarsipkan',
};

const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PUBLISHED', label: 'Terbit' },
  { key: 'DRAFT', label: 'Draf' },
  { key: 'ARCHIVED', label: 'Arsip' },
];

/**
 * Dasbor tunggal untuk seluruh studi kasus perusahaan.
 *
 * Sebelumnya isi yang sama disajikan dua kali: tabel di sini dan daftar kartu
 * di /challenges/mine, dua-duanya ada di menu utama. Yang punya angka antrean
 * penilaian hanya tabel ini, sementara yang punya penanda status hanya halaman
 * kartu — jadi rekruter harus membuka keduanya untuk melihat gambaran utuh.
 * Penanda status dan penyaringnya kini ikut ke sini, dan /challenges/mine
 * mengarahkan akun perusahaan ke halaman ini.
 */
export function CompanyWorkspaceDashboard({
  challenges,
}: {
  challenges: any[];
  /** @deprecated React Query yang mengurus kesegaran data. */
  refetchStats?: () => void;
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { user } = useUserStore();

  const isCompanyAdmin = !user?.profile?.isTeamMember || user?.profile?.memberRole === 'ADMIN' || user?.profile?.memberRole === 'OWNER';

  const plan = getPlan(user?.profile?.subscriptionTier as string | undefined);

  const calculateSlaStatus = (nearestDate: string | null) => {
    if (!nearestDate) return null;
    const now = new Date();
    const deadline = new Date(nearestDate);
    const diffDays = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0)
      return {
        text: 'Melewati Batas SLA',
        tone: 'critical' as const,
        className: 'bg-red-500/10 text-red-400 border-red-500/30',
      };
    if (diffDays <= 2)
      return {
        text: `${diffDays} Hari Lagi (Kritis)`,
        tone: 'warning' as const,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    return {
      text: `${diffDays} Hari Lagi`,
      tone: 'ok' as const,
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  };

  const filteredChallenges = useMemo(() => {
    const keyword = searchFilter.toLowerCase();
    return challenges.filter((c: any) => {
      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        c.title?.toLowerCase().includes(keyword) ||
        c.category?.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [challenges, searchFilter, statusFilter]);

  const totalSubs = challenges.reduce(
    (acc: number, c: any) => acc + (c.stats?.totalSubmissions ?? 0),
    0,
  );
  const needReviewSubs = challenges.reduce(
    (acc: number, c: any) => acc + (c.stats?.unreviewedCount ?? 0),
    0,
  );

  // Kuota paket dihitung dari DRAFT + PUBLISHED, persis seperti
  // assertCompanyQuota di backend. Kartu lama memberi judul "Total Studi Kasus
  // Aktif" pada jumlah seluruh challenge termasuk yang sudah diarsipkan.
  const quotaUsed = challenges.filter(
    (c: any) => c.status === 'DRAFT' || c.status === 'PUBLISHED',
  ).length;
  const publishedCount = challenges.filter(
    (c: any) => c.status === 'PUBLISHED',
  ).length;
  const isQuotaFull =
    plan.activeChallengeQuota !== null && quotaUsed >= plan.activeChallengeQuota;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#1E7F4D] p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M38 0 C55 5 72 18 100 32 L100 100 L0 100 L0 0 Z" fill="#1e7f4d" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Studi Kasus Anda
          </h1>
          {/* "Trust Score" dihapus dari kalimat ini: istilah itu tidak pernah
              didefinisikan, ditampilkan, atau dijelaskan di mana pun dalam
              aplikasi. Yang tersisa adalah akibat yang benar-benar nyata. */}
          <p className="max-w-2xl text-sm text-white/90 leading-relaxed">
            Tinjau dan nilai pekerjaan kandidat. Perhatikan peringatan batas SLA
            agar kandidat tidak menunggu hasil terlalu lama.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 flex-shrink-0">
          <Link href="/challenges/create">
            <Button
              size="sm"
              className="bg-white text-[#1E7F4D] hover:bg-gray-100 font-bold shadow-xl flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              Buat Studi Kasus Baru
            </Button>
          </Link>
          <Link href="/company/submissions">
            <Button
              size="sm"
              className="bg-white/15 text-white border border-white/20 hover:bg-white/25 font-bold flex items-center gap-2"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Semua Kandidat
            </Button>
          </Link>
          <Link href="/company/team">
            <Button
              size="sm"
              className="bg-white/15 text-white border border-white/20 hover:bg-white/25 font-bold flex items-center gap-2"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Kelola Tim
            </Button>
          </Link>
        </div>
      </div>

      {/* Daftar langkah untuk perusahaan yang baru disetujui.
          Sebelumnya dasbor perusahaan baru hanya menampilkan tiga angka nol
          tanpa memberi tahu apa langkah pertamanya. */}
      {challenges.length === 0 && (
        <section
          aria-labelledby="onboarding-heading"
          className="bg-card border border-border rounded-2xl p-6 sm:p-8"
        >
          <h2
            id="onboarding-heading"
            className="font-display text-xl font-bold text-foreground mb-1"
          >
            Tiga langkah menuju kandidat pertama
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Perkiraan waktu total sekitar 15 menit.
          </p>

          <ol className="space-y-4 list-none p-0">
            {[
              {
                title: 'Lengkapi profil perusahaan',
                body: 'Logo, deskripsi, dan tautan resmi. Talenta memakai halaman ini untuk memutuskan ikut atau tidak.',
                href: '/settings',
                cta: 'Buka profil',
              },
              {
                title: 'Buat studi kasus pertama',
                body: 'Mulai dari template siap pakai, atau susun sendiri dari nol.',
                href: '/challenges/create',
                cta: 'Buat studi kasus',
              },
              {
                title: 'Undang rekan satu tim',
                body: 'Terbitkan kode undangan agar rekruter lain ikut menilai kandidat.',
                href: '/company/team',
                cta: 'Kelola tim',
              },
            ].map((item, idx) => (
              <li key={item.href} className="flex items-start gap-4">
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm font-bold text-success"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 mb-2 leading-relaxed">
                    {item.body}
                  </p>
                  <Link
                    href={item.href}
                    className="text-sm font-bold text-success hover:opacity-80 transition-opacity"
                  >
                    {item.cta}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Studi Kasus Terbit
            </p>
            <h3 className="font-display text-3xl font-extrabold text-foreground mt-1">
              {publishedCount}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {plan.activeChallengeQuota === null
                ? `${quotaUsed} aktif/draf • kuota sesuai kesepakatan`
                : `${quotaUsed} dari ${plan.activeChallengeQuota} kuota paket ${plan.name}`}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-muted-foreground shadow-inner">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Total Seluruh Submisi
            </p>
            <h3 className="font-display text-3xl font-extrabold text-foreground mt-1">
              {totalSubs}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-cyan-400 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Kartu ini menandakan pekerjaan yang tertunda, jadi seluruh isinya
            memakai satu warna peringatan. Sebelumnya bingkai dan ikonnya amber
            tetapi angkanya hijau, sehingga sinyal mendesaknya hilang. */}
        <div
          className={`bg-card border rounded-2xl p-6 shadow-xl flex items-center justify-between ${
            needReviewSubs > 0 ? 'border-amber-500/40' : 'border-border'
          }`}
        >
          <div>
            <p
              className={`text-xs uppercase font-semibold ${
                needReviewSubs > 0 ? 'text-amber-500' : 'text-muted-foreground'
              }`}
            >
              Menunggu Penilaian
            </p>
            <h3
              className={`font-display text-3xl font-extrabold mt-1 ${
                needReviewSubs > 0 ? 'text-amber-500' : 'text-foreground'
              }`}
            >
              {needReviewSubs}
            </h3>
          </div>
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
              needReviewSubs > 0
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                : 'bg-foreground/5 border border-foreground/10 text-muted-foreground'
            }`}
          >
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {isQuotaFull && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-600">
                Kuota paket {plan.name} sudah penuh
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Arsipkan salah satu studi kasus atau tingkatkan paket untuk
                membuat yang baru.
              </p>
            </div>
          </div>
            {isCompanyAdmin && (
              <Link href="/company/billing" className="flex-shrink-0">
                <Button size="sm" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Lihat Paket
                </Button>
              </Link>
            )}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center gap-4 bg-foreground/5">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari studi kasus..."
              aria-label="Cari studi kasus"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {filterTabs.map((tab) => {
              const count =
                tab.key === 'ALL'
                  ? challenges.length
                  : challenges.filter((c: any) => c.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  aria-pressed={statusFilter === tab.key}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredChallenges.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul Challenge</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Kandidat</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antrean Penilaian</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batas Waktu SLA</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredChallenges.map((challenge: any, index: number) => {
                  const sla = calculateSlaStatus(challenge.stats?.nearestSlaDate);
                  const isDraft = challenge.status === 'DRAFT';

                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index, 10) * 0.03 }}
                      key={challenge.id}
                      className="hover:bg-foreground/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-foreground max-w-[250px] truncate">
                          {challenge.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.category?.replace('_', ' ')} • {challenge.difficulty}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            statusStyles[challenge.status] ?? statusStyles.ARCHIVED
                          }`}
                        >
                          {statusLabels[challenge.status] ?? challenge.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {challenge.stats?.totalSubmissions ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`flex items-center gap-2 ${
                            challenge.stats?.unreviewedCount > 0
                              ? 'text-amber-500 font-bold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">
                            {challenge.stats?.unreviewedCount ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {sla ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border ${sla.className}`}
                          >
                            {sla.tone === 'critical' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {sla.text}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Tidak ada antrean
                          </span>
                        )}
                      </td>

                      {/* Aksi selalu terlihat. Versi sebelumnya menyembunyikannya
                          di balik `opacity-0 group-hover:opacity-100`, yang tidak
                          pernah muncul di layar sentuh maupun saat menelusuri
                          dengan keyboard. */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/challenges/${challenge.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={isDraft ? 'text-amber-500 hover:text-amber-400' : 'text-cyan-400 hover:text-cyan-300'}
                            >
                              {isDraft ? 'Lanjutkan Draf' : 'Sunting'}
                            </Button>
                          </Link>
                          {!isDraft && (
                            <Link href={`/company/submissions/challenge/${challenge.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                Lihat Kandidat <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {challenges.length === 0
                  ? 'Belum ada studi kasus'
                  : 'Tidak ada yang cocok'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {challenges.length === 0
                  ? 'Studi kasus yang Anda buat — draf maupun yang sudah terbit — akan muncul di sini.'
                  : 'Coba ubah kata kunci pencarian atau pilih penyaring status yang lain.'}
              </p>
              {challenges.length === 0 && (
                <Link href="/challenges/create">
                  <Button>Buat Studi Kasus Sekarang</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
