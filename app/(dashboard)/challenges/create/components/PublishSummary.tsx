import React from 'react';
import {
  CalendarClock,
  FileText,
  Layers,
  Link2,
  Pencil,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { DIFFICULTY_SHORT_LABELS, categoryLabel } from './options';
import { PROCTORING_SETTINGS } from './proctoringCatalog';
import { describeStageGate } from './StageGateSettings';
import { Section } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Pilihan Ganda',
  ESSAY: 'Essay',
  LIVE_CODING: 'Live Coding',
  FILE_UPLOAD: 'Unggah Berkas',
  URL_SUBMISSION: 'Tautan URL',
  VIDEO_UPLOAD: 'Video / Audio',
  PSYCHOMETRIC: 'Psikotes',
};

const RUBRIC_SYSTEM_KEYS = [
  'proctoringSettings',
  'customOutputs',
  'durationHours',
  'requireProctoring',
];

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return 'Tak terbatas';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0) return `${hours} jam${rest > 0 ? ` ${rest} mnt` : ''}`;
  return `${rest} menit`;
};

/**
 * Didefinisikan di luar komponen induk. Fungsi komponen yang dibuat ulang di
 * dalam render menghasilkan tipe baru setiap kali, sehingga React melepas dan
 * memasang ulang seluruh isinya alih-alih memperbaruinya.
 */
function SummaryCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-primary hover:underline underline-offset-4 flex items-center gap-1 flex-shrink-0"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" /> Ubah
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-500">{children}</span>;
}

interface PublishSummaryProps {
  manualData: CreateChallengePayload;
  /** Melompat ke langkah tertentu untuk memperbaiki bagian yang kurang. */
  onJumpTo: (
    tab: 'BASICS' | 'SCHEDULE' | 'QUESTIONS' | 'SCORING' | 'PREVIEW' | 'PUBLISH',
  ) => void;
}

/**
 * Rekap seluruh isi studi kasus sebelum diterbitkan.
 *
 * Versi sebelumnya hanya menampilkan judul, kategori, jumlah seksi, dan jumlah
 * soal — empat angka yang tidak cukup untuk memutuskan apa pun. Jadwal, aset,
 * bobot penilaian, dan pengaturan pengawasan tidak terlihat sama sekali di
 * layar terakhir sebelum studi kasus jadi permanen, padahal keempatnya
 * langsung menentukan pengalaman kandidat.
 */
export default function PublishSummary({ manualData, onJumpTo }: PublishSummaryProps) {
  const sections = manualData.sections || [];
  const totalComponents = sections.reduce(
    (acc, sec) => acc + (sec.components?.length || 0),
    0,
  );

  const scoredComponents = sections.flatMap((sec) =>
    (sec.components || []).filter((c: any) => c.type !== 'PSYCHOMETRIC'),
  );
  const totalPoints = scoredComponents.reduce(
    (acc, c: any) => acc + (Number(c.points) || 0),
    0,
  );
  const psychometricCount = totalComponents - scoredComponents.length;

  const totalTimeLimit = sections.reduce(
    (acc, sec) => acc + (Number(sec.timeLimit) || 0),
    0,
  );

  const startsAt = formatDate(manualData.startsAt);
  const deadlineAt = formatDate(manualData.deadlineAt);

  const assets = [
    { label: 'Dataset', url: manualData.datasetUrl },
    { label: 'Mock API', url: manualData.mockApiUrl },
    { label: 'Panduan Merek', url: manualData.brandGuidelineUrl },
  ].filter((asset) => !!asset.url);

  const rubricEntries = Object.entries(manualData.gradingRubric || {}).filter(
    ([key]) => !RUBRIC_SYSTEM_KEYS.includes(key),
  );
  const rubricTotal = rubricEntries.reduce(
    (acc, [, value]) => acc + (Number(value) || 0),
    0,
  );

  const proctoringSettings = (manualData.proctoringSettings ||
    (manualData.gradingRubric as any)?.proctoringSettings ||
    {}) as Record<string, any>;
  const activeProctoring = PROCTORING_SETTINGS.filter(
    (setting) => !!proctoringSettings[setting.id],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SummaryCard
        icon={<FileText className="w-4 h-4 text-primary" aria-hidden="true" />}
        title="Informasi Dasar"
        onEdit={() => onJumpTo('BASICS')}
      >
        <Row
          label="Judul"
          value={manualData.title || <Missing>Belum diisi</Missing>}
        />
        <Row label="Bidang" value={categoryLabel(manualData.category)} />
        <Row
          label="Tingkat kesulitan"
          value={DIFFICULTY_SHORT_LABELS[manualData.difficulty] ?? manualData.difficulty}
        />
        <Row
          label="Ringkasan"
          value={
            manualData.summary ? (
              `${manualData.summary.length} karakter`
            ) : (
              <Missing>Belum diisi</Missing>
            )
          }
        />
        <Row
          label="Deskripsi"
          value={
            manualData.description ? (
              `${manualData.description.length} karakter`
            ) : (
              <Missing>Belum diisi</Missing>
            )
          }
        />
      </SummaryCard>

      <SummaryCard
        icon={<CalendarClock className="w-4 h-4 text-primary" aria-hidden="true" />}
        title="Jadwal & Aset"
        onEdit={() => onJumpTo('SCHEDULE')}
      >
        <Row
          label="Mulai"
          value={startsAt ?? 'Segera setelah diterbitkan'}
        />
        <Row
          label="Batas akhir"
          value={deadlineAt ?? <Missing>Belum ditentukan</Missing>}
        />
        <Row
          label="Aset terlampir"
          value={
            assets.length > 0 ? (
              <span className="flex flex-wrap justify-end gap-1.5">
                {assets.map((asset) => (
                  <span
                    key={asset.label}
                    className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/20 flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" aria-hidden="true" />
                    {asset.label}
                  </span>
                ))}
              </span>
            ) : (
              'Tidak ada'
            )
          }
        />
        <Row
          label="Visibilitas"
          value={manualData.isPrivate ? 'Privat (hanya via undangan)' : 'Publik di direktori'}
        />
      </SummaryCard>

      <SummaryCard
        icon={<Layers className="w-4 h-4 text-primary" aria-hidden="true" />}
        title="Tahapan & Soal"
        onEdit={() => onJumpTo('QUESTIONS')}
      >
        {sections.length === 0 ? (
          <p className="text-sm text-amber-500">
            Belum ada tahap. Studi kasus tidak bisa diterbitkan tanpa satu pun tahap.
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {sections.map((section, idx) => {
                const components = section.components || [];
                const typeCounts = components.reduce<Record<string, number>>((acc, c: any) => {
                  acc[c.type] = (acc[c.type] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-3"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {section.title || `Tahap ${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDuration(Number(section.timeLimit) || 0)}
                      </span>
                    </div>
                    {components.length === 0 ? (
                      <p className="text-[11px] text-amber-500">Belum ada soal</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(typeCounts).map(([type, count]) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 bg-foreground/5 text-muted-foreground text-[10px] rounded-full"
                          >
                            {TYPE_LABELS[type] ?? type} × {count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Syarat masuk dibacakan kembali di sini karena inilah
                        layar terakhir sebelum terbit — dan sesudah terbit,
                        soalnya tidak bisa disunting lagi. */}
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {describeStageGate(
                        section as Section,
                        sections as Section[],
                        idx,
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            <Row label="Total tahap" value={`${sections.length} tahap`} />
            <Row label="Total soal" value={`${totalComponents} soal`} />
            <Row label="Total poin" value={`${totalPoints} poin`} />
            {psychometricCount > 0 && (
              <Row
                label="Soal psikotes"
                value={`${psychometricCount} soal (tidak berpoin)`}
              />
            )}
            <Row
              label="Total durasi tahap"
              value={formatDuration(totalTimeLimit)}
            />
          </>
        )}
      </SummaryCard>

      <SummaryCard
        icon={<PieChart className="w-4 h-4 text-primary" aria-hidden="true" />}
        title="Penilaian & Keamanan"
        onEdit={() => onJumpTo('SCORING')}
      >
        <Row
          label="Dasar penilaian"
          value={
            totalComponents > 0
              ? 'Poin per soal'
              : rubricEntries.length > 0
                ? 'Rubrik holistik'
                : 'Belum ditentukan'
          }
        />

        {rubricEntries.length > 0 && (
          <>
            <div className="py-2 space-y-1">
              {rubricEntries.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">{key}</span>
                  <span className="text-xs text-foreground font-medium">
                    {Number(value) || 0}%
                  </span>
                </div>
              ))}
            </div>
            <Row
              label="Total bobot"
              value={
                totalComponents === 0 && rubricTotal !== 100 ? (
                  <Missing>{rubricTotal}% (harus 100%)</Missing>
                ) : (
                  `${rubricTotal}%`
                )
              }
            />
          </>
        )}

        <div className="pt-3 mt-2 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Pengawasan aktif</span>
          </div>
          {activeProctoring.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Tidak ada. Kandidat mengerjakan tanpa pengawasan tambahan.
            </p>
          ) : (
            <ul className="space-y-1">
              {activeProctoring.map((setting) => (
                <li key={setting.id} className="text-xs text-foreground flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1 w-1 rounded-full bg-red-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {setting.label}
                    {setting.id === 'trackTabSwitches' && (
                      <span className="text-muted-foreground">
                        {' '}
                        — batas{' '}
                        {(Number(proctoringSettings.maxTabSwitches) || 0) === 0
                          ? 'hanya dicatat'
                          : `${proctoringSettings.maxTabSwitches}×`}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SummaryCard>
    </div>
  );
}
