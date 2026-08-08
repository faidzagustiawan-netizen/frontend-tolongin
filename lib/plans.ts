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
 * Satu-satunya jalan keluar "Hubungi Sales" di seluruh aplikasi.
 *
 * Nomornya ditulis berformat internasional tanpa nol di depan karena itu yang
 * dituntut wa.me: bentuk `0895...` yang dipakai sebelumnya membuka halaman
 * "nomor tidak valid", sehingga setiap tautan sales — kartu paket Custom,
 * permintaan faktur, penurunan paket — berujung buntu.
 */
export const WHATSAPP_SALES_URL =
  'https://wa.me/62895397133738?text=Halo%20Tolongin,%20saya%20tertarik%20dengan%20paket%20Custom%20untuk%20perusahaan%20saya.';

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

export interface TokenPack {
  /** Angka yang dikirim ke `POST /payments/topup` sebagai `tokenAmount`. */
  tokens: number;
  /** Harga sekali bayar dalam rupiah. */
  price: number;
  priceLabel: string;
  /** Label pojok kartu. Yang dihitung sendiri hanya bagian penghematannya. */
  badge: string;
  /** Klaim pemakaian yang ditampilkan di kartu. */
  usageHint: string;
  /** Kartu yang ditonjolkan. Hanya satu, dan hanya soal tampilan. */
  highlighted: boolean;
}

/**
 * Paket token energi untuk talenta.
 *
 * Sebelumnya harganya hanya hidup sebagai teks di dalam JSX halaman
 * `talent/tokens`, jadi tidak ada satu tempat pun yang bisa diadu dengan tarif
 * yang benar-benar ditagih. Angka di bawah mengikuti `createTokenTopup` di
 * `backend/src/payments/payments.service.ts`: 100 token ditagih Rp 30.000 dan
 * 500 token Rp 100.000 (di luar kedua jumlah itu backend jatuh ke Rp 300 per
 * token, dan tidak ada kartu untuknya di sini).
 */
export const TOKEN_PACKS: TokenPack[] = [
  {
    tokens: 100,
    price: 30000,
    priceLabel: 'Rp 30.000',
    badge: 'Starter',
    usageHint: 'Cukup untuk 10 kali upload solusi',
    highlighted: false,
  },
  {
    tokens: 500,
    price: 100000,
    priceLabel: 'Rp 100.000',
    badge: 'Terpopuler',
    usageHint: 'Cukup untuk 50 kali upload solusi',
    highlighted: true,
  },
];

/**
 * Penghematan paket dibanding harga satuan paket terkecil, dibulatkan.
 *
 * Dihitung, tidak ditulis tangan: kartu lama mengklaim "Hemat 17%" padahal
 * Rp 200/token melawan Rp 300/token adalah 33% — angka yang meleset karena
 * harganya dan klaimnya tidak pernah berasal dari sumber yang sama.
 */
export const tokenPackSavingsPercent = (pack: TokenPack): number => {
  const base = TOKEN_PACKS[0];
  const basePerToken = base.price / base.tokens;
  const packPerToken = pack.price / pack.tokens;
  return Math.round((1 - packPerToken / basePerToken) * 100);
};

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
