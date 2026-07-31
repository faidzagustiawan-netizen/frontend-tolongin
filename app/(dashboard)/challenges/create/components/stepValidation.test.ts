import { describe, expect, it } from 'vitest';
import { evaluateStep, firstBlockingStep } from './stepValidation';
import { CreateChallengePayload } from '@/services/challenges.service';

const base = (over: Partial<CreateChallengePayload> = {}): CreateChallengePayload =>
  ({
    title: 'Studi Kasus Backend',
    summary: 'Ringkasan yang cukup panjang untuk lolos ambang peringatan minimum.',
    description:
      'Deskripsi lengkap yang panjangnya melebihi seratus lima puluh karakter supaya tidak memicu peringatan singkat. Berisi latar belakang, objektif, dan persyaratan teknis yang jelas bagi kandidat.',
    category: 'BACKEND',
    difficulty: 'INTERMEDIATE',
    deadlineAt: '2099-01-01T00:00:00.000Z',
    sections: [
      {
        title: 'Tahap 1',
        order: 0,
        components: [{ type: 'ESSAY', question: 'Q', points: 10, order: 0 }],
      },
    ],
    ...over,
  }) as CreateChallengePayload;

describe('evaluateStep — BASICS', () => {
  it('menahan judul kosong', () => {
    expect(evaluateStep('BASICS', base({ title: '' })).blocker).toMatch(/Judul/);
  });

  it('menahan judul yang hanya berisi spasi', () => {
    expect(evaluateStep('BASICS', base({ title: '   ' })).blocker).toMatch(/Judul/);
  });

  it('meloloskan isian lengkap tanpa peringatan', () => {
    const status = evaluateStep('BASICS', base());
    expect(status.complete).toBe(true);
    expect(status.warnings).toHaveLength(0);
  });

  it('memperingatkan ringkasan pendek tanpa menahannya', () => {
    const status = evaluateStep('BASICS', base({ summary: 'Pendek' }));
    expect(status.complete).toBe(true);
    expect(status.warnings.join(' ')).toMatch(/Ringkasan sangat pendek/);
  });
});

describe('evaluateStep — SCHEDULE', () => {
  it('menahan batas akhir yang kosong', () => {
    // Label `required` di formulir dulu tidak diperiksa siapa pun.
    expect(evaluateStep('SCHEDULE', base({ deadlineAt: undefined })).blocker).toMatch(
      /Batas akhir/,
    );
  });

  it('menahan batas akhir yang lebih awal daripada tanggal mulai', () => {
    const status = evaluateStep(
      'SCHEDULE',
      base({
        startsAt: '2099-02-01T00:00:00.000Z',
        deadlineAt: '2099-01-01T00:00:00.000Z',
      }),
    );
    expect(status.blocker).toMatch(/lebih lambat/);
  });

  it('memperingatkan batas akhir yang sudah lewat tanpa menahannya', () => {
    const status = evaluateStep('SCHEDULE', base({ deadlineAt: '2020-01-01T00:00:00.000Z' }));
    expect(status.complete).toBe(true);
    expect(status.warnings.join(' ')).toMatch(/sudah lewat/);
  });
});

describe('evaluateStep — QUESTIONS', () => {
  it('menahan ketika belum ada tahap', () => {
    expect(evaluateStep('QUESTIONS', base({ sections: [] })).blocker).toMatch(/tahap/);
  });

  it('menahan tahap tanpa judul', () => {
    const status = evaluateStep(
      'QUESTIONS',
      base({ sections: [{ title: '', order: 0, components: [] }] as any }),
    );
    expect(status.blocker).toMatch(/judul/);
  });

  it('menahan pilihan ganda tanpa jawaban benar', () => {
    const status = evaluateStep(
      'QUESTIONS',
      base({
        sections: [
          {
            title: 'Tahap 1',
            order: 0,
            components: [
              {
                type: 'MULTIPLE_CHOICE',
                question: 'Q',
                options: [
                  { text: 'a', isCorrect: false },
                  { text: 'b', isCorrect: false },
                ],
              },
            ],
          },
        ] as any,
      }),
    );
    expect(status.blocker).toMatch(/pilihan ganda/);
  });

  it('menahan psikotes tanpa nama dimensi', () => {
    const status = evaluateStep(
      'QUESTIONS',
      base({
        sections: [
          {
            title: 'Tahap 1',
            order: 0,
            components: [{ type: 'PSYCHOMETRIC', question: 'Q', metadata: { dimension: '' } }],
          },
        ] as any,
      }),
    );
    expect(status.blocker).toMatch(/dimensi/);
  });

  it('memperingatkan tahap kosong tanpa menahannya', () => {
    const status = evaluateStep(
      'QUESTIONS',
      base({ sections: [{ title: 'Tahap 1', order: 0, components: [] }] as any }),
    );
    expect(status.complete).toBe(true);
    expect(status.warnings.join(' ')).toMatch(/belum berisi soal/);
  });
});

describe('evaluateStep — SCORING', () => {
  it('mengabaikan rubrik ketika penilaian memakai poin soal', () => {
    const status = evaluateStep('SCORING', base({ gradingRubric: { kualitas: 40, kecepatan: 40 } }));
    expect(status.complete).toBe(true);
  });

  it('menahan total rubrik yang bukan 100 ketika tidak ada soal berpoin', () => {
    const status = evaluateStep(
      'SCORING',
      base({
        sections: [{ title: 'Tahap 1', order: 0, components: [] }] as any,
        gradingRubric: { kualitas: 40, kecepatan: 40 },
      }),
    );
    expect(status.blocker).toMatch(/100%/);
  });

  it('menahan ketika tidak ada soal maupun kriteria rubrik', () => {
    const status = evaluateStep(
      'SCORING',
      base({
        sections: [{ title: 'Tahap 1', order: 0, components: [] }] as any,
        gradingRubric: {},
      }),
    );
    expect(status.blocker).toMatch(/rubrik/);
  });

  it('tidak menghitung kunci sistem sebagai kriteria penilaian', () => {
    const status = evaluateStep(
      'SCORING',
      base({ gradingRubric: { proctoringSettings: { requireFaceScan: true } } as any }),
    );
    expect(status.complete).toBe(true);
  });
});

describe('firstBlockingStep', () => {
  it('mengembalikan null saat seluruh langkah beres', () => {
    expect(firstBlockingStep(base())).toBeNull();
  });

  it('menunjuk langkah paling awal yang bermasalah', () => {
    expect(firstBlockingStep(base({ title: '', deadlineAt: undefined }))?.tab).toBe('BASICS');
  });

  it('menunjuk jadwal ketika informasi dasar sudah beres', () => {
    expect(firstBlockingStep(base({ deadlineAt: undefined }))?.tab).toBe('SCHEDULE');
  });
});
