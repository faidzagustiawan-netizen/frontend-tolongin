# Temuan evaluasi UX

Dijalankan menurut `e2e/UX_EVALUATION_PROMPT.md`.

- **Putaran 1** — 8 Agustus 2026. 23 temuan parah, ~35 sedang. Tiga agen membaca kode untuk
  sepuluh area, satu sesi peramban menguji alur langsung.
- **Putaran 2** — 8 Agustus 2026, sesudah perbaikan. Verifikasi ulang seluruhnya lewat peramban,
  kali ini dengan akun admin sehingga cakupannya penuh. Hasilnya di bawah.

Akun uji: `talent1@test.com`, `company1@test.com` (sandi `password123`), dan
`admin@tolongin.co` / `AdminPassword123` (`pnpm run seed:admin` di `backend/`).

---

## Putaran 2 — hasil verifikasi

Semua diuji langsung di peramban dengan backend hidup, lalu backend sengaja dimatikan untuk
menguji keadaan gagal.

### Terbukti diperbaiki

| Temuan asal | Bukti |
|---|---|
| Etalase publik terkunci | `/challenges`, `/talents`, `/companies`, `/leaderboard`, `/terms`, `/privacy` semuanya terbuka dengan `sessionStorage` kosong |
| Pemulihan kata sandi mustahil | `/forgot-password` dan `/reset-password` terbuka; halaman pemulihan tampil utuh |
| Rute dasbor bocor | `/settings/kyc`, `/admin`, `/challenges/create`, `/challenges/<slug>/edit` memantulkan ke `/login?redirect=…` |
| Backend mati = layar kosong | Dasbor kini "Ruang kerja gagal dimuat" + tombol Coba Lagi; toast koneksi 1×, bukan 3× |
| Unggah KTP tak terjangkau papan tik | `#unggah-ktp` fokusabel, `display: block`, punya `aria-label` dan `<label for>` |
| Gerbang KYC bisa dilewati lewat URL | `/workspace/<id>/session` menahan soal; `Kirim Seluruh Jawaban` dan `Soal 1` nol kecocokan |
| Keahlian hilang saat gagal muat | "Keahlian Anda gagal dimuat" + penambahan dimatikan supaya daftar lama tidak tertimpa; sama untuk pengalaman |
| Notifikasi kosong palsu | "Gagal Memuat Notifikasi — ini bukan berarti kotak masuk Anda kosong" |
| Tiket kosong palsu | "Gagal memuat daftar tiket Anda" + Coba Lagi |
| Direktori talenta kosong palsu | "Direktori gagal dimuat" + Coba Lagi |
| Antrean KYB admin kosong palsu | "Antrean tidak bisa dibaca — ini bukan berarti antreannya kosong" + Coba muat lagi |
| `/support` tak terbaca di mode terang | Judul `rgb(10,54,34)` di mode terang, bukan putih |
| "Total Bobot: 0%" telanjang | Diganti "Perusahaan belum merinci bobot penilaian untuk studi kasus ini" |
| Tautan "Kembali ke Daftar Workspace" menyesatkan | Kini "Kembali ke Ruang Kerja" |
| `confirm()`/`prompt()` admin | `AdminActionDialog`: menyebut objek terdampak, Esc menutup tanpa mengeksekusi, penghitung `4/10` menahan alasan pendek, tombol hidup di 44 karakter |
| Istilah campur aduk | Navbar, footer, direktori, dan dasbor seragam "studi kasus" |

### Temuan baru pada putaran 2

| # | Tempat | Yang dialami pengguna | Status |
|---|---|---|---|
| 1 | `app/page.tsx:24,42` | `talentData?.data \|\| []` dan `statsData?.data \|\| []` mengubah kegagalan menjadi daftar kosong. Dengan backend mati, kandidat pemilik empat pendaftaran diberi tahu "Belum Ada Studi Kasus yang Diambil". Kelas cacat yang sama dengan sepuluh layar lain — berkas ini tidak masuk pembagian area mana pun di putaran 1. | **Diperbaiki**: cabang galat "Ruang kerja gagal dimuat" + Coba Lagi, berlaku untuk sisi talenta maupun perusahaan. |

### Belum bisa diuji

- **Layar penolakan KYC** — butuh akun berstatus `FAILED`; tidak ada di seed.
- **Gerbang KYC pada ujian yang masih berjalan** — keempat pendaftaran `talent1` sudah lewat tenggat,
  jadi yang teruji baru jalur penolakannya.
- **Alur pembayaran Midtrans** sampai selesai.
- **Eksekusi nyata tindakan admin** — dialognya diverifikasi sampai tombol konfirmasi aktif, lalu
  dibatalkan dengan Esc. Menekan "Turunkan" atau "Hapus" sungguhan akan mengubah data pada basis
  data pengembangan yang dipakai bersama.

---

## Putaran 1 — daftar temuan asal

Disimpan sebagai rujukan. Penanda `[terverifikasi]` berarti dibuktikan di peramban saat itu.

### Parah

1. `components/providers/AuthGuard.tsx:8` **[terverifikasi]** — `publicRoutes` hanya `/`, `/login`, `/register`; seluruh etalase publik memantulkan pengunjung anonim ke halaman masuk, padahal `app/sitemap.ts` mendaftarkannya ke mesin pencari.
2. `AuthGuard.tsx:8` **[terverifikasi]** — `/forgot-password` dan `/reset-password` ikut terkunci; tautan "Lupa kata sandi?" memantul balik ke halaman masuk.
3. Dasbor saat backend mati **[terverifikasi]** — `<main>` kosong, tiga toast identik menyalahkan koneksi pengguna.
4. `settings/kyc` **[terverifikasi]** — input unggah KTP `display:none` tanpa `tabindex`; tak terjangkau papan tik.
5. `workspace/[enrollmentId]/session` **[terverifikasi]** — tidak memeriksa status KYC sama sekali.
6. `components/landing/CtaSection.tsx:34` **[terverifikasi 404]** — CTA halaman depan menuju `/contact` yang tidak ada.
7. `settings/skills/page.tsx:31` — gagal muat berakhir sebagai daftar kosong, lalu menambah satu keahlian menghapus seluruh keahlian lama di server.
8. `useServerDraft.ts:73` — autosave membuat studi kasus baru diam-diam saat editor gagal memuat.
9. `ExperienceModal.tsx:237`, `EducationModal.tsx:212` — tombol simpan berputar selamanya bila server menolak.
10. `workspace/[enrollmentId]/page.tsx:1213` — tahap `EXPIRED` dirender hijau bercentang bersama tahap yang lulus.
11. `workspace/[enrollmentId]/page.tsx:668` — galat pengumpulan berada di cabang yang tidak pernah aktif; tahap hangus tanpa pesan.
12. `session/page.tsx:515` — tombol kirim setelah tenggat tampak aktif tetapi handler-nya langsung `return`.
13. `session/page.tsx:290` — gagal simpan draf hanya `console.error`.
14. `DraftStatusBar.tsx:103` — "Keluar Sesi" tanpa konfirmasi selagi jam tahap berjalan.
15. `settings/kyc/page.tsx:232` — pencocokan AI berjalan tanpa indikator apa pun.
16. `notifications/page.tsx:101` — ikon dipilih dari potongan kata judul; "Evaluasi Gagal" tampil bercentang hijau.
17. `notifications/page.tsx:38` — `catch { console.error }` membuat navigasi tidak pernah jalan.
18. `talent/tokens/page.tsx:27` — `window.snap.pay` dipanggil tanpa skrip Midtrans dimuat di rute itu.
19. `company/submissions/[id]/page.tsx:456` — submisi `PENDING_AI` disuguhi iklan paket Pro.
20. `backend/src/submissions/submissions.service.ts:634` — notifikasi berbunyi "Skor AI: null."
21. Sepuluh layar memakai keadaan kosong untuk kegagalan.
22. `ChallengeDetailHeader.tsx:126` **[terverifikasi]** — teks contoh tentang churn tampil sebagai deskripsi resmi.
23. `support/page.tsx:67` — palet keras membuat teks putih di atas latar terang.

### Sedang

Lihat riwayat Git berkas ini (commit `b4dcfeb`) untuk daftar ~35 temuan sedang beserta rinciannya.
Seluruhnya sudah dikerjakan pada commit `b4dcfeb` dan `bd71f39`.
