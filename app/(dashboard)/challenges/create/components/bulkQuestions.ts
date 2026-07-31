/**
 * Mengurai banyak soal sekaligus dari teks tempelan.
 *
 * Menulis satu soal pilihan ganda lewat antarmuka butuh enam langkah: tekan
 * tombol tipe, ketik pertanyaan, tambah opsi, ketik tiap opsi, tandai yang
 * benar, atur poin. Sepuluh soal berarti enam puluh langkah — dan itulah alasan
 * sebenarnya perusahaan enggan menyusun bank soal sendiri. Sepuluh baris yang
 * ditempel dari spreadsheet menyelesaikan hal yang sama sekali tempel.
 *
 * Tata tulisnya sengaja hanya punya satu aturan yang perlu diingat: pemisah `|`
 * dan tanda `*` untuk kunci jawaban.
 *
 *   Apa itu closure?                                  → esai
 *   Ibu kota Jepang? | Osaka | *Tokyo | Kyoto         → pilihan ganda
 */

export type ParsedQuestion = {
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  question: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  points: number;
};

export type BulkParseResult = {
  questions: ParsedQuestion[];
  /** Hal yang tetap diterima tetapi layak diberitahukan. */
  warnings: string[];
  /** Baris yang tidak bisa dipakai sama sekali, beserta alasannya. */
  errors: string[];
};

const DEFAULT_POINTS = 10;

/** Poin bawaan soal esai lebih besar: pengerjaannya jelas lebih berat. */
const ESSAY_POINTS = 20;

export function parseBulkQuestions(raw: string): BulkParseResult {
  const questions: ParsedQuestion[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const parts = line.split('|').map((part) => part.trim());
    const question = parts[0];

    if (!question) {
      errors.push(`Baris ${lineNo}: pertanyaannya kosong.`);
      return;
    }

    // Tanpa pemisah, tidak ada opsi — jadi ini soal esai.
    if (parts.length === 1) {
      questions.push({ type: 'ESSAY', question, points: ESSAY_POINTS });
      return;
    }

    const rawOptions = parts.slice(1).filter((part) => part.length > 0);

    if (rawOptions.length < 2) {
      errors.push(
        `Baris ${lineNo}: pilihan ganda butuh minimal dua opsi, baru ada ${rawOptions.length}.`,
      );
      return;
    }

    const marked = rawOptions
      .map((opt, optIdx) => (opt.startsWith('*') ? optIdx : -1))
      .filter((optIdx) => optIdx >= 0);

    if (marked.length > 1) {
      errors.push(
        `Baris ${lineNo}: ada ${marked.length} jawaban ditandai benar, seharusnya tepat satu.`,
      );
      return;
    }

    // Tanpa penanda, opsi pertama yang dianggap kunci — tetapi disebutkan,
    // karena diam-diam menebak kunci jawaban adalah cara paling mudah
    // menerbitkan ujian yang menilai salah.
    const correctIdx = marked.length === 1 ? marked[0] : 0;
    if (marked.length === 0) {
      warnings.push(
        `Baris ${lineNo}: tidak ada opsi bertanda \`*\`, jadi "${rawOptions[0]}" dipakai sebagai kunci.`,
      );
    }

    questions.push({
      type: 'MULTIPLE_CHOICE',
      question,
      points: DEFAULT_POINTS,
      options: rawOptions.map((opt, optIdx) => ({
        // Sama seperti opsi yang dibuat lewat tombol: `Date.now()` saja
        // menghasilkan id kembar untuk opsi yang dibuat pada milidetik yang
        // sama, dan React kehilangan jejak baris mana yang mana.
        id: `${Date.now()}-${lineNo}-${optIdx}`,
        text: opt.startsWith('*') ? opt.slice(1).trim() : opt,
        isCorrect: optIdx === correctIdx,
      })),
    });
  });

  return { questions, warnings, errors };
}
