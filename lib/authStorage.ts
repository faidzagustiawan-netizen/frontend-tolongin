/**
 * Satu pintu untuk penyimpanan sesi di peramban.
 *
 * Sebelumnya `access_token` dan `user_data` ditulis dan dibaca langsung dengan
 * `localStorage` di 19 tempat, dan kotak centang "Ingat saya" di halaman masuk
 * tidak tersambung ke apa pun — dicentang atau tidak, sesinya sama-sama
 * bertahan selamanya. Di sini pilihan itu jadi nyata: tanpa "Ingat saya" sesi
 * disimpan di `sessionStorage` sehingga berakhir saat tab ditutup.
 *
 * Pembacaan selalu memeriksa `sessionStorage` lebih dulu supaya sesi sementara
 * menang atas sisa sesi lama yang mungkin masih tertinggal di `localStorage`.
 */

export const AUTH_TOKEN_KEY = 'access_token';
export const AUTH_USER_KEY = 'user_data';

const hasWindow = () => typeof window !== 'undefined';

/** Tempat sesi aktif berada, atau null bila belum ada sesi. */
function activeStore(): Storage | null {
  if (!hasWindow()) return null;
  if (window.sessionStorage.getItem(AUTH_TOKEN_KEY)) return window.sessionStorage;
  if (window.localStorage.getItem(AUTH_TOKEN_KEY)) return window.localStorage;
  return null;
}

export function readAuthToken(): string | null {
  if (!hasWindow()) return null;
  return (
    window.sessionStorage.getItem(AUTH_TOKEN_KEY) ??
    window.localStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export function readStoredUserRaw(): string | null {
  if (!hasWindow()) return null;
  return (
    window.sessionStorage.getItem(AUTH_USER_KEY) ??
    window.localStorage.getItem(AUTH_USER_KEY)
  );
}

/**
 * @param remember true menyimpan sesi lintas penutupan peramban.
 */
export function persistAuthSession(
  token: string,
  user: unknown,
  remember: boolean,
) {
  if (!hasWindow()) return;
  // Sisa sesi di tempat penyimpanan yang lain selalu dibuang, kalau tidak
  // pembacaan berikutnya bisa mengambil identitas akun sebelumnya.
  clearAuthSession();
  const store = remember ? window.localStorage : window.sessionStorage;
  store.setItem(AUTH_TOKEN_KEY, token);
  store.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/** Memperbarui potret pengguna tanpa memindahkan sesi antar-penyimpanan. */
export function updateStoredUser(user: unknown) {
  const store = activeStore();
  if (!store) return;
  store.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (!hasWindow()) return;
  for (const store of [window.sessionStorage, window.localStorage]) {
    store.removeItem(AUTH_TOKEN_KEY);
    store.removeItem(AUTH_USER_KEY);
  }
}
