import React from 'react';
import { Info } from 'lucide-react';
import { BuilderProps } from '../types';

/** Sejalan dengan MIN_SCALE_POINTS/MAX_SCALE_POINTS di backend. */
const SCALE_PRESETS = [
  { points: 3, label: '3 titik (Tidak setuju – Netral – Setuju)' },
  { points: 4, label: '4 titik (tanpa pilihan netral)' },
  { points: 5, label: '5 titik (Likert baku)' },
  { points: 6, label: '6 titik (tanpa pilihan netral)' },
  { points: 7, label: '7 titik (paling rinci)' },
];

/** Contoh dimensi; tetap bisa diisi bebas sesuai kebutuhan perusahaan. */
const DIMENSION_SUGGESTIONS = [
  'Ketelitian',
  'Kerja Sama',
  'Ketahanan Tekanan',
  'Inisiatif',
  'Keterbukaan',
  'Kepemimpinan',
];

export default function PsychometricBuilder({ comp, onChange }: BuilderProps) {
  const metadata = (comp.metadata || {}) as Record<string, any>;
  const scaleMin = Number(metadata.scaleMin ?? 1);
  const scaleMax = Number(metadata.scaleMax ?? 5);
  const points = scaleMax - scaleMin + 1;

  const updateMetadata = (patch: Record<string, unknown>) => {
    onChange('metadata', { ...metadata, ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex gap-3 text-sm">
        <Info className="h-5 w-5 flex-shrink-0 text-purple-400" aria-hidden="true" />
        <p className="text-muted-foreground leading-relaxed">
          Soal psikotes <strong className="text-foreground">tidak punya jawaban benar</strong> dan
          tidak menyumbang poin. Jawabannya diringkas menjadi profil per dimensi,
          terpisah dari nilai akhir.
        </p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">
          Dimensi yang diukur
        </label>
        <input
          value={metadata.dimension || ''}
          onChange={(e) => updateMetadata({ dimension: e.target.value })}
          list="psychometric-dimensions"
          placeholder="Contoh: Ketelitian"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-purple-500 transition-colors"
        />
        <datalist id="psychometric-dimensions">
          {DIMENSION_SUGGESTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground mt-2">
          Beberapa soal dengan dimensi yang sama akan dirata-ratakan menjadi satu
          angka pada profil kandidat.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">
            Panjang skala
          </label>
          <select
            value={points}
            onChange={(e) =>
              updateMetadata({ scaleMin: 1, scaleMax: Number(e.target.value) })
            }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-purple-500 font-semibold"
          >
            {SCALE_PRESETS.map((preset) => (
              <option key={preset.points} value={preset.points}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-start gap-3 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={metadata.reverse === true}
              onChange={(e) => updateMetadata({ reverse: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-500 bg-background border-border rounded focus:ring-purple-500"
            />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Pernyataan terbalik
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Setuju berarti dimensi ini rendah. Selipkan beberapa di antara
                soal biasa untuk menahan kandidat yang menyetujui semuanya.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl p-4">
        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
          Pratinjau skala
        </span>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-muted-foreground">Sangat tidak setuju</span>
          {Array.from({ length: points }, (_, idx) => (
            <span
              key={idx}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs font-bold text-muted-foreground"
            >
              {scaleMin + idx}
            </span>
          ))}
          <span className="text-xs text-muted-foreground">Sangat setuju</span>
        </div>
      </div>
    </div>
  );
}
