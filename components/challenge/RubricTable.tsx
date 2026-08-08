import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

export interface RubricTableProps {
  rubric: Record<string, any>;
}

export const RubricTable: React.FC<RubricTableProps> = ({ rubric }) => {
  // Filter out system fields and ensure value is actually a numeric weight
  const systemKeys = ['durationHours', 'customOutputs', 'requireProctoring', 'proctoringSettings'];
  const weightEntries = Object.entries(rubric).filter(([key, val]) => {
    if (systemKeys.includes(key)) return false;
    if (typeof val === 'boolean' || typeof val === 'object') return false;
    return !isNaN(Number(val)) && val !== '';
  });

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const totalWeight = weightEntries.reduce((acc, [, weight]) => acc + Number(weight), 0);
  const customOutputs: Array<{ id: string; label: string; placeholder: string; required?: boolean }> =
    Array.isArray(rubric.customOutputs) ? rubric.customOutputs : [];

  return (
    <div className="space-y-6">
      {/* Criteria & Weight Table */}
      <div className="px-6 py-5 border-b border-border bg-foreground/5 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Kriteria & Bobot Penilaian AI</h4>
          {/* Tanpa satu pun kriteria, "Total Bobot: 0%" hanya angka kosong yang
              menyisakan pertanyaan. Yang berguna adalah menyebut bahwa perusahaan
              memang belum menyusunnya. */}
          {weightEntries.length > 0 && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              Total Bobot: {totalWeight}%
            </span>
          )}
        </div>
        {weightEntries.length === 0 && (
          <div className="px-6 py-6 text-xs text-muted-foreground leading-relaxed">
            Perusahaan belum merinci bobot penilaian untuk studi kasus ini. Penilaian tetap
            dilakukan, tetapi pembagian nilainya tidak dipublikasikan.
          </div>
        )}
        <div className="divide-y divide-border">
          {weightEntries.map(([key, weight]) => (
            <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-foreground/5 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{formatKey(key)}</span>
              </div>
              <span className="text-sm font-bold text-foreground bg-foreground/5 border border-foreground/10 px-3 py-1 rounded-xl font-mono">
                {String(weight)}%
              </span>
            </div>
          ))}
        </div>


      {customOutputs.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h4 className="font-display font-bold text-foreground text-sm">Persyaratan Pengumpulan Khusus</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Studi kasus ini menerapkan output kustom di luar kode IT. Anda diwajibkan mengunggah tautan berikut pada saat pengumpulan:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {customOutputs.map((out, index) => (
              <li key={out.id || index} className="flex items-start gap-2 bg-background border border-border rounded-xl p-3">
                <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${out.required ? 'bg-red-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="font-semibold text-foreground">{out.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Contoh: {out.placeholder}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
