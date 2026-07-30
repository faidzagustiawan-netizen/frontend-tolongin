import React from 'react';
import { CalendarClock, KeyRound, Info } from 'lucide-react';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import {
  GateScoreBasis,
  Section,
  StageGateMode,
  StagePendingPolicy,
} from '@/types';

interface StageGateSettingsProps {
  sections: Section[];
  index: number;
  onChange: (patch: Partial<Section>) => void;
}

const GATE_MODE_LABELS: Record<StageGateMode, string> = {
  OPEN: 'Terbuka untuk semua kandidat',
  MIN_SCORE: 'Butuh nilai minimal',
  TOP_N: 'Kuota — hanya sejumlah teratas',
  MANUAL_APPROVAL: 'Perusahaan meloloskan manual',
};

const SCORE_BASIS_LABELS: Record<GateScoreBasis, string> = {
  PREVIOUS_STAGE: 'Nilai tahap sebelumnya',
  CUMULATIVE: 'Rata-rata semua tahap sebelumnya',
  SPECIFIC_STAGES: 'Tahap tertentu yang saya pilih',
};

const PENDING_POLICY_LABELS: Record<StagePendingPolicy, string> = {
  WAIT_FOR_SCORE: 'Tunggu sampai nilai keluar',
  AUTO_ADVANCE_AFTER: 'Buka otomatis bila penilaian terlambat',
  MANUAL_ONLY: 'Saya yang meloloskan, tanpa ambang otomatis',
};

const fieldClass =
  'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors';

const labelClass =
  'text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider';

/**
 * Menyusun kalimat yang menjelaskan aturan tahap ini apa adanya.
 *
 * Kombinasi syarat masuk, sumber nilai, dan perlakuan saat nilai belum siap
 * terlalu mudah disalahpahami dari kontrolnya saja — dan kekeliruannya baru
 * terlihat setelah studi kasus terbit, saat soalnya sudah tidak bisa disunting.
 * Jadi aturannya dibacakan kembali sebelum itu terjadi.
 */
export const describeStageGate = (
  section: Section,
  sections: Section[],
  index: number,
): string => {
  const name = section.title?.trim() || `Tahap ${index + 1}`;

  if (index === 0) {
    return `${name} adalah tahap pertama, jadi terbuka untuk semua kandidat yang mendaftar.`;
  }

  const sourceLabel = () => {
    switch (section.scoreBasis) {
      case 'CUMULATIVE':
        return 'rata-rata semua tahap sebelumnya';
      case 'SPECIFIC_STAGES': {
        const picked = (section.gateSourceIds ?? [])
          .map((id) => sections.find((s) => s.id === id)?.title)
          .filter(Boolean);
        return picked.length > 0
          ? `nilai ${picked.map((t) => `"${t}"`).join(' dan ')}`
          : 'nilai tahap yang belum Anda pilih';
      }
      default: {
        const previous = sections[index - 1];
        return `nilai "${previous?.title?.trim() || `Tahap ${index}`}"`;
      }
    }
  };

  const pendingNote = () => {
    const hasSubjective = (sections[index - 1]?.components ?? []).some(
      (c) => c.type !== 'MULTIPLE_CHOICE' && c.type !== 'PSYCHOMETRIC',
    );
    if (!hasSubjective) return '';

    switch (section.pendingPolicy) {
      case 'AUTO_ADVANCE_AFTER':
        return ` Nilai tahap sebelumnya butuh penilaian, jadi tahap ini terbuka otomatis setelah ${section.graceDays ?? '—'} hari bila penilaian belum selesai.`;
      case 'MANUAL_ONLY':
        return ' Nilai tahap sebelumnya butuh penilaian, dan Anda yang memutuskan siapa lanjut — tidak ada ambang otomatis.';
      default:
        return ' Nilai tahap sebelumnya butuh penilaian, jadi kandidat menunggu sampai nilainya keluar.';
    }
  };

  switch (section.gateMode) {
    case 'MIN_SCORE':
      return `Hanya kandidat dengan ${sourceLabel()} minimal ${section.minScore ?? '—'} yang bisa masuk ${name}.${pendingNote()}`;
    case 'TOP_N':
      return `Hanya ${section.maxAdvancing ?? '—'} kandidat teratas berdasarkan ${sourceLabel()} yang lanjut ke ${name}. Peringkat diumumkan setelah tahap ini ditutup.${pendingNote()}`;
    case 'MANUAL_APPROVAL':
      return `${name} hanya terbuka bagi kandidat yang Anda loloskan satu per satu.`;
    default:
      return `${name} terbuka bagi semua kandidat yang sampai di sini.`;
  }
};

/**
 * Jadwal dan syarat masuk satu tahap.
 *
 * Dipisahkan dari `QuestionBuilder` karena sifatnya berbeda: yang di atasnya
 * mengatur isi soal, yang di sini mengatur siapa yang boleh melihatnya dan
 * kapan.
 */
export default function StageGateSettings({
  sections,
  index,
  onChange,
}: StageGateSettingsProps) {
  const section = sections[index];
  const isFirstStage = index === 0;
  const gateMode: StageGateMode = section.gateMode ?? 'OPEN';
  const scoreBasis: GateScoreBasis = section.scoreBasis ?? 'PREVIOUS_STAGE';
  const pendingPolicy: StagePendingPolicy =
    section.pendingPolicy ?? 'WAIT_FOR_SCORE';

  const readsScore = gateMode === 'MIN_SCORE' || gateMode === 'TOP_N';

  // Hanya tahap yang dikerjakan lebih dulu boleh menjadi sumber nilai. Tahap
  // yang belum tersimpan tidak punya id, jadi belum bisa dirujuk sama sekali.
  const eligibleSources = sections
    .slice(0, index)
    .filter((s): s is Section & { id: string } => !!s.id);

  const toggleSource = (sourceId: string) => {
    const current = section.gateSourceIds ?? [];
    onChange({
      gateSourceIds: current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8 border-b border-border">
      <section>
        <div className="flex items-start gap-3 mb-4">
          <CalendarClock className="h-5 w-5 text-cyan-500 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="font-bold text-foreground">Jadwal Tahap</h4>
            <p className="text-xs text-muted-foreground">
              Kosongkan bila tahap ini mengikuti jendela waktu challenge.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateTimePicker
            label="Tahap Dibuka"
            value={section.opensAt ?? undefined}
            onChange={(iso) => onChange({ opensAt: iso ?? null })}
            placeholder="Ikut jadwal challenge..."
          />
          <DateTimePicker
            label="Tahap Ditutup"
            value={section.closesAt ?? undefined}
            onChange={(iso) => onChange({ closesAt: iso ?? null })}
            placeholder="Ikut batas akhir challenge..."
          />
        </div>
      </section>

      <section>
        <div className="flex items-start gap-3 mb-4">
          <KeyRound className="h-5 w-5 text-emerald-500 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="font-bold text-foreground">Syarat Masuk</h4>
            <p className="text-xs text-muted-foreground">
              Siapa yang boleh mengerjakan tahap ini.
            </p>
          </div>
        </div>

        {isFirstStage ? (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">
            Tahap pertama selalu terbuka untuk semua kandidat — syarat apa pun di
            sini akan menutup studi kasus untuk semua orang.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor={`gate-mode-${index}`} className={labelClass}>
                Syarat
              </label>
              <select
                id={`gate-mode-${index}`}
                value={gateMode}
                onChange={(e) =>
                  onChange({ gateMode: e.target.value as StageGateMode })
                }
                className={`${fieldClass} font-semibold`}
              >
                {Object.entries(GATE_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {readsScore && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gateMode === 'MIN_SCORE' && (
                    <div>
                      <label htmlFor={`min-score-${index}`} className={labelClass}>
                        Nilai Minimal (0-100)
                      </label>
                      <input
                        id={`min-score-${index}`}
                        type="number"
                        min={0}
                        max={100}
                        value={section.minScore ?? ''}
                        onChange={(e) =>
                          onChange({
                            minScore:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className={fieldClass}
                        placeholder="Contoh: 70"
                      />
                    </div>
                  )}

                  {gateMode === 'TOP_N' && (
                    <div>
                      <label
                        htmlFor={`max-advancing-${index}`}
                        className={labelClass}
                      >
                        Jumlah Kandidat yang Lolos
                      </label>
                      <input
                        id={`max-advancing-${index}`}
                        type="number"
                        min={1}
                        value={section.maxAdvancing ?? ''}
                        onChange={(e) =>
                          onChange({
                            maxAdvancing:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className={fieldClass}
                        placeholder="Contoh: 10"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Peringkat baru bisa diputuskan setelah tahap ditutup, jadi
                        <strong> Tahap Ditutup wajib diisi</strong> di atas.
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor={`score-basis-${index}`} className={labelClass}>
                      Nilai yang Dipakai
                    </label>
                    <select
                      id={`score-basis-${index}`}
                      value={scoreBasis}
                      onChange={(e) =>
                        onChange({
                          scoreBasis: e.target.value as GateScoreBasis,
                        })
                      }
                      className={fieldClass}
                    >
                      {Object.entries(SCORE_BASIS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {scoreBasis === 'SPECIFIC_STAGES' && (
                  <div>
                    <span className={labelClass}>Tahap Sumber Nilai</span>
                    {eligibleSources.length === 0 ? (
                      <p className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        Belum ada tahap sebelumnya yang tersimpan. Simpan draf
                        dulu, lalu tahapnya bisa dipilih di sini.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {eligibleSources.map((source, sourceIdx) => {
                          const picked = (section.gateSourceIds ?? []).includes(
                            source.id,
                          );
                          return (
                            <button
                              key={source.id}
                              type="button"
                              onClick={() => toggleSource(source.id)}
                              aria-pressed={picked}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                picked
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {source.title?.trim() || `Tahap ${sourceIdx + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor={`pending-policy-${index}`}
                      className={labelClass}
                    >
                      Bila Nilai Belum Keluar
                    </label>
                    <select
                      id={`pending-policy-${index}`}
                      value={pendingPolicy}
                      onChange={(e) =>
                        onChange({
                          pendingPolicy: e.target.value as StagePendingPolicy,
                        })
                      }
                      className={fieldClass}
                    >
                      {Object.entries(PENDING_POLICY_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Soal esai, unggahan, dan rekaman butuh penilaian AI atau
                      manusia — nilainya tidak keluar seketika seperti pilihan
                      ganda.
                    </p>
                  </div>

                  {pendingPolicy === 'AUTO_ADVANCE_AFTER' && (
                    <div>
                      <label htmlFor={`grace-days-${index}`} className={labelClass}>
                        Buka Otomatis Setelah (hari)
                      </label>
                      <input
                        id={`grace-days-${index}`}
                        type="number"
                        min={1}
                        max={90}
                        value={section.graceDays ?? ''}
                        onChange={(e) =>
                          onChange({
                            graceDays:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className={fieldClass}
                        placeholder="Contoh: 3"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Ambang nilai dilewati bila penilaian belum selesai. Itu
                        harganya supaya kandidat tidak terjebak menunggu.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
        <Info className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground leading-relaxed">
          {describeStageGate(section, sections, index)}
        </p>
      </div>
    </div>
  );
}
