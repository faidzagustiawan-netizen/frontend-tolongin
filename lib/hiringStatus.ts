import type { HiringStatus } from '@/services/submissions.service';

/**
 * Satu kosakata tahap rekrutmen untuk seluruh layar perusahaan.
 *
 * Sebelumnya label tahap hanya ada sebagai teks `<option>` di dalam formulir
 * penilaian, jadi daftar kandidat menampilkan nilai enum mentah seperti
 * `INTERVIEW_INVITED`.
 */

export interface HiringStageMeta {
  value: HiringStatus;
  label: string;
  /** Penjelasan singkat untuk rekruter saat memilih tahap. */
  hint: string;
  /** Kelas warna badge. Latar boleh pekat; yang menentukan keterbacaan adalah teksnya. */
  className: string;
  /** true bila perpindahan ke tahap ini mengirim pemberitahuan ke kandidat. */
  notifiesTalent: boolean;
}

export const HIRING_STAGES: HiringStageMeta[] = [
  {
    value: 'NONE',
    label: 'Belum Ditentukan',
    hint: 'Belum masuk proses rekrutmen.',
    className: 'bg-foreground/10 text-muted-foreground border-border',
    notifiesTalent: false,
  },
  {
    value: 'SHORTLISTED',
    label: 'Daftar Pendek',
    hint: 'Disimpan untuk ditinjau lebih lanjut. Kandidat tidak diberi tahu.',
    className: 'bg-info/10 text-info border-info/30',
    notifiesTalent: false,
  },
  {
    value: 'INTERVIEW_INVITED',
    label: 'Diundang Wawancara',
    hint: 'Kandidat menerima pemberitahuan undangan wawancara.',
    className: 'bg-warning/10 text-warning border-warning/30',
    notifiesTalent: true,
  },
  {
    value: 'HIRED',
    label: 'Diterima Kerja',
    hint: 'Kandidat menerima pemberitahuan bahwa ia diterima.',
    className: 'bg-success/10 text-success border-success/30',
    notifiesTalent: true,
  },
  {
    value: 'REJECTED',
    label: 'Tidak Dilanjutkan',
    hint: 'Kandidat menerima pemberitahuan bahwa prosesnya selesai.',
    className: 'bg-danger/10 text-danger border-danger/30',
    notifiesTalent: true,
  },
];

const STAGE_BY_VALUE = new Map(
  HIRING_STAGES.map((stage) => [stage.value, stage]),
);

export function getHiringStage(value?: string | null): HiringStageMeta {
  return STAGE_BY_VALUE.get((value as HiringStatus) ?? 'NONE') ?? HIRING_STAGES[0];
}

/**
 * Tahap yang membuka kontak kandidat. Dicerminkan dari aturan yang sama di
 * `getSubmissionForCompany` pada backend.
 */
export const CONTACT_UNLOCKED_STAGES: HiringStatus[] = [
  'SHORTLISTED',
  'INTERVIEW_INVITED',
  'HIRED',
];
