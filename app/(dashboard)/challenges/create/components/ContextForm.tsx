import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import { Button } from '@/components/common/Button';
import {
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  ChallengeContext,
} from './options';

interface ContextFormProps {
  context: ChallengeContext;
  setContext: React.Dispatch<React.SetStateAction<ChallengeContext>>;
  onContinue: () => void;
}

/**
 * Langkah pembuka.
 *
 * Halaman ini dulu membuka dengan pertanyaan "mau pakai cara apa" — template,
 * AI, atau manual — sebelum pengguna menyebutkan sepatah kata pun tentang yang
 * dicarinya. Pilihan itu diambil tanpa dasar: template belum tersaring, prompt
 * AI masih kosong, dan tidak ada yang bisa membandingkan ketiganya.
 *
 * Sekarang yang ditanya lebih dulu adalah substansinya. Jawabannya menyeleksi
 * template, mengisi prompt AI, dan menyemai formulir manual, sehingga cara
 * pembuatan bisa dipilih setelah tahu apa yang ditawarkan masing-masing.
 */
export default function ContextForm({
  context,
  setContext,
  onContinue,
}: ContextFormProps) {
  const canContinue = context.role.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onContinue();
      }}
      className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl space-y-8"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            Siapa yang sedang Anda cari?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Empat pertanyaan singkat. Jawabannya dipakai untuk menyaring
            template yang relevan dan menyiapkan AI — Anda tetap bebas memilih
            cara pembuatannya di langkah berikutnya.
          </p>
        </div>
      </div>

      <Input
        label="Posisi atau peran yang dicari"
        placeholder="Contoh: Backend Developer, UI Designer, Data Analyst"
        value={context.role}
        onChange={(e) => setContext({ ...context, role: e.target.value })}
        required
        autoFocus
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="context-category"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Kategori pekerjaan
          </label>
          <select
            id="context-category"
            value={context.category}
            onChange={(e) =>
              setContext({ ...context, category: e.target.value as ChallengeContext['category'] })
            }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="context-difficulty"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Tingkat kesulitan
          </label>
          <select
            id="context-difficulty"
            value={context.difficulty}
            onChange={(e) =>
              setContext({
                ...context,
                difficulty: e.target.value as ChallengeContext['difficulty'],
              })
            }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <DateTimePicker
          label="Batas akhir (opsional)"
          value={context.deadlineAt}
          onChange={(isoString) => setContext({ ...context, deadlineAt: isoString })}
          placeholder="Tentukan nanti saja..."
        />
        <p className="text-xs text-muted-foreground mt-2">
          Bisa diisi belakangan di langkah Informasi Umum.
        </p>
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <Button
          type="submit"
          disabled={!canContinue}
          className="w-full sm:w-auto px-8 py-3 font-bold"
        >
          Lanjutkan <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
