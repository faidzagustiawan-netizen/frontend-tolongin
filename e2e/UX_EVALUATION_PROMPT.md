# Prompt evaluasi UX menyeluruh — Tolongin

Dokumen ini adalah **prompt siap pakai**. Tempelkan bagian [Prompt](#prompt) ke sesi agen mana pun
untuk menjalankan satu putaran evaluasi pengalaman pengguna atas seluruh fitur, atau jalankan
per-area lewat bagian [Pembagian area](#pembagian-area).

Sasarannya bukan "apakah kodenya jalan" — itu tugas `npm test` dan `tsc`. Sasarannya adalah
**apakah orang yang memakainya paham apa yang terjadi**: apakah kegagalan terlihat sebagai
kegagalan, apakah keadaan kosong menjelaskan langkah berikutnya, apakah tombol yang tidak boleh
ditekan memang tidak bisa ditekan.

---

## Prasyarat

| Hal | Cara |
|---|---|
| Backend | entri `backend` di `../.claude/launch.json` (port 3001) |
| Frontend | entri `frontend` di `../.claude/launch.json` (port 3000) |
| Akun uji | hasil seed: `talent1@test.com`, `company1@test.com`, sandi `password123` |
| Peramban | Playwright MCP, atau `npx playwright test` untuk spec yang ditulis agen |

Bila backend mati, catat itu sebagai temuan tersendiri (frontend yang tidak menjelaskan backend
mati adalah cacat UX), lalu lanjutkan menilai apa yang masih bisa dinilai.

---

## Prompt

> Kamu mengevaluasi **pengalaman pengguna** aplikasi Tolongin, bukan kebenaran kodenya.
>
> Jalankan setiap alur di bawah sebagai pengguna sungguhan lewat peramban. Untuk tiap layar,
> jawab enam pertanyaan berikut, dan **hanya laporkan yang jawabannya buruk**:
>
> 1. **Keadaan kosong** — saat belum ada data, apakah layarnya menjelaskan langkah berikutnya, atau
>    hanya kosong?
> 2. **Keadaan memuat** — apakah ada tanda sedang bekerja, atau layar diam yang tampak macet?
> 3. **Keadaan gagal** — matikan backend atau kirim masukan tidak sah. Apakah kegagalan **terlihat
>    sebagai kegagalan**, dengan alasan yang bisa ditindaklanjuti? Layar hijau atas proses yang
>    gagal adalah temuan **kritis**.
> 4. **Pintu terkunci** — apakah aksi yang seharusnya terlarang (belum verifikasi, bukan pemilik,
>    kuota habis, tahap belum terbuka) benar-benar terhalang, dan alasannya disebut di tempat
>    pengguna menekannya — bukan baru muncul setelah gagal di server?
> 5. **Jalan keluar** — dari setiap jalan buntu, apakah ada tombol yang membawa pengguna ke tempat
>    masalahnya bisa diselesaikan?
> 6. **Kesinambungan kata** — apakah istilah yang sama dipakai untuk hal yang sama lintas layar
>    (mis. "studi kasus" vs "challenge" vs "ujian")?
>
> Selain itu periksa: keterbacaan pada 375px (mobile), mode gelap dan terang, fokus papan tik pada
> modal (apakah bisa ditutup dengan Esc), dan galat konsol peramban di tiap halaman.
>
> **Aturan pelaporan.** Satu baris per temuan, diurut dari paling parah:
>
> ```
> <rute>: <parah|sedang|ringan>: <apa yang dilihat pengguna>. <apa yang seharusnya>.
> ```
>
> Sertakan tangkapan layar hanya untuk temuan parah. Jangan usulkan tambalan kode kecuali
> perbaikannya satu baris dan jelas. Jangan memuji apa pun. Jangan melaporkan selera pribadi soal
> warna atau jarak kecuali ada yang benar-benar tidak terbaca.
>
> Bila sebuah alur tidak bisa dijalankan (butuh data yang tidak ada, butuh peran yang tidak dimiliki
> akun uji), **katakan itu** — jangan menebak hasilnya.

---

## Pembagian area

Tiap baris bisa diberikan ke satu agen terpisah. Rute ditulis relatif terhadap `http://localhost:3000`.

| Area | Rute | Yang paling rawan |
|---|---|---|
| **A. Pintu masuk publik** | `/`, `/challenges`, `/challenges/[slug]`, `/companies`, `/talents`, `/leaderboard` | Keadaan kosong pada daftar; kartu yang datanya setengah; tautan mati |
| **B. Autentikasi** | `/login`, `/register`, `/forgot-password`, `/reset-password` | Pesan galat kredensial; validasi borang; ke mana pengguna dilempar setelah masuk |
| **C. Verifikasi identitas** | `/settings/kyc` | Tiga hasil (lolos / ragu / gagal) harus tampil berbeda. Modal kamera: bisa ditutup? Unggah KTP: batas 5MB dan jenis berkas |
| **D. Ruang kerja kandidat** | `/workspace/[enrollmentId]`, `.../session` | Gerbang KYC pada studi kasus berpengawasan; hitung mundur tahap; simpan draf dan keadaan gagalnya; keluar dari layar penuh |
| **E. Perusahaan — studi kasus** | `/challenges/create`, `/challenges/mine`, `/challenges/[slug]/edit` | Simpan draf otomatis; kuota paket; bilah status draf; meninggalkan borang yang belum tersimpan |
| **F. Perusahaan — penilaian** | `/company/submissions`, `/company/submissions/[id]`, `/company/team` | Daftar kosong; nilai AI yang belum jadi; undangan anggota tim |
| **G. Pengaturan profil** | `/settings`, `/settings/skills`, `/settings/experiences`, `/settings/educations` | Konfirmasi hapus; borang yang gagal simpan; keadaan kosong tiap bagian |
| **H. Langganan dan token** | `/company/billing`, `/talent/tokens` | Batas kuota; alur pembayaran yang dibatalkan; harga yang tampil |
| **I. Admin** | `/admin` dan seluruh anaknya | Akun bukan admin harus dipulangkan; antrean tinjauan identitas; audit |
| **J. Dukungan dan notifikasi** | `/support`, `/support/[id]`, `/notifications` | Keadaan kosong; urutan waktu; tanda sudah dibaca |

---

## Jejak keluaran

- Temuan: `e2e/ux-findings.md` (ditimpa tiap putaran).
- Spec yang lahir dari temuan: `e2e/*.spec.ts`, dijalankan dengan `npx playwright test`.
- Tangkapan layar temuan parah: `e2e/screenshots/`.

Temuan yang layak menjadi perubahan kode masuk ke `backend/dokumen/Changelog.md` bersama
perbaikannya, sesuai aturan di `backend/CLAUDE.md`.
