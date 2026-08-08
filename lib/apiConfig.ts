/**
 * Satu-satunya tempat alamat backend ditentukan.
 *
 * Dulu tersebar di tiga berkas dengan cadangan yang berbeda: `services/api.ts`
 * jatuh ke `https://podorukunspk.fun/api/v1` (produksi), sementara
 * `contexts/SocketContext.tsx` dan `components/common/Footer.tsx` jatuh ke
 * `http://localhost:3001`. Bila `NEXT_PUBLIC_API_URL` luput di-set, permintaan
 * HTTP pergi ke produksi sedangkan WebSocket mencari localhost — separuh
 * aplikasi berbicara dengan basis data yang salah tanpa satu pun galat.
 *
 * Cadangannya mengikuti lingkungan, sejalan dengan `BACKEND_ORIGIN` di
 * `next.config.ts`. Build produksi (Vercel) tetap punya alamat yang benar
 * walau env luput di-set, sementara mesin pengembang yang lupa mengisi env
 * gagal tersambung ke localhost — bukan diam-diam menulis ke produksi.
 */
const PRODUCTION_ORIGIN = 'https://podorukunspk.fun';

const DEFAULT_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_ORIGIN
    : 'http://localhost:3001';

/** Termasuk awalan `/api/v1`. Dipakai sebagai `baseURL` axios. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_ORIGIN}/api/v1`;

/**
 * Alamat server tanpa awalan `/api/v1`.
 *
 * Socket.IO menempel di akar server, dan Swagger disajikan di `/api/docs` —
 * keduanya di luar awalan versi.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
