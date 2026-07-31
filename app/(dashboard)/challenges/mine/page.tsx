'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { challengesService } from '@/services/challenges.service';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  FileEdit,
  Loader2,
  Lock,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

const PAGE_SIZE = 12;

// Enum di basis data adalah DRAFT | PUBLISHED | CLOSED. Kunci `ARCHIVED` yang
// lama tidak pernah cocok dengan apa pun, sehingga studi kasus tertutup tampil
// sebagai teks mentah "CLOSED".
const statusStyles: Record<string, string> = {
  DRAFT: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  CLOSED: 'bg-foreground/10 text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  PUBLISHED: 'Terbit',
  CLOSED: 'Diarsipkan',
};

export default function MyChallengesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: (id: string) => challengesService.archive(id),
    onSuccess: () => {
      toast.success('Challenge diarsipkan. Slot Public Challenge kembali bebas.');
      setPendingArchive(null);
      void queryClient.invalidateQueries({ queryKey: ['my-challenges'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal mengarsipkan challenge.');
    },
  });

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Halaman ini kini khusus talenta.
  //
  // Untuk perusahaan isinya menduplikasi dasbor `/` — daftar challenge yang
  // sama persis, hanya beda bentuk — dan keduanya sama-sama dipasang di menu
  // utama. Penanda status serta penyaringnya sudah dipindahkan ke dasbor, jadi
  // akun perusahaan diarahkan ke sana.
  const isCompany = user?.role === 'COMPANY';

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== 'TALENT') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-challenges', page],
    queryFn: () => challengesService.getAll({ mine: true, page, limit: PAGE_SIZE }),
    enabled: !!user && !isCompany,
  });

  const challenges = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!user || user.role !== 'TALENT') return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">
            Challenge Saya
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Seluruh studi kasus yang Anda buat, termasuk yang masih berstatus draf.
            Draf hanya terlihat oleh Anda sampai diterbitkan.
          </p>
        </div>
        <Link href="/challenges/create">
          <Button className="font-bold whitespace-nowrap">
            <PlusCircle className="h-4 w-4 mr-2" /> Buat Baru
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Memuat challenge Anda...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400">
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">
            {(error as any)?.message || 'Gagal memuat daftar challenge Anda.'}
          </p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-border text-center px-6">
          <FileEdit className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-foreground font-medium mb-1">Belum ada challenge</p>
          <p className="text-sm max-w-md">
            Studi kasus yang Anda buat — baik draf maupun yang sudah terbit — akan
            muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge: any) => {
            const isDraft = challenge.status === 'DRAFT';
            const isClosed = challenge.status === 'CLOSED';
            // Draf belum punya halaman publik yang berarti, jadi diarahkan
            // langsung ke editornya.
            const href = isDraft
              ? `/challenges/${challenge.slug || challenge.id}/edit`
              : `/challenges/${challenge.slug || challenge.id}`;

            return (
              // Kartunya bukan lagi satu <Link> raksasa: tombol arsip perlu
              // hidup di dalamnya, dan tombol di dalam tautan bukan markah yang
              // sah maupun bisa dioperasikan dengan keyboard.
              <div
                key={challenge.id}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      statusStyles[challenge.status] ?? statusStyles.ARCHIVED
                    }`}
                  >
                    {statusLabels[challenge.status] ?? challenge.status}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    {challenge.category || 'Lintas bidang'}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {challenge.difficulty}
                  </span>
                  {challenge.isPrivate && (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Lock className="h-3 w-3" /> Privat
                    </span>
                  )}
                  {challenge.createdByAi && (
                    <span className="flex items-center gap-1 text-xs font-medium text-cyan-400">
                      <Sparkles className="h-3 w-3" /> Dibuat AI
                    </span>
                  )}
                </div>

                <Link href={href} className="block group">
                  <h2 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {challenge.summary}
                  </p>
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  {isDraft ? (
                    <p className="text-xs text-amber-500 font-medium">
                      Klik judulnya untuk melanjutkan penyuntingan draf ini.
                    </p>
                  ) : (
                    <span />
                  )}

                  {!isClosed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingArchive(challenge)}
                    >
                      <Archive className="h-4 w-4 mr-2" /> Arsipkan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingArchive}
        title="Arsipkan challenge ini?"
        confirmLabel="Ya, arsipkan"
        cancelLabel="Batal"
        isBusy={archiveMutation.isPending}
        onCancel={() => setPendingArchive(null)}
        onConfirm={() => archiveMutation.mutate(pendingArchive.id)}
      >
        <p>
          <strong>{pendingArchive?.title}</strong> akan ditutup dan hilang dari
          direktori publik. Slot Public Challenge Anda kembali tersedia.
        </p>
        <p>
          Token yang sudah dipakai untuk membuatnya tidak dikembalikan, dan
          tindakan ini tidak dapat dibatalkan sendiri.
        </p>
      </ConfirmDialog>
    </div>
  );
}
