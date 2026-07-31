import { CreateChallengePayload } from '@/services/challenges.service';

export type ChallengeCategoryValue = CreateChallengePayload['category'];
export type ChallengeDifficultyValue = CreateChallengePayload['difficulty'];

/**
 * Bidang pekerjaan tidak lagi punya daftar tetap.
 *
 * Dulu enam pilihan yang ditulis tangan di sini plus "Bidang lain": perusahaan
 * yang mencari Video Editor atau Akuntan terpaksa mengaku salah satu bidang
 * yang bukan bidangnya. Sekarang bidang diambil dari direktori keahlian yang
 * sama dengan yang dipakai profil talenta, dan bidang yang belum ada bisa
 * ditambahkan sendiri lewat `CategoryPicker` — lihat
 * `skillsService.resolveCategory`, yang membedakan salah ketik dari bidang yang
 * memang baru.
 *
 * Tingkat kesulitan tetap tertutup: tiga nilainya adalah enum basis data dan
 * mengubahnya bukan urusan perusahaan.
 */
export const DIFFICULTY_OPTIONS: { value: ChallengeDifficultyValue; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner (Pemanasan untuk pemula yang baru belajar)' },
  { value: 'INTERMEDIATE', label: 'Intermediate (Tantangan menengah, butuh pemahaman kuat)' },
  { value: 'ADVANCED', label: 'Advanced (Misi kompleks untuk penyelesaian masalah tingkat tinggi)' },
];

export const DIFFICULTY_SHORT_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

/** Label bidang untuk penanda dan ringkasan; kosong berarti lintas bidang. */
export const categoryLabel = (category?: string | null): string =>
  category?.trim() || 'Lintas bidang';

/**
 * Konteks pembuka: apa yang dicari perusahaan, bukan bagaimana cara membuatnya.
 * Dipakai untuk menyaring template, mengisi prompt AI, dan menyemai formulir
 * manual — jadi jawaban di sini tidak hangus apa pun jalur yang dipilih.
 */
export type ChallengeContext = {
  role: string;
  category: string;
  difficulty: ChallengeDifficultyValue;
  deadlineAt?: string;
};

export const EMPTY_CONTEXT: ChallengeContext = {
  role: '',
  category: '',
  difficulty: 'INTERMEDIATE',
};
