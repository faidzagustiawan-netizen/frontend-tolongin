import { CreateChallengePayload } from '@/services/challenges.service';

export type BuilderTab =
  | 'BASICS'
  | 'SCHEDULE'
  | 'QUESTIONS'
  | 'SCORING'
  | 'PREVIEW'
  | 'PUBLISH';

const RUBRIC_SYSTEM_KEYS = [
  'proctoringSettings',
  'customOutputs',
  'durationHours',
  'requireProctoring',
];

export type StepStatus = {
  /** Terisi cukup untuk diterbitkan. */
  complete: boolean;
  /** Alasan pertama yang menghalangi, atau null bila sudah beres. */
  blocker: string | null;
  /** Hal yang layak diperbaiki tetapi tidak menghalangi penerbitan. */
  warnings: string[];
};

const isFilled = (value?: string | null) => !!value && value.trim().length > 0;

/** Jenis masalah satu tahap, terpisah dari kalimatnya. */
export type SectionIssueCode =
  | 'UNTITLED'
  | 'BROKEN_CHOICE'
  | 'BROKEN_PSYCHOMETRIC'
  | null;

export type SectionStatus = {
  /** Masalah yang menghalangi penerbitan, bila ada. */
  code: SectionIssueCode;
  /** Kalimat singkat untuk penanda di kartu tahap. */
  label: string | null;
  emptyOfQuestions: boolean;
  blankQuestions: number;
};

/**
 * Menilai satu tahap.
 *
 * Dipakai dua tempat dengan kata-kata berbeda: penanda di kartu tahap, dan
 * kalimat penolakan di stepper. Aturannya cuma boleh hidup di satu tempat —
 * dua salinan aturan yang perlahan berbeda persis seperti yang pernah membuat
 * dua tipe soal bisa disusun tetapi tidak bisa dikerjakan.
 */
export function evaluateSection(section: any): SectionStatus {
  const components = (section?.components || []) as any[];

  const emptyOfQuestions = components.length === 0;
  const blankQuestions = components.filter((c) => !isFilled(c?.question)).length;

  if (!isFilled(section?.title)) {
    return {
      code: 'UNTITLED',
      label: 'Judul tahap belum diisi',
      emptyOfQuestions,
      blankQuestions,
    };
  }

  const brokenChoice = components.some((c) => {
    if (c?.type !== 'MULTIPLE_CHOICE') return false;
    const options = Array.isArray(c.options) ? c.options : [];
    return (
      options.length < 2 ||
      options.filter((o: any) => o?.isCorrect === true).length !== 1 ||
      options.some((o: any) => !String(o?.text ?? '').trim())
    );
  });

  if (brokenChoice) {
    return {
      code: 'BROKEN_CHOICE',
      label: 'Ada pilihan ganda yang opsinya belum benar',
      emptyOfQuestions,
      blankQuestions,
    };
  }

  const brokenPsychometric = components.some((c) => {
    if (c?.type !== 'PSYCHOMETRIC') return false;
    const meta = (c.metadata || {}) as Record<string, any>;
    return !isFilled(meta.dimension);
  });

  if (brokenPsychometric) {
    return {
      code: 'BROKEN_PSYCHOMETRIC',
      label: 'Ada psikotes tanpa nama dimensi',
      emptyOfQuestions,
      blankQuestions,
    };
  }

  return { code: null, label: null, emptyOfQuestions, blankQuestions };
}

/**
 * Menilai kelengkapan tiap langkah penyusunan.
 *
 * Dipakai dua kali: menggerbang tombol "Lanjutkan" dan menentukan centang di
 * penanda langkah. Sebelumnya centang hijau muncul semata-mata karena langkah
 * itu pernah dilewati, jadi enam langkah kosong bisa ditembus sampai ujung dan
 * penolakannya baru datang di layar terakhir — jauh dari tempat kesalahannya.
 */
export function evaluateStep(
  tab: BuilderTab,
  manualData: CreateChallengePayload,
): StepStatus {
  const sections = manualData.sections || [];
  const totalComponents = sections.reduce(
    (acc, section) => acc + (section.components?.length || 0),
    0,
  );

  switch (tab) {
    case 'BASICS': {
      const blocker = !isFilled(manualData.title)
        ? 'Judul studi kasus belum diisi.'
        : !isFilled(manualData.summary)
          ? 'Ringkasan pendek belum diisi.'
          : !isFilled(manualData.description)
            ? 'Deskripsi lengkap belum diisi.'
            : null;

      const warnings: string[] = [];
      if (isFilled(manualData.summary) && manualData.summary.trim().length < 40) {
        warnings.push(
          'Ringkasan sangat pendek. Kandidat memutuskan ikut atau tidak dari kalimat ini.',
        );
      }
      if (
        isFilled(manualData.description) &&
        manualData.description.trim().length < 150
      ) {
        warnings.push(
          'Deskripsi masih singkat. Instruksi yang samar membuat hasil pengerjaan sulit dinilai.',
        );
      }

      return { complete: !blocker, blocker, warnings };
    }

    case 'SCHEDULE': {
      // Batas akhir ditandai wajib di formulir, jadi ditegakkan di sini. Dulu
      // label `required`-nya tidak berarti apa-apa: tidak diperiksa frontend
      // maupun backend, sehingga studi kasus bisa terbit tanpa penutupan.
      const blocker = !isFilled(manualData.deadlineAt)
        ? 'Batas akhir belum ditentukan.'
        : null;

      const warnings: string[] = [];
      if (manualData.startsAt && manualData.deadlineAt) {
        const starts = new Date(manualData.startsAt).getTime();
        const ends = new Date(manualData.deadlineAt).getTime();
        if (Number.isFinite(starts) && Number.isFinite(ends) && ends <= starts) {
          return {
            complete: false,
            blocker: 'Batas akhir harus lebih lambat daripada tanggal mulai.',
            warnings,
          };
        }
      }

      if (manualData.deadlineAt) {
        const ends = new Date(manualData.deadlineAt).getTime();
        if (Number.isFinite(ends) && ends < Date.now()) {
          warnings.push('Batas akhir sudah lewat. Kandidat tidak akan bisa mendaftar.');
        }
      }

      return { complete: !blocker, blocker, warnings };
    }

    case 'QUESTIONS': {
      if (sections.length === 0) {
        return {
          complete: false,
          blocker: 'Belum ada satu pun tahap.',
          warnings: [],
        };
      }

      // Aturannya hidup di `evaluateSection`; di sini hanya dirangkum jadi
      // kalimat untuk stepper.
      const perSection = sections.map(evaluateSection);

      const emptySection = perSection.findIndex((s) => s.emptyOfQuestions);
      const untitled = perSection.findIndex((s) => s.code === 'UNTITLED');

      const blocker =
        untitled >= 0
          ? `Tahap ke-${untitled + 1} belum punya judul.`
          : null;

      const warnings: string[] = [];
      if (emptySection >= 0) {
        warnings.push(
          `Tahap "${sections[emptySection].title || emptySection + 1}" belum berisi soal.`,
        );
      }

      // Soal tanpa pertanyaan lolos ke kandidat sebagai layar kosong.
      const blankQuestions = perSection.reduce(
        (acc, s) => acc + s.blankQuestions,
        0,
      );
      if (blankQuestions > 0) {
        warnings.push(`${blankQuestions} soal belum diisi pertanyaannya.`);
      }

      if (perSection.some((s) => s.code === 'BROKEN_CHOICE')) {
        return {
          complete: false,
          blocker:
            'Ada soal pilihan ganda yang opsinya kurang dari dua, kosong, atau jawaban benarnya bukan tepat satu.',
          warnings,
        };
      }

      if (perSection.some((s) => s.code === 'BROKEN_PSYCHOMETRIC')) {
        return {
          complete: false,
          blocker: 'Ada soal psikotes yang belum diisi nama dimensinya.',
          warnings,
        };
      }

      return { complete: !blocker, blocker, warnings };
    }

    case 'SCORING': {
      const rubricEntries = Object.entries(manualData.gradingRubric || {}).filter(
        ([key]) => !RUBRIC_SYSTEM_KEYS.includes(key),
      );
      const rubricTotal = rubricEntries.reduce(
        (acc, [, value]) => acc + (Number(value) || 0),
        0,
      );

      // Rubrik hanya mengikat saat tidak ada soal berpoin.
      const rubricBinding = totalComponents === 0;
      const blocker =
        rubricBinding && rubricEntries.length > 0 && rubricTotal !== 100
          ? `Total bobot rubrik harus 100%, saat ini ${rubricTotal}%.`
          : rubricBinding && rubricEntries.length === 0
            ? 'Tanpa soal berpoin, penilaian bersandar pada rubrik — tambahkan minimal satu kriteria.'
            : null;

      return { complete: !blocker, blocker, warnings: [] };
    }

    // Pratinjau tidak punya isian; melihatnya sudah cukup.
    case 'PREVIEW':
    case 'PUBLISH':
    default:
      return { complete: true, blocker: null, warnings: [] };
  }
}

/** Langkah pertama yang masih menghalangi penerbitan, bila ada. */
export function firstBlockingStep(
  manualData: CreateChallengePayload,
): { tab: BuilderTab; blocker: string } | null {
  const order: BuilderTab[] = ['BASICS', 'SCHEDULE', 'QUESTIONS', 'SCORING'];

  for (const tab of order) {
    const status = evaluateStep(tab, manualData);
    if (status.blocker) return { tab, blocker: status.blocker };
  }

  return null;
}
