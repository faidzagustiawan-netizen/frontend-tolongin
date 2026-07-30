'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Loader2, Lock, SlidersHorizontal } from 'lucide-react';
import {
  challengesService,
  UpdateStageGatePayload,
} from '@/services/challenges.service';
import { Section } from '@/types';
import StageGateSettings from '@/app/(dashboard)/challenges/create/components/StageGateSettings';

interface StageGateEditorProps {
  challengeId: string;
  enabled?: boolean;
}

/** Kolom yang boleh diubah setelah studi kasus terbit. Soal tidak termasuk. */
const toGatePayload = (section: Section): UpdateStageGatePayload => ({
  timeLimit: section.timeLimit ?? null,
  opensAt: section.opensAt ?? null,
  closesAt: section.closesAt ?? null,
  gateMode: section.gateMode,
  minScore: section.minScore ?? null,
  maxAdvancing: section.maxAdvancing ?? null,
  scoreBasis: section.scoreBasis,
  gateSourceIds: section.gateSourceIds ?? [],
  pendingPolicy: section.pendingPolicy,
  graceDays: section.graceDays ?? null,
});

/**
 * Menyesuaikan ambang lolos dan jadwal tahap pada studi kasus yang sudah terbit.
 *
 * Studi kasus yang terbit sengaja dibekukan — soalnya tidak boleh berubah di
 * tengah pengerjaan, karena jawaban kandidat menunjuk baris soal tertentu.
 * Ambang lolos lain perkaranya: baru terbukti terlalu ketat setelah kandidat
 * sungguhan mengerjakannya, dan tanpa layar ini "minimal 80" yang menyisakan nol
 * kandidat tidak bisa diperbaiki sama sekali.
 */
export function StageGateEditor({
  challengeId,
  enabled = true,
}: StageGateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge-gate-config', challengeId],
    queryFn: () => challengesService.getOne(challengeId),
    enabled: enabled && !!challengeId && isOpen,
    select: (result) => result.data,
  });

  // Salinan lokal supaya perubahan bisa disusun dulu lalu disimpan per tahap.
  // Menyimpan tiap ketukan berarti puluhan permintaan dan ambang setengah jadi
  // yang sempat berlaku bagi kandidat yang membuka halaman saat itu.
  useEffect(() => {
    if (challenge?.sections) setSections(challenge.sections as Section[]);
  }, [challenge]);

  const save = useMutation({
    mutationFn: (section: Section) =>
      challengesService.updateStageGate(
        challengeId,
        section.id!,
        toGatePayload(section),
      ),
    onMutate: (section) => setSavingId(section.id ?? null),
    onSuccess: () => toast.success('Pengaturan tahap diperbarui.'),
    onError: (err: any) => {
      // Pesan penolakan dari server sudah berbentuk kalimat siap tampil —
      // misalnya "kuota hanya bisa diputuskan setelah tahap ditutup".
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal memperbarui pengaturan tahap.',
      );
    },
    onSettled: () => setSavingId(null),
  });

  const patchSection = (index: number, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === index ? { ...section, ...patch } : section,
      ),
    );
  };

  return (
    <section className="mb-8 bg-card border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-foreground/[0.02] transition-colors"
      >
        <SlidersHorizontal className="w-5 h-5 text-cyan-500" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="font-bold text-foreground">Atur Ulang Syarat &amp; Jadwal Tahap</h2>
          <p className="text-xs text-muted-foreground">
            Bisa diubah walau studi kasus sudah terbit. Soal tetap terkunci.
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border">
          <div className="px-6 py-4 flex items-start gap-3 bg-amber-500/5 border-b border-border">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Batas waktu yang sedang berjalan tidak dipotong: waktu baru hanya
              berlaku bagi kandidat yang belum menekan &quot;Mulai Tahap&quot;.
              Menaikkan ambang lolos tidak menutup kembali tahap yang sudah
              terbuka bagi seseorang.
            </p>
          </div>

          {isLoading ? (
            <div className="px-6 py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            </div>
          ) : sections.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Studi kasus ini tidak punya tahap yang bisa diatur.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sections.map((section, index) => (
                <li key={section.id ?? index}>
                  <StageGateSettings
                    sections={sections}
                    index={index}
                    onChange={(patch) => patchSection(index, patch)}
                  />
                  <div className="px-4 sm:px-8 pb-8 max-w-4xl mx-auto w-full">
                    <button
                      type="button"
                      onClick={() => save.mutate(section)}
                      disabled={!section.id || savingId === section.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                    >
                      {savingId === section.id && (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      )}
                      Simpan Tahap Ini
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
