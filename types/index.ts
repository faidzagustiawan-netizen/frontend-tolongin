export interface User {
  id: string;
  email: string;
  role: 'TALENT' | 'COMPANY' | 'ADMIN';
  /** Pemilik akun perusahaan; akun undangan selalu false. */
  isCompanyOwner?: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  id?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  companyName?: string;
  website?: string;
  experiences?: any[];
  educations?: any[];
  [key: string]: unknown;
}

export interface ComponentData {
  id?: string;
  type: string;
  question: string;
  description?: string;
  points?: number;
  order?: number;
  options?: unknown;
  metadata?: unknown;
  /**
   * Jejak asal bila soal ini dipungut dari bank. Isinya sudah disalin ke
   * kolom di atas — id ini hanya untuk menelusuri soal mana dipakai di mana.
   */
  sourceItemId?: string;
  [key: string]: unknown;
}

/** Syarat masuk sebuah tahap. Cocok dengan enum `StageGateMode` di backend. */
export type StageGateMode = 'OPEN' | 'MIN_SCORE' | 'TOP_N' | 'MANUAL_APPROVAL';

/** Nilai mana yang dibandingkan dengan ambang lolos. */
export type GateScoreBasis =
  | 'PREVIOUS_STAGE'
  | 'CUMULATIVE'
  | 'SPECIFIC_STAGES';

/**
 * Perlakuan ketika nilai tahap sumber belum siap. Tahap berisi esai atau tugas
 * tidak punya nilai sampai AI atau manusia menilainya, jadi gerbang berbasis
 * nilai selalu punya jeda; ini yang menentukan apa yang terjadi selama jeda itu.
 */
export type StagePendingPolicy =
  | 'WAIT_FOR_SCORE'
  | 'AUTO_ADVANCE_AFTER'
  | 'MANUAL_ONLY';

export interface Section {
  id?: string;
  title: string;
  description?: string;
  order: number;
  timeLimit?: number | null;
  stageType?: 'QUIZ' | 'ASSIGNMENT';

  /** Jendela buka-tutup tahap ini, di dalam jendela global challenge. */
  opensAt?: string | null;
  closesAt?: string | null;

  gateMode?: StageGateMode;
  minScore?: number | null;
  maxAdvancing?: number | null;
  scoreBasis?: GateScoreBasis;
  /**
   * Tahap yang nilainya dipakai ketika `scoreBasis === 'SPECIFIC_STAGES'`.
   * Menyimpan id tahap, jadi hanya tahap yang sudah tersimpan bisa dirujuk.
   */
  gateSourceIds?: string[];
  pendingPolicy?: StagePendingPolicy;
  graceDays?: number | null;

  components: ComponentData[];
}

export interface Challenge {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  description: string;
  category: 'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  datasetUrl?: string;
  mockApiUrl?: string;
  brandGuidelineUrl?: string;
  rewardDescription?: string;
  deadlineAt?: string;
  gradingRubric?: Record<string, unknown>;
  sections?: Section[];
  status?: 'DRAFT' | 'PUBLISHED';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmissionResponse {
  componentId: string;
  value: string | number | boolean | Record<string, unknown> | null;
}

export interface Enrollment {
  id: string;
  challengeId: string;
  talentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';
  score?: number | null;
  responses?: SubmissionResponse[];
  startedAt?: string;
  submittedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  talent: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  challenge?: Partial<Challenge>;
}

export interface Discussion {
  id: string;
  message: string;
  authorId: string;
  parentId?: string;
  createdAt: string;
  author?: UserProfile;
  replies?: Discussion[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}
