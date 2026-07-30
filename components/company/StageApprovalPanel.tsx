'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, UserCheck } from 'lucide-react';
import { stagesService, PendingApproval } from '@/services/stages.service';

interface StageApprovalPanelProps {
  challengeId: string;
  enabled?: boolean;
}

/**
 * Kandidat yang menunggu perusahaan meloloskan mereka ke satu tahap.
 *
 * Tanpa layar ini, mode syarat masuk "manual" bisa dipilih di pembuat studi
 * kasus tetapi tidak bisa ditindaklanjuti — kandidat terkunci permanen tanpa
 * satu pun jalan keluar. Karena itu panel ini muncul hanya bila memang ada yang
 * menunggu, dan diam sepenuhnya bila tidak.
 */
export function StageApprovalPanel({
  challengeId,
  enabled = true,
}: StageApprovalPanelProps) {
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const queryKey = ['stage-approvals', challengeId];

  const { data: pending, isLoading } = useQuery({
    queryKey,
    queryFn: () => stagesService.getPendingApprovals(challengeId),
    enabled: enabled && !!challengeId,
  });

  const approve = useMutation({
    mutationFn: (attemptId: string) => stagesService.approveAttempt(attemptId),
    onMutate: (attemptId) => setApprovingId(attemptId),
    onSuccess: (result, _attemptId) => {
      toast.success(
        result.alreadyApproved
          ? 'Kandidat ini sudah diloloskan sebelumnya.'
          : 'Kandidat diloloskan. Tahapnya sekarang terbuka.',
      );
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal meloloskan kandidat.',
      );
    },
    onSettled: () => setApprovingId(null),
  });

  // Panel disembunyikan bila tidak ada yang menunggu. Kartu kosong pada studi
  // kasus tanpa gerbang manual hanya menambah kebisingan di halaman kandidat.
  if (isLoading || !pending || pending.length === 0) return null;

  return (
    <section className="mb-8 bg-card border border-amber-500/30 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-amber-500/5">
        <KeyRound className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <div>
          <h2 className="font-bold text-foreground">
            Menunggu Persetujuan Anda
          </h2>
          <p className="text-xs text-muted-foreground">
            {pending.length} kandidat tidak bisa melanjutkan sampai Anda
            meloloskan mereka.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {pending.map((item: PendingApproval) => (
          <li
            key={item.attemptId}
            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link
                  href={`/talents/${item.talent.slug}`}
                  className="text-sm font-semibold text-foreground hover:text-success transition-colors"
                >
                  {item.talent.fullName}
                </Link>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500">
                  {item.section.title}
                </span>
              </div>

              {item.talent.headline && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.talent.headline}
                </p>
              )}

              {/* Nilai tahap sebelumnya adalah dasar keputusan. Tanpa angka ini
                  perusahaan diminta memilih tanpa bahan. */}
              {item.previousScores.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.previousScores.map((prev) => (
                    <span
                      key={prev.title}
                      className="text-[11px] px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground"
                    >
                      {prev.title}:{' '}
                      <strong className="text-foreground">
                        {prev.score === null ? 'belum dinilai' : prev.score.toFixed(1)}
                      </strong>
                    </span>
                  ))}
                </div>
              )}

              {item.lockReason && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {item.lockReason}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => approve.mutate(item.attemptId)}
              disabled={approvingId === item.attemptId}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              {approvingId === item.attemptId ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserCheck className="w-4 h-4" aria-hidden="true" />
              )}
              Loloskan
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
