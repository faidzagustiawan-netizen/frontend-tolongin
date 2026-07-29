/**
 * Konfigurasi Midtrans Snap di sisi peramban.
 *
 * URL skrip Snap sebelumnya dipaku ke `app.sandbox.midtrans.com` di halaman
 * billing. Artinya build produksi pun membuka gerbang pembayaran sandbox:
 * pembayaran tampak berhasil di layar tetapi tidak pernah menagih apa pun.
 *
 * Nilai `NEXT_PUBLIC_*` disisipkan Next.js saat build, jadi keduanya ditulis
 * sebagai literal penuh — pencarian dinamis pada `process.env` tidak akan
 * tergantikan.
 */

const isProduction =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

export const MIDTRANS_SNAP_URL = isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

export const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';

/**
 * Tanpa client key, Snap tidak akan pernah terbuka. Lebih baik dikatakan di
 * muka daripada membiarkan tombol bayar membuka jendela yang langsung gagal.
 */
export const isMidtransConfigured = MIDTRANS_CLIENT_KEY.length > 0;

export const MIDTRANS_IS_SANDBOX = !isProduction;
