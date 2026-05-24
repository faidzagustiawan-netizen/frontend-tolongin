import React from 'react';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

export interface RubricTableProps {
  rubric: Record<string, any>;
}

export const RubricTable: React.FC<RubricTableProps> = ({ rubric }) => {
  // Filter out special non-weight fields like durationHours and customOutputs
  const weightEntries = Object.entries(rubric).filter(
    ([key, val]) => key !== 'durationHours' && key !== 'customOutputs' && typeof val === 'number'
  );

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const totalWeight = weightEntries.reduce((acc, [, weight]) => acc + (weight as number), 0);
  const durationHours = rubric.durationHours || 72;
  const customOutputs: Array<{ id: string; label: string; placeholder: string; required?: boolean }> =
    Array.isArray(rubric.customOutputs) ? rubric.customOutputs : [];

  return (
    <div className="space-y-6">
      {/* Criteria & Weight Table */}
      <div className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-dark-border bg-white/5 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Kriteria & Bobot Penilaian AI</h4>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Total Bobot: {totalWeight}%
          </span>
        </div>
        <div className="divide-y divide-dark-border">
          {weightEntries.map(([key, weight]) => (
            <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-200">{formatKey(key)}</span>
              </div>
              <span className="text-sm font-bold text-white bg-white/5 border border-white/10 px-3 py-1 rounded-xl font-mono">
                {weight}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* LMS Duration & Custom Outputs Info */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-dark-border pb-3">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h4 className="font-display font-bold text-white text-sm">Alokasi Pengerjaan LMS Server</h4>
        </div>
        <div className="flex items-baseline justify-between text-xs text-gray-300">
          <span>Batas Waktu Timer Server</span>
          <span className="font-mono text-sm font-bold text-cyan-400">{durationHours} Jam</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Waktu pengerjaan akan mulai dihitung otomatis oleh server begitu Anda menyetujui Digital NDA dan mengambil tantangan.
        </p>
      </div>

      {customOutputs.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-dark-border pb-3">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h4 className="font-display font-bold text-white text-sm">Persyaratan Pengumpulan Khusus</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Studi kasus ini menerapkan output kustom di luar kode IT. Anda diwajibkan mengunggah tautan berikut pada saat pengumpulan:
          </p>
          <ul className="space-y-2 text-xs text-gray-300">
            {customOutputs.map((out, index) => (
              <li key={out.id || index} className="flex items-start gap-2 bg-dark-bg border border-dark-border rounded-xl p-3">
                <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${out.required ? 'bg-red-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="font-semibold text-white">{out.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Contoh: {out.placeholder}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
