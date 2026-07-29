/**
 * Katalog pengaturan anti-kecurangan.
 *
 * Label singkat di formulir tidak cukup untuk memutuskan: "Pelacakan Wajah
 * Berkelanjutan" tidak memberi tahu perusahaan bahwa kamera menyala sepanjang
 * ujian, dan kandidat yang tidak siap akan berhenti di tengah jalan. Penjelasan
 * panjang, apa yang dilihat kandidat, dan konsekuensinya dikumpulkan di sini
 * supaya dialog penjelasnya punya satu sumber.
 *
 * `demoVideoUrl` sengaja opsional dan masih kosong — begitu video peraga
 * tersedia, cukup isi tautannya di sini tanpa menyentuh komponen mana pun.
 */
export type ProctoringSetting = {
  id: string;
  label: string;
  /** Satu kalimat di sebelah kotak centang. */
  summary: string;
  /** Penjelasan utuh di dalam dialog. */
  detail: string;
  /** Apa yang benar-benar dialami kandidat saat pengaturan ini menyala. */
  candidateExperience: string[];
  /** Hal yang perlu ditimbang sebelum menyalakannya. */
  tradeOff: string;
  demoVideoUrl?: string;
};

export const PROCTORING_SETTINGS: ProctoringSetting[] = [
  {
    id: 'requireFaceScan',
    label: 'Wajib Verifikasi Wajah (KYC)',
    summary:
      'Kandidat wajib memindai wajah sebelum dapat memulai ujian.',
    detail:
      'Sebelum soal pertama terbuka, kandidat memindai wajahnya dan sistem mencocokkannya dengan identitas yang sudah terverifikasi di akunnya. Tujuannya memastikan yang mengerjakan adalah orang yang mendaftar, bukan orang lain yang meminjam akun.',
    candidateExperience: [
      'Diminta izin mengakses kamera sebelum ujian dimulai.',
      'Mengarahkan wajah ke kamera sampai pemindaian berhasil.',
      'Tidak bisa masuk ke soal bila wajahnya tidak cocok dengan identitas akun.',
    ],
    tradeOff:
      'Kandidat yang belum menyelesaikan verifikasi identitas akan tertahan di sini. Untuk posisi yang lamarannya banyak, ini memangkas jumlah peserta.',
  },
  {
    id: 'continuousTracking',
    label: 'Pelacakan Wajah Berkelanjutan',
    summary:
      'Kamera aktif selama ujian untuk memastikan wajah kandidat tidak hilang atau berganti.',
    detail:
      'Kamera menyala sepanjang pengerjaan dan sistem memeriksa secara berkala bahwa wajah yang sama masih berada di depan layar. Wajah yang hilang terlalu lama atau berganti orang dicatat sebagai kejanggalan pada laporan penilaian.',
    candidateExperience: [
      'Kamera menyala dari awal sampai akhir pengerjaan.',
      'Ada penanda di layar bahwa perekaman sedang berjalan.',
      'Menutup kamera atau meninggalkan tempat duduk akan tercatat.',
    ],
    tradeOff:
      'Paling berat bagi kandidat: menuntut kamera yang layak, koneksi stabil, dan ruang yang tenang selama durasi penuh. Pertimbangkan hanya untuk tahap akhir.',
  },
  {
    id: 'trackTabSwitches',
    label: 'Lacak Perpindahan Tab / Jendela',
    summary:
      'Sistem mencatat atau memblokir bila kandidat berpindah ke aplikasi atau tab lain.',
    detail:
      'Setiap kali jendela ujian kehilangan fokus, kejadiannya dicatat beserta waktunya. Anda dapat menetapkan batas toleransi: nol berarti hanya dicatat tanpa menghentikan siapa pun, sedangkan angka di atas nol menghentikan ujian setelah batas itu terlampaui.',
    candidateExperience: [
      'Peringatan muncul saat berpindah tab bila batas toleransi diisi.',
      'Sisa toleransi terlihat di layar.',
      'Ujian dihentikan bila batasnya habis.',
    ],
    tradeOff:
      'Studi kasus yang memang menuntut riset dokumentasi akan menghukum kandidat yang bekerja dengan benar. Untuk soal semacam itu, biarkan di angka nol agar hanya tercatat.',
  },
  {
    id: 'blockCopyPaste',
    label: 'Blokir Copy-Paste',
    summary:
      'Kandidat tidak dapat menyalin atau menempel di editor maupun formulir ujian.',
    detail:
      'Aksi salin, potong, dan tempel dinonaktifkan di seluruh area jawaban. Tujuannya mencegah jawaban ditempel utuh dari sumber luar.',
    candidateExperience: [
      'Ctrl+C, Ctrl+V, dan menu klik kanan tidak berfungsi di kolom jawaban.',
      'Muncul pemberitahuan singkat saat mencoba menempel.',
    ],
    tradeOff:
      'Ikut menghalangi kebiasaan yang wajar, seperti menyalin potongan kode dari soal ke editor. Untuk soal live coding panjang, ini terasa mengganggu.',
  },
  {
    id: 'blockRightClick',
    label: 'Blokir Klik Kanan',
    summary: 'Mencegah menu konteks bawaan peramban terbuka.',
    detail:
      'Menu klik kanan dinonaktifkan di halaman ujian, sehingga jalan pintas menyimpan gambar atau membuka inspeksi elemen tidak tersedia dari sana.',
    candidateExperience: [
      'Klik kanan tidak memunculkan menu apa pun di halaman ujian.',
    ],
    tradeOff:
      'Nilai pengamanannya kecil — alat pengembang tetap bisa dibuka lewat papan ketik. Anggap ini penghalang ringan, bukan penjagaan sungguhan.',
  },
  {
    id: 'enforceFullscreen',
    label: 'Wajib Layar Penuh (Fullscreen)',
    summary: 'Pengerjaan hanya bisa dilakukan dalam mode layar penuh.',
    detail:
      'Ujian meminta mode layar penuh sebelum dimulai. Keluar dari layar penuh menghentikan sementara pengerjaan sampai kandidat kembali, dan kejadiannya dicatat.',
    candidateExperience: [
      'Diminta masuk ke layar penuh sebelum soal pertama terbuka.',
      'Pengerjaan tertahan bila keluar dari layar penuh.',
      'Setiap keluar-masuk tercatat di laporan.',
    ],
    tradeOff:
      'Menyulitkan kandidat yang memakai dua layar atau perlu membuka editor terpisah. Kurang cocok untuk soal yang menuntut aplikasi luar.',
  },
];
