/**
 * Kolom profil yang dibaca antarmuka. Sengaja longgar: bentuknya berbeda-beda
 * antara talenta dan perusahaan, dan yang membacanya selalu satu-dua kolom.
 *
 * Bentuk penggunanya sendiri ada di `UserData` (`store/userStore.ts`) — di
 * sinilah dulu ada `User` kedua yang tidak pernah diimpor siapa pun dan
 * perlahan menyimpang dari yang dipakai.
 */
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

/*
 * Pernah ada di sini: `User`, `Challenge`, `Enrollment`, `LeaderboardEntry`,
 * `Discussion`, `SubscriptionPlan`, `SubmissionResponse`. Tidak satu pun
 * pernah dipakai.
 *
 * Karena tidak dipakai, tidak ada yang menyadari ketika isinya menyimpang dari
 * basis data: `Enrollment.status` kehilangan `ENROLLED` — justru status awal
 * setiap pendaftaran — dan `DROPPED`, sementara `Challenge.status` kehilangan
 * `CLOSED`. Definisi yang benar dan memang dipakai ada di berkas layanan yang
 * bersangkutan, sedekat mungkin dengan permintaan yang memakainya:
 * `CreateChallengePayload` di `services/challenges.service.ts`,
 * `LeaderboardEntry` di `services/portfolios.service.ts`, `StageView` di
 * `services/stages.service.ts`.
 *
 * Berkas ini kini hanya menyisakan bentuk penyusun studi kasus yang memang
 * dipakai bersama lintas layar: `UserProfile`, `ComponentData`, `Section`, dan
 * ketiga enum gerbang tahap.
 */
