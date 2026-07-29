import React, { useState } from 'react';
import { HelpCircle, PieChart, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { PROCTORING_SETTINGS, ProctoringSetting } from './proctoringCatalog';
import ProctoringInfoDialog from './ProctoringInfoDialog';

interface ScoringSecurityFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
  /** Jumlah soal berpoin; rubrik holistik hanya berlaku bila nol. */
  totalComponents: number;
}

const RUBRIC_SYSTEM_KEYS = [
  'proctoringSettings',
  'customOutputs',
  'durationHours',
  'requireProctoring',
];

/**
 * Langkah keempat: bagaimana dinilai dan seketat apa diawasi.
 *
 * Diletakkan setelah soal disusun, bukan sebelumnya. Bobot rubrik holistik
 * baru bisa diputuskan ketika sudah jelas apakah studi kasusnya memakai soal
 * berpoin — dan kalau memakai, rubriknya memang tidak dipakai sama sekali.
 */
export default function ScoringSecurityForm({
  manualData,
  setManualData,
  totalComponents,
}: ScoringSecurityFormProps) {
  const [explainedSetting, setExplainedSetting] = useState<ProctoringSetting | null>(null);

  const rubricKeys = Object.keys(manualData.gradingRubric || {}).filter(
    (k) => !RUBRIC_SYSTEM_KEYS.includes(k),
  );

  // Studi kasus lama masih menyimpan pengaturan ini di dalam gradingRubric.
  // Dibaca dari sana sebagai cadangan supaya draf lama tetap tampil benar.
  const proctoringSettings = (manualData.proctoringSettings ||
    (manualData.gradingRubric as any)?.proctoringSettings ||
    {}) as Record<string, any>;

  const updateProctoring = (patch: Record<string, unknown>) => {
    setManualData({
      ...manualData,
      proctoringSettings: { ...proctoringSettings, ...patch },
    });
  };

  const totalWeight = rubricKeys.reduce(
    (acc, key) => acc + ((manualData.gradingRubric as any)[key] || 0),
    0,
  );

  const handleAddCriteria = () => {
    setManualData({
      ...manualData,
      gradingRubric: {
        ...manualData.gradingRubric,
        [`kriteria_${rubricKeys.length + 1}`]: 0,
      },
    });
  };

  const handleRemoveCriteria = (keyToRemove: string) => {
    const newRubric = { ...manualData.gradingRubric } as any;
    delete newRubric[keyToRemove];
    setManualData({ ...manualData, gradingRubric: newRubric });
  };

  const handleUpdateCriteria = (oldKey: string, newKey: string, value: number) => {
    const newRubric = { ...manualData.gradingRubric } as any;
    if (oldKey !== newKey) delete newRubric[oldKey];
    newRubric[newKey] = value;
    setManualData({ ...manualData, gradingRubric: newRubric });
  };

  const rubricIsBinding = totalComponents === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <PieChart className="h-6 w-6 text-emerald-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Kriteria &amp; Bobot Penilaian
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Panduan penilaian bagi tim rekruter maupun AI Evaluator.
              </p>
            </div>
          </div>
          {rubricIsBinding && rubricKeys.length > 0 && (
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                totalWeight === 100
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              Total: {totalWeight}%
            </span>
          )}
        </div>

        {/* Keadaan rubrik dinyatakan apa adanya sesuai isi studi kasus, bukan
            sebagai peringatan umum yang harus ditebak sendiri kapan berlakunya. */}
        <div
          className={`rounded-xl p-4 mb-6 border ${
            rubricIsBinding
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-foreground/5 border-border'
          }`}
        >
          <p className="text-xs font-medium leading-relaxed">
            {rubricIsBinding ? (
              <span className="text-amber-500">
                <span className="font-bold">Berlaku:</span> studi kasus ini belum
                memuat soal berpoin, jadi penilaian bersandar pada rubrik ini dan
                totalnya wajib 100%.
              </span>
            ) : (
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">Tidak mengikat:</span>{' '}
                studi kasus ini memuat {totalComponents} soal berpoin, jadi skor
                dihitung dari poin tiap soal. Rubrik di bawah hanya jadi catatan
                untuk penilai.
              </span>
            )}
          </p>
        </div>

        <div className="space-y-3">
          {rubricKeys.length === 0 && (
            <div className="text-center p-6 bg-background border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">
                Belum ada kriteria penilaian.
                {rubricIsBinding
                  ? ' Tambahkan kriteria, atau tambahkan soal berpoin di langkah sebelumnya.'
                  : ' Tidak wajib, karena penilaian sudah memakai poin soal.'}
              </p>
            </div>
          )}

          {rubricKeys.map((key, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Nama Kriteria (misal: Kualitas Kode)"
                aria-label="Nama kriteria penilaian"
                value={key}
                onChange={(e) =>
                  handleUpdateCriteria(key, e.target.value, (manualData.gradingRubric as any)[key])
                }
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  aria-label={`Bobot untuk ${key}`}
                  value={(manualData.gradingRubric as any)[key]}
                  onChange={(e) => handleUpdateCriteria(key, key, parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCriteria(key)}
                aria-label={`Hapus kriteria ${key}`}
                className="p-2.5 text-muted-foreground hover:text-red-500 bg-background border border-border rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddCriteria}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-400 mt-4"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Tambah Kriteria Baru
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              Keamanan &amp; Anti-Kecurangan
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Seberapa ketat pengawasan selama peserta mengerjakan. Tekan tanda
              tanya di tiap baris untuk melihat apa yang benar-benar dialami
              kandidat sebelum menyalakannya.
            </p>
          </div>
        </div>

        <div className="space-y-2 bg-background border border-border p-4 sm:p-6 rounded-xl">
          {PROCTORING_SETTINGS.map((setting) => (
            <div key={setting.id}>
              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id={setting.id}
                  checked={!!proctoringSettings[setting.id]}
                  onChange={(e) => updateProctoring({ [setting.id]: e.target.checked })}
                  className="mt-1 w-4 h-4 text-emerald-500 bg-background border-border rounded focus:ring-emerald-500"
                />
                <label htmlFor={setting.id} className="flex flex-col cursor-pointer flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">
                    {setting.label}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {setting.summary}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setExplainedSetting(setting)}
                  aria-label={`Penjelasan lengkap: ${setting.label}`}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                >
                  <HelpCircle className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {setting.id === 'trackTabSwitches' && !!proctoringSettings.trackTabSwitches && (
                <div className="ml-7 mt-1 mb-3">
                  <label
                    htmlFor="maxTabSwitches"
                    className="block text-xs font-medium text-muted-foreground mb-1"
                  >
                    Batas toleransi pindah tab (0 = hanya dicatat, tidak diblokir)
                  </label>
                  <input
                    id="maxTabSwitches"
                    type="number"
                    min="0"
                    max="10"
                    value={proctoringSettings.maxTabSwitches || 0}
                    onChange={(e) =>
                      updateProctoring({ maxTabSwitches: parseInt(e.target.value) || 0 })
                    }
                    className="w-24 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ProctoringInfoDialog
        setting={explainedSetting}
        onClose={() => setExplainedSetting(null)}
      />
    </div>
  );
}
