'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  submissionsService,
  type HiringStatus,
  type SubmissionStatus,
} from '@/services/submissions.service';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/common/Button';
import { HIRING_STAGES, getHiringStage } from '@/lib/hiringStatus';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const PAGE_SIZE = 25;

const SUBMISSION_STATUS_META: Record<
  string,
  { label: string; className: string; Icon: typeof Clock }
> = {
  PENDING_AI: {
    label: 'Diproses AI',
    className: 'bg-info/10 text-info',
    Icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Perlu Direview',
    className: 'bg-warning/10 text-warning',
    Icon: Clock,
  },
  PASSED: {
    label: 'Lolos',
    className: 'bg-success/10 text-success',
    Icon: CheckCircle,
  },
  FAILED: {
    label: 'Gagal',
    className: 'bg-danger/10 text-danger',
    Icon: XCircle,
  },
};

type SortOption = 'recent' | 'oldest' | 'score';

export interface CandidateBrowserProps {
  /** Kosong berarti seluruh kandidat perusahaan, lintas studi kasus. */
  challengeId?: string;
  enabled?: boolean;
}

/**
 * Daftar kandidat yang dipakai dua layar: satu studi kasus, dan seluruh
 * studi kasus sekaligus.
 *
 * Penyaringan dikerjakan server. Versi sebelumnya menyaring larik yang sudah
 * terpaginasi di peramban, jadi mencari kandidat yang kebetulan ada di halaman
 * tiga selalu memberi hasil nihil — dengan catatan kaki kecil sebagai
 * permintaan maaf.
 */
export function CandidateBrowser({
  challengeId,
  enabled = true,
}: CandidateBrowserProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SubmissionStatus | ''>('');
  const [hiringStatus, setHiringStatus] = useState<HiringStatus | ''>('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);

  // Pencarian ditunda supaya setiap huruf tidak menjadi satu permintaan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: [
      'company-submissions',
      challengeId ?? 'all',
      page,
      search,
      status,
      hiringStatus,
      sort,
    ],
    queryFn: () =>
      submissionsService.getCompanySubmissions(challengeId, {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        hiringStatus: hiringStatus || undefined,
        sort,
      }),
    enabled,
    // Halaman lama tetap tampil selagi halaman baru diambil, jadi tabel tidak
    // berkedip kosong setiap kali penyaring berubah.
    placeholderData: keepPreviousData,
  });

  const submissions = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasActiveFilter = useMemo(
    () => Boolean(search || status || hiringStatus),
    [search, status, hiringStatus],
  );

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setHiringStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-foreground/5 flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="candidate-search"
              className="block text-xs font-semibold text-muted-foreground mb-1.5"
            >
              Cari kandidat
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="candidate-search"
                type="search"
                placeholder="Nama talenta..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-colors"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label
              htmlFor="candidate-status"
              className="block text-xs font-semibold text-muted-foreground mb-1.5"
            >
              Status penilaian
            </label>
            <select
              id="candidate-status"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as SubmissionStatus | '');
                setPage(1);
              }}
            >
              <option value="">Semua status</option>
              <option value="PENDING_AI">Diproses AI</option>
              <option value="UNDER_REVIEW">Perlu Direview</option>
              <option value="PASSED">Lolos</option>
              <option value="FAILED">Gagal</option>
            </select>
          </div>

          <div className="w-full lg:w-52">
            <label
              htmlFor="candidate-stage"
              className="block text-xs font-semibold text-muted-foreground mb-1.5"
            >
              Tahap rekrutmen
            </label>
            <select
              id="candidate-stage"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              value={hiringStatus}
              onChange={(e) => {
                setHiringStatus(e.target.value as HiringStatus | '');
                setPage(1);
              }}
            >
              <option value="">Semua tahap</option>
              {HIRING_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-44">
            <label
              htmlFor="candidate-sort"
              className="block text-xs font-semibold text-muted-foreground mb-1.5"
            >
              Urutkan
            </label>
            <select
              id="candidate-sort"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                setPage(1);
              }}
            >
              <option value="recent">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="score">Nilai tertinggi</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20" aria-busy="true">
              <Loader2 className="h-8 w-8 animate-spin text-success mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">Memuat data kandidat...</p>
            </div>
          ) : submissions.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[720px]">
              <caption className="sr-only">
                Daftar kandidat yang mengumpulkan solusi
              </caption>
              <thead>
                <tr className="bg-background/50 border-b border-border">
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kandidat</th>
                  {!challengeId && (
                    <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Studi Kasus</th>
                  )}
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Penilaian</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tahap Rekrutmen</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal Submit</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub: any) => {
                  const statusMeta = SUBMISSION_STATUS_META[sub.status];
                  const stage = getHiringStage(sub.hiringStatus);
                  return (
                    <tr key={sub.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-success font-bold overflow-hidden flex-shrink-0">
                            {sub.talent.avatarUrl ? (
                              <Image src={sub.talent.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                            ) : (
                              <span className="relative z-10" aria-hidden="true">
                                {sub.talent.fullName[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            {/* Baris tidak lagi mengandalkan onClick pada <tr>.
                                Versi itu tidak bisa dijangkau keyboard sama
                                sekali, dan tombol "Nilai Kandidat" di dalamnya
                                justru tidak punya aksi sendiri. */}
                            <Link
                              href={`/company/submissions/${sub.id}`}
                              className="text-sm font-medium text-foreground hover:text-success transition-colors"
                            >
                              {sub.talent.fullName}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {sub.talent.headline || sub.talent.skills?.slice(0, 2).join(', ')}
                            </p>
                            {/* Pada studi kasus bertahap satu kandidat muncul
                                sekali per tahap. Tanpa penanda ini barisnya
                                terlihat seperti duplikat, dan tidak ada cara
                                mengetahui tahap mana yang sedang dinilai. */}
                            {sub.section && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-[10px] font-bold">
                                {sub.section.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {!challengeId && (
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground max-w-[220px] truncate">
                            {sub.challenge?.title}
                          </p>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusMeta ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusMeta.className}`}>
                            <statusMeta.Icon className="w-3 h-3" aria-hidden="true" />
                            {statusMeta.label}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-foreground/10 text-muted-foreground text-xs font-semibold w-fit">
                            {sub.status}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit inline-block ${stage.className}`}>
                          {stage.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {sub.finalScore ?? <span className="text-muted-foreground">—</span>}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/company/submissions/${sub.id}`}>
                          <Button variant="ghost" size="sm">
                            {sub.evaluatedAt ? 'Lihat Penilaian' : 'Nilai Kandidat'}
                            <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Dua keadaan yang berbeda dibedakan. Sebelumnya "belum ada
               kandidat" dan "penyaring tidak memberi hasil" memakai kalimat
               yang sama, jadi rekruter tidak tahu harus menunggu atau
               menghapus penyaringnya. */
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {hasActiveFilter ? 'Tidak ada yang cocok' : 'Belum ada kandidat'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {hasActiveFilter
                  ? 'Tidak ada kandidat yang cocok dengan kata kunci atau penyaring yang aktif.'
                  : 'Kandidat yang mengumpulkan solusi akan muncul di sini.'}
              </p>
              {hasActiveFilter && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Hapus semua penyaring
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Paginasi berada di luar kartu bertepi, bukan menempel di dalamnya
          tanpa padding. */}
      {totalPages > 1 && (
        <nav
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
          aria-label="Navigasi halaman kandidat"
        >
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Sebelumnya
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Halaman {page} dari {totalPages} &middot; {total} kandidat
          </p>
          <Button variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </Button>
        </nav>
      )}
    </div>
  );
}
