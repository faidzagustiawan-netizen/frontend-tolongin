'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { talentsService, type PublicTalent } from '@/services/talents.service';
import { Button } from '@/components/common/Button';
import { Search, ShieldCheck, MapPin, Users, Loader2, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 24;

/**
 * Direktori talenta.
 *
 * Perusahaan sebelumnya tidak punya satu pun cara menelusuri talenta: profil
 * publik hanya bisa dicapai dari papan peringkat, dan menu bernama "Direktori
 * Perusahaan" justru menampilkan sesama perusahaan.
 */
export default function TalentDirectoryPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['talent-directory', page, search, skill],
    queryFn: () =>
      talentsService.list({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        skill: skill || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const talents = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = Boolean(search || skill);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <header className="space-y-3">
        <h1 className="font-jakarta text-4xl sm:text-5xl lg:text-[3.75rem] font-bold text-foreground tracking-tight leading-[1.18]">
          Direktori Talenta
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium max-w-3xl">
          Telusuri talenta yang sudah membuktikan kemampuannya lewat studi
          kasus. Buka profil untuk melihat portofolio terverifikasi, lencana,
          dan riwayat pengerjaannya.
        </p>
      </header>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label
            htmlFor="talent-search"
            className="block text-xs font-semibold text-muted-foreground mb-1.5"
          >
            Cari nama, headline, atau keahlian
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="talent-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Contoh: React, data analyst, Budi..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            />
          </div>
        </div>
        <div className="sm:w-64">
          <label
            htmlFor="talent-skill"
            className="block text-xs font-semibold text-muted-foreground mb-1.5"
          >
            Keahlian persis
          </label>
          <input
            id="talent-skill"
            type="text"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setPage(1);
            }}
            placeholder="Contoh: TypeScript"
            className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {isLoading
          ? 'Memuat talenta...'
          : isError
            ? 'Direktori gagal dimuat'
            : `${total} talenta ditemukan`}
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-success mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">Memuat direktori talenta...</p>
        </div>
      ) : isError ? (
        /* Permintaan yang gagal dipisahkan dari direktori yang memang kosong.
           Keduanya sebelumnya menampilkan "Belum ada talenta terdaftar",
           sehingga perusahaan menyimpulkan platform ini tidak punya talenta
           padahal yang terjadi hanyalah permintaannya tidak sampai. */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl space-y-4">
          <p className="text-base text-red-400 font-medium">Gagal memuat direktori talenta.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Coba Lagi
          </Button>
        </div>
      ) : talents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            {hasFilter ? 'Tidak ada yang cocok' : 'Belum ada talenta terdaftar'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {hasFilter
              ? 'Coba kata kunci lain, atau kosongkan penyaring keahlian.'
              : 'Talenta yang mendaftar akan muncul di direktori ini.'}
          </p>
          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setSkill('');
                setPage(1);
              }}
            >
              Hapus penyaring
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
          {talents.map((talent: PublicTalent) => (
            <li key={talent.id}>
              <Link
                href={`/talents/${talent.slug}`}
                className="h-full bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-success/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-success font-bold overflow-hidden flex-shrink-0">
                    {talent.avatarUrl ? (
                      <Image src={talent.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <span aria-hidden="true">{talent.fullName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{talent.fullName}</p>
                    {talent.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{talent.headline}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {talent.skills?.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full bg-foreground/5 border border-border text-xs text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                  {talent.skills?.length > 4 && (
                    <span className="px-2.5 py-1 text-xs text-muted-foreground">
                      +{talent.skills.length - 4}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">
                    Level {talent.level} &middot; {talent.xp} XP
                  </span>
                  <span className="flex items-center gap-2">
                    {talent.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {talent.location}
                      </span>
                    )}
                    {talent.faceVerificationStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">Identitas terverifikasi</span>
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
          aria-label="Navigasi halaman direktori talenta"
        >
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Sebelumnya
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Halaman {page} dari {totalPages}
          </p>
          <Button variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
            Berikutnya
          </Button>
        </nav>
      )}
    </div>
  );
}
