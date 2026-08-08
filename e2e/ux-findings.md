# Temuan evaluasi UX — 8 Agustus 2026

Dijalankan menurut `e2e/UX_EVALUATION_PROMPT.md`. Tiga agen membaca kode untuk sepuluh area, satu
sesi peramban (Playwright) menguji alur langsung dengan backend hidup lalu backend sengaja dimatikan.

Penanda `[terverifikasi]` berarti temuan itu saya buktikan sendiri di peramban. Sisanya berasal dari
pembacaan kode dan belum dijalankan — perlakukan sebagai dugaan kuat, bukan fakta.

Akun uji: `talent1@test.com` / `company1@test.com`, sandi `password123`.

---

## Parah — memutus alur, atau menampilkan kegagalan sebagai keberhasilan

| # | Tempat | Yang dialami pengguna | Yang seharusnya |
|---|---|---|---|
| 1 | `components/providers/AuthGuard.tsx:8` **[terverifikasi]** | `publicRoutes = ['/', '/login', '/register']`. Pengunjung anonim membuka `/challenges` dilempar ke `/login` tanpa penjelasan. Sama untuk `/talents`, `/companies`, `/leaderboard`, `/terms`, `/privacy` — padahal `app/sitemap.ts` mendaftarkan rute itu ke mesin pencari. Seluruh etalase publik terkunci. | Daftarkan seluruh rute publik, atau pakai pencocokan awalan. |
| 2 | `components/providers/AuthGuard.tsx:8` **[terverifikasi]** | `/forgot-password` dan `/reset-password` juga tidak publik. Tautan "Lupa kata sandi?" di halaman masuk memantul balik ke halaman masuk. **Pemulihan kata sandi tidak bisa diselesaikan siapa pun.** | Tambahkan kedua rute ke daftar publik. |
| 3 | Dasbor talenta saat backend mati **[terverifikasi]** | `<main>` kosong melompong — tanpa pesan, tanpa tombol muat ulang — ditemani tiga toast identik "Koneksi terputus. Pastikan perangkat Anda terhubung ke internet." Penyebabnya server mati, tapi pengguna disuruh memeriksa internetnya. Tangkapan layar: `e2e/screenshots/backend-down-dashboard.png` | Satu pesan galat menetap di area konten, tombol coba lagi, kalimat yang tidak menyalahkan koneksi pengguna. |
| 4 | `app/(dashboard)/settings/kyc/page.tsx:73` **[terverifikasi]** | Kotak unggah KTP adalah `<label>` membungkus `<input type=file>` ber-`display:none`, tanpa `tabindex` dan tanpa `aria-label`. Tidak bisa dicapai papan tik sama sekali. Verifikasi KTP wajib sebelum ujian, jadi pengguna papan tik terkunci dari seluruh platform. | Beri input id + label, atau `tabindex={0}` dan penangan Enter/Spasi pada label. |
| 5 | `app/(dashboard)/workspace/[enrollmentId]/session/page.tsx` **[terverifikasi tidak ada gerbangnya]** | Halaman sesi ujian tidak memeriksa status KYC maupun hasil pencocokan wajah sama sekali. Membuka `/workspace/<id>/session` langsung lewat URL melewati gerbang yang baru dipasang di halaman ringkasan. | Pasang gerbang yang sama di halaman sesi — gerbang di halaman ringkasan saja bukan gerbang. |
| 6 | `components/landing/CtaSection.tsx:34` **[terverifikasi 404]** | Tombol ajakan bertindak paling menonjol di halaman depan menuju `/contact`, rute yang tidak ada. | Arahkan ke `/support`, atau hapus tombolnya. |
| 7 | `app/(dashboard)/settings/skills/page.tsx:31` | Muat keahlian dipanggil `.then()` tanpa `.catch()`. Gagal muat berakhir sebagai "Belum ada keahlian yang ditambahkan" — lalu menambah satu keahlian mengirim `{ skills: [satu-satunya] }` dan **menghapus seluruh keahlian lama di server**. | Tangani galat; larang simpan sebelum data termuat. Pola sama di `settings/experiences:103` dan `settings/educations:103`. |
| 8 | `app/(dashboard)/challenges/create/components/useServerDraft.ts:73` | Bila editor gagal memuat, autosave tetap jalan tanpa `id` dan **membuat studi kasus baru diam-diam** — duplikat pemakan kuota yang sudah dicegah di jalur simpan manual. | `enabled: false` untuk autosave saat pemuatan editor gagal. |
| 9 | `components/profile/ExperienceModal.tsx:237` | Simpan ditolak server membuat `setIsSaving(false)` tidak pernah jalan — tombol berputar selamanya, modal buntu. Sama di `EducationModal.tsx:212`. | `try/finally`. |
| 10 | `app/(dashboard)/workspace/[enrollmentId]/page.tsx:1213` | Tahap `EXPIRED` dirender di blok hijau bercentang bersama tahap yang sukses dikumpulkan — hangus tampil seperti lulus. | Gaya merah/ambar tersendiri beserta akibatnya. |
| 11 | `app/(dashboard)/workspace/[enrollmentId]/page.tsx:668` | Pengumpulan otomatis saat waktu habis berhenti bila wajah belum terverifikasi, dan `submitError` dirender di cabang yang tidak pernah aktif — tahap hangus tanpa satu pun pesan. | Pindahkan blok galat ke luar cabang `currentStep === 'QUESTIONS'`. |
| 12 | `.../session/page.tsx:515` | Setelah tenggat lewat, tombol "Kirim Seluruh Jawaban" tetap tampak aktif tapi handler-nya langsung `return`. Pengguna menekan berulang tanpa tahu apa yang salah. | Nonaktifkan dan tampilkan blok "Waktu Pengerjaan Telah Berakhir". |
| 13 | `.../session/page.tsx:290` | Gagal simpan draf hanya `console.error`; penandanya tetap berbunyi "Draf Belum Tersimpan" — kalimat yang sama dengan saat pengguna baru mengetik. `DraftStatusBar` sudah punya prop `draftError`/`onRetrySave` yang tidak pernah diisi. | Isi prop yang sudah ada. |
| 14 | `DraftStatusBar.tsx:103` | "Keluar Sesi" adalah `Link` biasa — satu klik meninggalkan ujian yang jamnya berjalan, tanpa konfirmasi. | Dialog konfirmasi yang menyebut jam tetap berjalan. |
| 15 | `settings/kyc/page.tsx:232` | Setelah foto diambil, modal ditutup lalu pencocokan AI berjalan **tanpa indikator apa pun** — layar diam berisi tombol "Buka Pop-Up Pemindaian Wajah". | Tahan modal dengan `isVerifying`, atau tampilkan blok "sedang mencocokkan". |
| 16 | `app/(dashboard)/notifications/page.tsx:101` | Ikon centang hijau dipilih dari `title.includes('Evaluasi')` — notifikasi "Evaluasi Gagal" tampil bercentang hijau. | Pilih ikon dari jenis notifikasi, bukan potongan kata di judul. |
| 17 | `app/(dashboard)/notifications/page.tsx:38` | `catch { console.error }` membuat `router.push(linkUrl)` tidak pernah jalan — klik notifikasi tidak menghasilkan apa pun, tanpa pesan. | Navigasi di luar blok gagal. |
| 18 | `app/(dashboard)/talent/tokens/page.tsx:27` | `window.snap.pay` dipanggil padahal skrip Midtrans Snap tidak pernah dimuat di rute ini. Setiap tombol "Beli Token" melempar TypeError. | Muat Snap di halaman ini dan periksa `isMidtransConfigured` seperti `company/billing`. |
| 19 | `company/submissions/[id]/page.tsx:456` | Submisi `PENDING_AI` selalu ber-`aiScore` null, jadi pelanggan Pro yang penilaiannya masih mengantre disuguhi iklan "AI Assessment Tidak Tersedia — aktif mulai paket Pro". | Bedakan "sedang berjalan" dari "tidak berhak". |
| 20 | `backend/src/submissions/submissions.service.ts:634` | Talenta menerima notifikasi berbunyi "Skor AI: null." | "Sedang dinilai AI" selama nilainya belum ada. |
| 21 | Enam layar memakai keadaan kosong untuk kegagalan | `talents/page.tsx:34`, `support/page.tsx:33`, `notifications/page.tsx:21`, `CandidateBrowser.tsx:348`, `company/team/page.tsx:295`, `admin/page.tsx:71`, `admin/billing/page.tsx:83` — semuanya tidak mengambil `isError`, sehingga backend mati tampil sebagai "belum ada data". Antrean KYB admin yang gagal dimuat berbunyi "Tidak ada perusahaan yang menunggu verifikasi" — admin menutup halaman yakin antreannya bersih. | Cabang galat terpisah dengan tombol coba lagi. Polanya sudah ada di `challenges/page.tsx:245`. |
| 22 | `components/challenge/ChallengeDetailHeader.tsx:126` | Studi kasus tanpa ringkasan menampilkan teks keras "Memahami dan memprediksi churn dengan model pembelajaran mesin." seolah itu deskripsi resminya. Terlihat di dua studi kasus berbeda saat penelusuran. **[terverifikasi]** | Keadaan kosong yang jujur, atau sembunyikan barisnya. |
| 23 | `app/(dashboard)/support/page.tsx:67` | Halaman memakai palet keras `text-white`/`bg-zinc-900` sementara mode terang berlatar `#F4FAF6` — judul putih di atas latar terang. Sama di `support/[id]`. | Token `text-foreground`/`bg-card`. |

## Sedang — bisa dilewati, tapi membingungkan atau menyesatkan

- `.../session/page.tsx:370` — layar penuh dinyalakan tanpa menjelaskan akibat keluarnya, dan halaman sesi **tidak memasang pendengar `fullscreenchange` sama sekali**. Esc keluar diam-diam, tidak diperingatkan dan tidak dicatat, padahal pengaturannya menjanjikan penegakan.
- `workspace/[enrollmentId]/page.tsx:423` dan `talent/tokens/page.tsx:29` — kegagalan dilaporkan lewat `alert()` bawaan peramban. Seluruh layar lain memakai toast.
- Seluruh keputusan admin berisiko (blokir, peringatan, tolak KYB, tolak identitas) memakai `confirm()`/`prompt()` bawaan — `admin/users:55,60,74`, `admin/challenges:63,86`, `company-verifications:73,79`, `identity-reviews:68`, `tickets:95` — padahal `ConfirmDialog` sudah ada dan dipakai di sisi perusahaan.
- `admin/layout.tsx:15` **[terverifikasi]** — akun bukan admin memang dipulangkan ke `/`, tapi tanpa satu kata penjelasan. Pengguna mengira tautannya rusak.
- `ChallengeClient.tsx:97` — tombol "Masuk untuk Mendaftar" mengirim `?redirect=`, tapi halaman masuk tidak pernah membacanya. Setelah masuk pengguna mendarat di `/` dan harus mencari ulang studi kasusnya.
- `ContinuousProctoring.tsx:48` — izin kamera yang ditolak langsung dicatat sebagai pelanggaran ke laporan rekruter, dan spanduknya tidak menawarkan cara memberi izin. `FaceScanner.tsx:76` sudah punya kalimat yang benar.
- `ContinuousProctoring.tsx:102` — kegagalan pemeriksaan wajah berkala ditelan `console.error`; pengawasan berhenti bekerja diam-diam sementara lencana "Berkelanjutan Aktif" tetap hijau.
- `LivenessKycTab.tsx:103` — galat jaringan dirender dengan judul tetap "Verifikasi Ditolak:". Gangguan koneksi tampil sebagai identitas ditolak.
- `settings/experiences:51`, `educations:51` — daftar diperbarui sebelum permintaan dikirim, jadi perubahan tetap terlihat walau server menolak.
- `settings/skills:163` — gagal simpan tetap menutup modal dan mengosongkan ketikan.
- `settings/experiences:58`, `educations:58` — `window.confirm` yang tidak menyebut apa yang hilang, padahal `/settings` memakai `ConfirmDialog` untuk tindakan yang sama.
- `settings/skills:226,259` dan modal kamera `kyc:474` — digulung tangan tanpa `role="dialog"`, jebakan fokus, atau Esc. Hook `useDialogA11y` sudah dipakai modal profil lain.
- `challenges/[slug]/edit/page.tsx:22` — halaman edit tidak punya draf lokal dan tidak ada `beforeunload`; menutup tab dalam jendela debounce 4 detik membuang suntingan tanpa peringatan.
- `ManualBuilder.tsx:354` — "Simpan ke Draf" dinonaktifkan tanpa alasan tertulis, berbeda dari tombol Publikasikan di baris 303.
- `backend/src/challenges/challenges.service.ts:672` — pesan penolakan kuota menyebut paket "Paket Murah", nama yang tidak ada di `lib/plans.ts` (di sana "Startup"), dan pesan itu ditampilkan mentah ke pengguna.
- `company/billing:124` dan `talent/tokens:38` — pembayaran yang dibatalkan pengguna tidak meninggalkan jejak apa pun di layar.
- `company/billing:256` — bila status langganan gagal diambil, halaman jatuh ke nilai localStorage dan menulis "Tanpa tanggal berakhir" kepada pelanggan Pro.
- `company/billing:81` — "Turunkan Paket" tampak aktif tapi hanya memunculkan toast "Hubungi tim kami" tanpa tautan ke siapa pun.
- `company/submissions/[id]:434` — `aiPlagiarismScore || 0` menuliskan "0%" hijau saat nilainya null; data yang belum ada terbaca sebagai bersih dari plagiarisme.
- `company/submissions/[id]:89` — setiap kegagalan (403, jaringan, server mati) tampil sebagai "Submisi Tidak Ditemukan".
- `support/[id]:57` — galat muat dan 404 sama-sama jadi "Tiket tidak ditemukan"; pemilik tiket yang sah diberi tahu tiketnya hilang.
- `support/[id]:85` — status ditampilkan mentah (`OPEN`, `IN_PROGRESS`) sementara halaman daftar menerjemahkannya jadi "Menunggu"/"Diproses". Dua kosakata, dua layar berurutan.
- `talents/[slug]:38` — satu-satunya jalan keluar dari "Profil Tidak Ditemukan" adalah `history.back()`; pengunjung dari tautan yang dibagikan tidak punya riwayat.
- `talents/[slug]:75` — slug milik akun perusahaan menampilkan "Ini adalah profil perusahaan." tanpa satu pun data.
- `companies/[slug]:39` — `const { challenges } = company` tanpa penjaga; respons tanpa ruas itu melempar TypeError dan halaman jadi kosong.
- `companies/page.tsx:43`, `leaderboard/page.tsx:117`, `companies/[slug]:34` — layar gagal tanpa tombol coba lagi, padahal polanya sudah ada di `challenges/page.tsx:248`.
- `workspace/.../page.tsx` **[terverifikasi]** — panel "Kriteria & Bobot Penilaian AI" menampilkan "Total Bobot: 0%" tanpa satu pun kriteria. Angka nol tidak menjelaskan apa pun.
- `workspace/.../page.tsx` **[terverifikasi]** — tautan "Kembali ke Daftar Workspace" menuju `/`, bukan daftar workspace.
- `DiscussionThread.tsx:61` — gagal kirim komentar hanya `console.error`; teks tetap di kotak, pengguna mengira terkirim lalu mengirim ulang.
- `EnrollChallengeModal.tsx:54` — teks persetujuan NDA memakai `text-gray-200` keras; di mode terang perjanjian hukum yang harus dicentang praktis tak terbaca.
- `ChallengeDetailHeader.tsx:132` — "Ambil Tantangan Ini" selalu aktif walau tenggat lewat atau sudah terdaftar; penolakan baru muncul setelah server menolak.
- `PathPicker.tsx:53` — "0 soal cocok" saat query bank soal gagal; bank kosong dan bank tak terambil tak terbedakan.

## Kesinambungan kata — satu objek, banyak nama

- Navbar "Cari Studi Kasus" / "Studi Kasus Saya", footer "Challenge Directory", tombol "Buat Public Challenge", judul direktori "tantangan", tombol detail "Ambil Tantangan Ini", dasbor "Belum Ada Tantangan yang Diambil". **[terverifikasi di navbar dan footer]**
- Tahap ujian disebut "Masuk ke LMS", "Sesi Pengerjaan", "Lembar Ujian", dan "Seksi Sebelumnya" — empat nama, sebagian di halaman yang sama.
- "Batas waktu" berarti durasi pengerjaan di detail ("72 Jam"), sisa hari di kartu direktori, dan "3-7 hari" di sidebar. Tiga angka untuk satu pertanyaan.

## Aksesibilitas

- Unggah KTP tidak bisa dicapai papan tik (parah #4).
- Kotak pencarian direktori (`ChallengeFilterBar.tsx:161,314`), kedua `Textarea` di `DiscussionThread.tsx:132,167`, dan kotak balasan `support/[id]:132` hanya punya `placeholder` — pembaca layar mengumumkan ruas tanpa nama.
- Modal yang digulung tangan tanpa Esc/jebakan fokus: `settings/skills:226,259`, `settings/kyc:474`.

---

## Yang sudah benar dan tidak perlu disentuh

- `components/common/Modal.tsx` + `useDialogA11y` menangani Esc, klik latar, jebakan fokus, dan pengembalian fokus dengan benar.
- Hitungan mundur tahap disemai dari `remainingSeconds` jawaban server dan disegarkan tiap 30 detik; penolakan sesungguhnya tetap di server.
- Galat kredensial di halaman masuk tampil sebagai `role="alert"` berbunyi "Email atau password salah". **[terverifikasi]**
- Keadaan kosong `/support` menjelaskan langkah berikutnya. **[terverifikasi]**
- Layar "Waktu Pengerjaan Telah Berakhir" di halaman ringkasan workspace menjelaskan sebabnya dengan lengkap. **[terverifikasi]**
- Dasbor talenta dan halaman KYC pada 375px: tanpa luapan mendatar, tanpa teks di bawah 11px. **[terverifikasi]**
- Panel "Dev Auto Login" digerbang `NODE_ENV === 'development'` — tidak ikut terbit ke produksi. **[terverifikasi]**
- Kuota paket dan kunci AI memang sengaja diam selama pengembangan (`NEXT_PUBLIC_ENFORCE_SUBSCRIPTION_LIMITS` mati di kedua sisi) — konsisten, bukan cacat.

## Yang tidak bisa diuji putaran ini

- **Gerbang KYC pada studi kasus berpengawasan.** Keempat pendaftaran milik `talent1@test.com` sudah lewat tenggat, sehingga tombol "Mulai Pengerjaan" tidak pernah muncul. Butuh data seed dengan pendaftaran yang masih berjalan.
- **Layar penolakan KYC.** Butuh akun berstatus `FAILED`.
- **Alur pembayaran Midtrans** sampai selesai.
- **Panel admin dari sudut pandang admin** — tidak ada akun admin di seed (`admin@tolongin.co` hanya diisikan tombol dev, bukan dibuat oleh seeder).
