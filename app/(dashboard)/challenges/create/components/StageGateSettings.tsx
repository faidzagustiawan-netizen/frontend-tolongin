import React, { useState } from 'react';
import { CalendarClock, ChevronDown, ChevronRight, KeyRound, Info } from 'lucide-react';
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

/**
 * Pilihan syarat masuk sebagai keputusan, bukan sebagai kolom.
 *
 * Sebelumnya ini `<select>` berisi empat nilai enum, diikuti empat kolom lain
 * yang harus ditafsirkan hubungannya sendiri. Yang sebenarnya diputuskan
 * perusahaan cuma satu: bagaimana kandidat disaring. Sisanya konsekuensi.
 */
const GATE_PRESETS: {
  mode: StageGateMode;
  label: string;
  hint: string;
}[] = [
  {
    mode: 'OPEN',
    label: 'Semua lanjut',
    hint: 'Siapa pun yang selesai tahap sebelumnya boleh masuk.',
  },
  {
    mode: 'MIN_SCORE',
    label: 'Lolos nilai minimal',
    hint: 'Ada ambang nilai. Yang di bawahnya berhenti di sini.',
  },
  {
    mode: 'TOP_N',
    label: 'Ambil sejumlah terbaik',
    hint: 'Kuota. Peringkat baru bisa dihitung setelah tahap ditutup.',
  },
  {
    mode: 'MANUAL_APPROVAL',
    label: 'Saya pilih sendiri',
    hint: 'Tanpa ambang otomatis; Anda meloloskan satu per satu.',
  },
];

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
 *
 * Kalimat ini juga yang dipakai sebagai ringkasan saat panelnya tertutup, jadi
 * menyembunyikan kontrolnya tidak berarti menyembunyikan aturannya.
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

/** Ringkasan jadwal tahap dalam satu penggal kalimat. */
const describeStageSchedule = (section: Section): string => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (section.opensAt && section.closesAt)
    return `Dibuka ${fmt(section.opensAt)} sampai ${fmt(section.closesAt)}.`;
  if (section.opensAt) return `Dibuka ${fmt(section.opensAt)}.`;
  if (section.closesAt) return `Ditutup ${fmt(section.closesAt)}.`;
  return 'Jadwalnya mengikuti jendela waktu challenge.';
};

/**
 * Jadwal dan syarat masuk satu tahap.
 *
 * Tertutup secara bawaan, dan diletakkan SESUDAH daftar soal.
 *
 * Sebelumnya sebelas kolom ini terbentang di atas daftar soal, di setiap tahap.
 * Padahal sembilan di antaranya mengatur kelulusan antar-tahap — keputusan yang
 * baru bisa dijawab setelah soalnya ada, bukan sebelum. Alasan yang sama sudah
 * memindahkan langkah Penilaian ke belakang; bagian ini tertinggal.
 *
 * Yang tertutup hanyalah kontrolnya. Aturan yang berlaku tetap terbaca sebagai
 * kalimat di bilah ringkasannya.
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

  const [isOpen, setIsOpen] = useState(false);

  // Pengaturan rinci yang sudah menyimpang dari bawaan tidak boleh ikut
  // tersembunyi — draf yang dimuat ulang akan tampak seperti tidak punya
  // aturan sama sekali.
  const [showAdvanced, setShowAdvanced] = useState(
    scoreBasis !== 'PREVIOUS_STAGE' ||
      pendingPolicy !== 'WAIT_FOR_SCORE' ||
      (section.gateSourceIds?.length ?? 0) > 0 ||
      section.graceDays != null,
  );

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

  /**
   * Menerapkan satu preset syarat masuk.
   *
   * Kolom milik preset lain ikut dikosongkan supaya nilai sisa dari percobaan
   * sebelumnya tidak menggantung dan terkirim ke backend.
   */
  const applyPreset = (mode: StageGateMode) => {
    onChange({
      gateMode: mode,
      minScore: mode === 'MIN_SCORE' ? (section.minScore ?? 70) : null,
      maxAdvancing: mode === 'TOP_N' ? (section.maxAdvancing ?? 10) : null,
    });
  };

  const summary = describeStageGate(section, sections, index);

  return (
    <div className="border-t border-border bg-card/40">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-8">
        {/* Bilah ringkasan. Aturan yang berlaku selalu terbaca di sini, terbuka
            maupun tertutup. */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="w-full flex items-start gap-3 py-5 text-left group"
        >
          <KeyRound
            className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-sm mb-0.5">
              Jadwal &amp; syarat masuk tahap ini
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {summary} {describeStageSchedule(section)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground group-hover:text-foreground flex-shrink-0 pt-0.5">
            {isOpen ? 'Tutup' : 'Atur'}
            {isOpen ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {isOpen && (
          <div className="pb-8 space-y-8">
            <section>
              <div className="flex items-start gap-3 mb-4">
                <CalendarClock
                  className="h-5 w-5 text-cyan-500 mt-0.5"
                  aria-hidden="true"
                />
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

            {isFirstStage ? (
              <p className="text-sm text-muted-foreground bg-background border border-border rounded-xl p-4">
                Tahap pertama selalu terbuka untuk semua kandidat — syarat apa
                pun di sini akan menutup studi kasus untuk semua orang.
              </p>
            ) : (
              <section className="space-y-6">
                <div>
                  <span className={labelClass}>Siapa yang boleh masuk</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GATE_PRESETS.map((preset) => {
                      const picked = gateMode === preset.mode;
                      return (
                        <button
                          key={preset.mode}
                          type="button"
                          onClick={() => applyPreset(preset.mode)}
                          aria-pressed={picked}
                          className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                            picked
                              ? 'bg-emerald-500/10 border-emerald-500/50'
                              : 'bg-background border-border hover:border-foreground/25'
                          }`}
                        >
                          <span
                            className={`block text-sm font-bold mb-0.5 ${
                              picked ? 'text-emerald-500' : 'text-foreground'
                            }`}
                          >
                            {preset.label}
                          </span>
                          <span className="block text-xs text-muted-foreground leading-relaxed">
                            {preset.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {gateMode === 'MIN_SCORE' && (
                  <div className="max-w-xs">
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
                            e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className={fieldClass}
                      placeholder="Contoh: 70"
                    />
                  </div>
                )}

                {gateMode === 'TOP_N' && (
                  <div className="max-w-xs">
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
                            e.target.value === '' ? null : Number(e.target.value),
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

                {/* Sumber nilai dan perlakuan saat penilaian belum selesai punya
                    bawaan yang benar untuk hampir semua kasus. Ditawarkan, tidak
                    ditanyakan. */}
                {readsScore && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((prev) => !prev)}
                      aria-expanded={showAdvanced}
                      className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      {showAdvanced ? (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Atur lebih rinci
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-6 border-l-2 border-border pl-4">
                        <div>
                          <label
                            htmlFor={`score-basis-${index}`}
                            className={labelClass}
                          >
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
                            className={`${fieldClass} max-w-md`}
                          >
                            {Object.entries(SCORE_BASIS_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        {scoreBasis === 'SPECIFIC_STAGES' && (
                          <div>
                            <span className={labelClass}>Tahap Sumber Nilai</span>
                            {eligibleSources.length === 0 ? (
                              <p className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                Belum ada tahap sebelumnya yang tersimpan. Simpan
                                draf dulu, lalu tahapnya bisa dipilih di sini.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {eligibleSources.map((source, sourceIdx) => {
                                  const picked = (
                                    section.gateSourceIds ?? []
                                  ).includes(source.id);
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
                                      {source.title?.trim() ||
                                        `Tahap ${sourceIdx + 1}`}
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
                                  pendingPolicy: e.target
                                    .value as StagePendingPolicy,
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
                              Soal esai, unggahan, dan rekaman butuh penilaian AI
                              atau manusia — nilainya tidak keluar seketika
                              seperti pilihan ganda.
                            </p>
                          </div>

                          {pendingPolicy === 'AUTO_ADVANCE_AFTER' && (
                            <div>
                              <label
                                htmlFor={`grace-days-${index}`}
                                className={labelClass}
                              >
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
                                Ambang nilai dilewati bila penilaian belum
                                selesai. Itu harganya supaya kandidat tidak
                                terjebak menunggu.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <div className="flex items-start gap-3 bg-background border border-border rounded-xl p-4">
              <Info
                className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
