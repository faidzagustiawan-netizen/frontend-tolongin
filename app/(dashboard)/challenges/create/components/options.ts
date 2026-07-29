import { CreateChallengePayload } from '@/services/challenges.service';

export type ChallengeCategoryValue = CreateChallengePayload['category'];
export type ChallengeDifficultyValue = CreateChallengePayload['difficulty'];

/**
 * Daftar kategori dan tingkat kesulitan dipakai di tiga layar sekaligus
 * (konteks pembuka, formulir manual, formulir AI). Sebelumnya masing-masing
 * menuliskan sendiri daftar <option>-nya, jadi menambah satu kategori berarti
 * mengingat tiga tempat — dan yang terlewat baru ketahuan sebagai galat enum
 * dari backend.
 */
export const CATEGORY_OPTIONS: { value: ChallengeCategoryValue; label: string }[] = [
  { value: 'FRONTEND', label: 'Frontend Development' },
  { value: 'BACKEND', label: 'Backend Development' },
  { value: 'UI_UX', label: 'UI/UX Design' },
  { value: 'DATA_SCIENCE', label: 'Data Science / ML' },
  { value: 'MARKETING', label: 'Digital Marketing' },
  { value: 'PRODUCT', label: 'Product Management' },
];

export const DIFFICULTY_OPTIONS: { value: ChallengeDifficultyValue; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner (Pemanasan untuk pemula yang baru belajar)' },
  { value: 'INTERMEDIATE', label: 'Intermediate (Tantangan menengah, butuh pemahaman kuat)' },
  { value: 'ADVANCED', label: 'Advanced (Misi kompleks untuk penyelesaian masalah tingkat tinggi)' },
];

/** Label pendek untuk penanda dan ringkasan, tanpa penjelasan dalam kurung. */
export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  UI_UX: 'UI/UX',
  DATA_SCIENCE: 'Data Science',
  MARKETING: 'Marketing',
  PRODUCT: 'Product',
};

export const DIFFICULTY_SHORT_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

/**
 * Konteks pembuka: apa yang dicari perusahaan, bukan bagaimana cara membuatnya.
 * Dipakai untuk menyaring template, mengisi prompt AI, dan menyemai formulir
 * manual — jadi jawaban di sini tidak hangus apa pun jalur yang dipilih.
 */
export type ChallengeContext = {
  role: string;
  category: ChallengeCategoryValue;
  difficulty: ChallengeDifficultyValue;
  deadlineAt?: string;
};

export const EMPTY_CONTEXT: ChallengeContext = {
  role: '',
  category: 'FRONTEND',
  difficulty: 'INTERMEDIATE',
};
