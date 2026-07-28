/**
 * Penyimpanan draf pembuatan challenge di localStorage.
 *
 * Kuncinya dulu global (`draftChallenge`, `aiDraftState`), sehingga dua akun
 * yang memakai peramban yang sama saling melihat draf satu sama lain: keluar
 * lalu masuk sebagai orang lain akan memuat pekerjaan pengguna sebelumnya ke
 * dalam formulir, dan penyimpanan berikutnya menimpanya.
 */

const MANUAL_DRAFT_PREFIX = 'draftChallenge';
const AI_DRAFT_PREFIX = 'aiDraftState';

export const manualDraftKey = (userId: string) =>
  `${MANUAL_DRAFT_PREFIX}:${userId}`;

export const aiDraftKey = (userId: string) => `${AI_DRAFT_PREFIX}:${userId}`;

export function readDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Isi yang rusak tidak ada gunanya dipertahankan.
    localStorage.removeItem(key);
    return null;
  }
}

export function writeDraft(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kuota localStorage penuh. Draf otomatis bersifat kenyamanan, bukan
    // sumber kebenaran, jadi kegagalannya tidak perlu mengganggu pengguna.
  }
}

export function clearDraft(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * Membuang seluruh draf challenge milik peramban ini, termasuk kunci lama yang
 * belum berlabel pengguna. Dipanggil saat keluar.
 */
export function clearAllChallengeDrafts() {
  if (typeof window === 'undefined') return;
  const stale = Object.keys(localStorage).filter(
    (key) =>
      key === MANUAL_DRAFT_PREFIX ||
      key === AI_DRAFT_PREFIX ||
      key.startsWith(`${MANUAL_DRAFT_PREFIX}:`) ||
      key.startsWith(`${AI_DRAFT_PREFIX}:`),
  );
  stale.forEach((key) => localStorage.removeItem(key));
}
