import { describe, expect, it } from 'vitest';
import { parseBulkQuestions } from './bulkQuestions';

describe('parseBulkQuestions', () => {
  it('membaca baris tanpa pemisah sebagai soal esai', () => {
    const { questions, errors } = parseBulkQuestions('Jelaskan apa itu closure.');

    expect(errors).toEqual([]);
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('ESSAY');
    expect(questions[0].question).toBe('Jelaskan apa itu closure.');
    expect(questions[0].options).toBeUndefined();
  });

  it('membaca pilihan ganda dan menandai kunci bertanda bintang', () => {
    const { questions, warnings, errors } = parseBulkQuestions(
      'Ibu kota Jepang? | Osaka | *Tokyo | Kyoto',
    );

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(questions[0].type).toBe('MULTIPLE_CHOICE');
    expect(questions[0].options?.map((o) => o.text)).toEqual([
      'Osaka',
      'Tokyo',
      'Kyoto',
    ]);
    expect(questions[0].options?.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(questions[0].options?.find((o) => o.isCorrect)?.text).toBe('Tokyo');
  });

  it('memakai opsi pertama sebagai kunci bila tidak ada yang ditandai, dan mengatakannya', () => {
    const { questions, warnings } = parseBulkQuestions('Pilih satu | A | B');

    expect(questions[0].options?.find((o) => o.isCorrect)?.text).toBe('A');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/tidak ada opsi bertanda/);
  });

  it('menolak pilihan ganda dengan kunci lebih dari satu', () => {
    const { questions, errors } = parseBulkQuestions('Mana benar | *A | *B');

    expect(questions).toHaveLength(0);
    expect(errors[0]).toMatch(/2 jawaban ditandai benar/);
  });

  it('menolak pilihan ganda yang opsinya kurang dari dua', () => {
    const { questions, errors } = parseBulkQuestions('Hanya satu opsi | A');

    expect(questions).toHaveLength(0);
    expect(errors[0]).toMatch(/minimal dua opsi/);
  });

  it('melewati baris kosong dan menomori galat menurut baris berisi', () => {
    const { questions, errors } = parseBulkQuestions(
      '\n\nSoal esai pertama\n\n  \nMana benar | *A | *B\n',
    );

    expect(questions).toHaveLength(1);
    expect(errors[0]).toMatch(/^Baris 2:/);
  });

  it('membaca banyak soal sekaligus', () => {
    const { questions, errors } = parseBulkQuestions(
      [
        'Apa itu REST? ',
        'HTTP status untuk not found? | 200 | *404 | 500',
        'Sebutkan tiga prinsip SOLID.',
      ].join('\n'),
    );

    expect(errors).toEqual([]);
    expect(questions.map((q) => q.type)).toEqual([
      'ESSAY',
      'MULTIPLE_CHOICE',
      'ESSAY',
    ]);
  });

  it('membuang id opsi yang kembar antar baris', () => {
    const { questions } = parseBulkQuestions(
      'Soal A | *satu | dua\nSoal B | *satu | dua',
    );

    const ids = questions.flatMap((q) => q.options ?? []).map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mengembalikan hasil kosong untuk tempelan kosong', () => {
    expect(parseBulkQuestions('   \n\n  ')).toEqual({
      questions: [],
      warnings: [],
      errors: [],
    });
  });
});
