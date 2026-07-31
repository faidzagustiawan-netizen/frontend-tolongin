export interface QuestionComponent {
  type: string;
  question: string;
  description?: string;
  points: number;
  options?: any[];
  metadata?: any;
}

export interface BuilderProps {
  comp: QuestionComponent;
  onChange: (field: string, value: any) => void;
}

export interface SolverProps {
  comp: QuestionComponent;
  value: any;
  onChange: (value: any) => void;
  /**
   * Jawaban sudah dikumpulkan; tampilkan isinya tanpa bisa diubah.
   *
   * Layar pengerjaan sebelumnya menegakkan ini sendiri lewat `readOnly` di tiap
   * kolom yang ditulisnya sendiri. Begitu tampilan soal dipusatkan di sini,
   * aturannya harus ikut pindah — kalau tidak, kolom terlihat masih bisa
   * diketik padahal perubahannya dibuang diam-diam.
   */
  readOnly?: boolean;
}
