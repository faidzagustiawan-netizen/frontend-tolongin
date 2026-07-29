import React from 'react';
import { SolverProps } from '../types';

/**
 * Jawaban psikotes: satu nilai pada skala.
 *
 * Nilainya dikirim sebagai teks lewat `textValue`, sama seperti tipe soal lain,
 * supaya tidak perlu kolom jawaban tersendiri. Backend yang menerjemahkannya
 * menjadi skor dimensi.
 */
export default function PsychometricSolver({ comp, value, onChange }: SolverProps) {
  const metadata = (comp.metadata || {}) as Record<string, any>;
  const scaleMin = Number(metadata.scaleMin ?? 1);
  const scaleMax = Number(metadata.scaleMax ?? 5);
  const points = Math.max(0, scaleMax - scaleMin + 1);
  const selected = value !== undefined && value !== null ? Number(value) : null;

  const groupName = `psychometric-${comp.question.slice(0, 24)}`;

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Pilih tingkat persetujuan Anda</legend>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Sangat tidak setuju</span>
        <span>Sangat setuju</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: points }, (_, idx) => {
          const scaleValue = scaleMin + idx;
          const isSelected = selected === scaleValue;

          return (
            <label
              key={scaleValue}
              className={`flex-1 cursor-pointer rounded-xl border px-2 py-3 text-center transition-colors ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={scaleValue}
                checked={isSelected}
                onChange={() => onChange(String(scaleValue))}
                className="sr-only"
              />
              <span className="text-sm font-bold">{scaleValue}</span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Tidak ada jawaban benar atau salah. Pilih yang paling menggambarkan Anda.
      </p>
    </fieldset>
  );
}
