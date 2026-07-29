/**
 * Sumber tunggal definisi paket langganan perusahaan.
 *
 * Sebelumnya harga dan fitur ditulis ulang di tiga tempat dan tidak ada yang
 * cocok satu sama lain — landing menyebut Rp 2.500.000, formulir pendaftaran
 * "IDR 5jt", halaman tagihan Rp 990.000, untuk tier yang sama persis. Angka di
 * bawah ini mengikuti apa yang benar-benar ditagih dan ditegakkan backend:
 *
 * - Harga  : SUBSCRIPTION_MONTHLY_PRICE di
 *            `backend/src/payments/dto/create-subscription.dto.ts`
 * - Kuota  : assertCompanyQuota di `backend/src/challenges/challenges.service.ts`
 * - AI     : shouldRunAi di `backend/src/submissions/submissions.service.ts`
 *            dan gerbang STARTUP pada AI blueprint generator
 *
 * Klaim lama yang dihapus karena tidak ada implementasinya sama sekali:
 * "studi kasus tak terbatas", "submisi kandidat tak terbatas", "10 submisi per
 * bulan", "maksimal 50/500 kandidat per tantangan", dan "uji coba gratis 14
 * hari". Tidak ada satu pun batas kandidat atau logika trial di backend.
 */

export type PlanTier = 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM';

export interface Plan {
  tier: PlanTier;
  /** Nama yang dilihat pengguna. Konsisten di seluruh aplikasi. */
  name: string;
  /** Harga bulanan dalam rupiah. `null` berarti dinegosiasikan. */
  monthlyPrice: number | null;
  priceLabel: string;
  description: string;
  features: string[];
  /** Batas studi kasus berstatus DRAFT atau PUBLISHED. `null` = tanpa batas. */
  activeChallengeQuota: number | null;
  /** Paket yang bisa dibeli sendiri lewat Midtrans. CUSTOM harus lewat sales. */
  selfServe: boolean;
}

/**
 * Disalin apa adanya dari halaman tagihan lama.
 *
 * CATATAN: wa.me menuntut nomor berformat internasional tanpa nol di depan,
 * jadi `0895...` besar kemungkinan tidak pernah membuka percakapan apa pun.
 * Nomornya tidak diubah di sini karena hanya pemiliknya yang tahu digit yang
 * benar — mohon dikoreksi menjadi bentuk `62895...` yang sesuai.
 */
export const WHATSAPP_SALES_URL =
  'https://wa.me/0895397133738?text=Halo%20Tolongin,%20saya%20tertarik%20dengan%20paket%20Custom%20untuk%20perusahaan%20saya.';

export const PLANS: Plan[] = [
  {
    tier: 'STARTUP',
    name: 'Startup',
    monthlyPrice: 0,
    priceLabel: 'Rp 0',
    description: 'Untuk mencoba platform dan merekrut satu posisi.',
    features: [
      '1 studi kasus aktif atau draf',
      'Pembuatan studi kasus manual',
      'Template siap pakai',
      'Penilaian manual oleh tim Anda',
    ],
    activeChallengeQuota: 1,
    selfServe: true,
  },
  {
    tier: 'KONGLOMERAT',
    name: 'Pro',
    monthlyPrice: 2500000,
    priceLabel: 'Rp 2.500.000',
    description: 'Rekrutmen rutin dengan bantuan penilaian otomatis.',
    features: [
      '5 studi kasus aktif atau draf',
      'AI Auto-Generate studi kasus',
      'Evaluasi AI otomatis tiap submisi',
      'Analisis soft skill & deteksi plagiarisme',
      'Proctoring biometrik penuh',
    ],
    activeChallengeQuota: 5,
    selfServe: true,
  },
  {
    tier: 'CUSTOM',
    name: 'Custom',
    monthlyPrice: null,
    priceLabel: 'Hubungi Sales',
    description: 'Kebutuhan korporat di luar kuota paket Pro.',
    features: [
      'Kuota studi kasus sesuai kesepakatan',
      'Seluruh fitur paket Pro',
      'Kustomisasi branding',
      'Dukungan berdedikasi',
    ],
    activeChallengeQuota: null,
    selfServe: false,
  },
];

export const getPlan = (tier?: string | null): Plan =>
  PLANS.find((p) => p.tier === tier) ?? PLANS[0];

/**
 * Apakah batas paket sedang ditegakkan.
 *
 * Pasangan layar dari `subscriptionLimitsEnforced()` di
 * `backend/src/common/dev-flags.ts`. Selama pengembangan keduanya mati, dan
 * peringatan "kuota paket sudah penuh" tidak boleh muncul untuk batas yang
 * memang tidak sedang ditegakkan backend — perusahaan diberi tahu bahwa
 * penyimpanannya akan ditolak, padahal tidak.
 *
 * Nyalakan bersamaan dengan sisi backend lewat
 * `NEXT_PUBLIC_ENFORCE_SUBSCRIPTION_LIMITS=true`.
 */
export const subscriptionLimitsEnforced = (): boolean =>
  process.env.NEXT_PUBLIC_ENFORCE_SUBSCRIPTION_LIMITS === 'true';

/** "Rp 2.500.000" — dipakai bila label perlu dirakit dari angka. */
export const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
