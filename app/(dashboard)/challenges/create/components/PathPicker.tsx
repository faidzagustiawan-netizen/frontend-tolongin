import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Layers, Loader2, Lock, Pencil, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { questionBankService } from '@/services/questionBank.service';
import {
  CATEGORY_SHORT_LABELS,
  DIFFICULTY_SHORT_LABELS,
  ChallengeContext,
} from './options';

interface PathPickerProps {
  context: ChallengeContext;
  isAiLocked: boolean;
  onEditContext: () => void;
  onChooseAi: () => void;
  onChooseManual: () => void;
}

/**
 * Langkah kedua: memilih cara membuat, setelah konteksnya diketahui.
 *
 * Kartu template paket-jadi sudah tidak ada. Satuan yang bisa dipakai ulang
 * kini satu soal, bukan satu ujian utuh, jadi yang ditawarkan di sini adalah
 * gambaran isi bank untuk peran yang dicari — pemilihan soalnya sendiri
 * terjadi di dalam builder, tempat perusahaan menyusun tahapannya sendiri.
 */
export default function PathPicker({
  context,
  isAiLocked,
  onEditContext,
  onChooseAi,
  onChooseManual,
}: PathPickerProps) {
  // Hanya jumlah dan penandanya yang dibaca di sini; daftar soalnya sendiri
  // dimuat di dalam builder saat panel bank dibuka.
  const { data: preview, isLoading } = useQuery({
    queryKey: ['question-bank-preview', context.category, context.difficulty],
    queryFn: () =>
      questionBankService.getAll({
        category: context.category,
        difficulty: context.difficulty,
        limit: 1,
      }),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['question-bank-tags', 'ALL'],
    queryFn: () => questionBankService.getTags('ALL'),
  });

  const matchCount = preview?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Ringkasan konteks tetap terlihat: pilihan di bawah ini hanya masuk
          akal bila pengguna ingat atas dasar apa isinya disaring. */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Menyiapkan untuk</span>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
            {context.role}
          </span>
          <span className="px-3 py-1 bg-foreground/5 text-foreground text-xs font-bold rounded-full border border-border">
            {CATEGORY_SHORT_LABELS[context.category] ?? context.category}
          </span>
          <span className="px-3 py-1 bg-foreground/5 text-foreground text-xs font-bold rounded-full border border-border">
            {DIFFICULTY_SHORT_LABELS[context.difficulty] ?? context.difficulty}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onEditContext} className="flex-shrink-0">
          <Pencil className="h-4 w-4 mr-2" aria-hidden="true" /> Ubah
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={onChooseManual}
          className="text-left bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl transition-all flex flex-col"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center">
              <PlusCircle className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Susun sendiri</h3>
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            Formulir terbuka dengan kategori, level, dan batas akhir yang tadi
            Anda isi. Tahapannya Anda rancang sendiri, soalnya bisa ditulis
            sendiri atau dipungut dari bank.
          </p>
        </button>

        <button
          type="button"
          onClick={isAiLocked ? undefined : onChooseAi}
          aria-disabled={isAiLocked}
          className={`text-left bg-card border rounded-2xl p-6 transition-all flex flex-col ${
            isAiLocked
              ? 'border-border opacity-80 cursor-not-allowed'
              : 'border-border hover:border-primary/50 hover:shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 flex items-center justify-center">
              {isAiLocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Sparkles className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground">Biarkan AI menyusun</h3>
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            AI merumuskan kerangka untuk <strong>{context.role}</strong> lebih
            dulu. Anda meninjau dan merevisinya sebelum soal dibuat.
          </p>
          {isAiLocked && (
            <p className="text-xs text-muted-foreground mt-4">
              Aktif mulai paket Pro.{' '}
              <Link
                href="/company/billing"
                className="font-semibold text-success underline underline-offset-4"
              >
                Lihat paket
              </Link>
            </p>
          )}
        </button>
      </div>

      {/* Bank soal disajikan sebagai gambaran, bukan daftar yang bisa dipungut
          di sini. Memungut soal butuh tahap tujuan, dan tahapnya baru ada di
          dalam builder. */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Bank soal siap pakai
            </h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Menghitung soal yang cocok...
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">{matchCount} soal</strong>{' '}
                cocok untuk {context.role} — termasuk soal soft skill, wawancara,
                dan etika kerja yang berlaku lintas bidang.
              </p>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 10).map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-foreground/5 text-muted-foreground text-xs rounded-full border border-border"
              >
                {tag.name}
                <span className="ml-1.5 opacity-60">{tag.questionCount}</span>
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Pilih <strong className="text-foreground">Susun sendiri</strong> di
          atas, lalu buka <strong className="text-foreground">Ambil dari bank soal</strong>{' '}
          pada langkah Tahapan &amp; Soal untuk memungutnya satu per satu.
        </p>
      </div>
    </div>
  );
}
