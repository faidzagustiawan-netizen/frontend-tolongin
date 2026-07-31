import React from 'react';
import MultipleChoiceBuilder from './MultipleChoice/Builder';
import MultipleChoiceSolver from './MultipleChoice/Solver';
import EssayBuilder from './Essay/Builder';
import EssaySolver from './Essay/Solver';
import LiveCodingBuilder from './LiveCoding/Builder';
import LiveCodingSolver from './LiveCoding/Solver';
import FileUploadBuilder from './FileUpload/Builder';
import FileUploadSolver from './FileUpload/Solver';
import UrlLinkBuilder from './UrlLink/Builder';
import UrlLinkSolver from './UrlLink/Solver';
import VideoRecordingBuilder from './VideoRecording/Builder';
import VideoRecordingSolver from './VideoRecording/Solver';
import PsychometricBuilder from './Psychometric/Builder';
import PsychometricSolver from './Psychometric/Solver';

/**
 * Kuncinya HARUS sama persis dengan enum `ComponentType` di Prisma.
 *
 * Dua di antaranya dulu meleset — `URL_LINK` dan `VIDEO_RECORDING`, sementara
 * enumnya `URL_SUBMISSION` dan `VIDEO_UPLOAD`. Builder menyimpan tipe versi
 * enum, jadi pencarian di sini selalu gagal dan kedua tipe soal itu tampil
 * sebagai "Tipe komponen belum didukung" baik saat disusun maupun dikerjakan.
 */
/**
 * Kolom `ComponentResponse` tempat jawaban tiap tipe disimpan.
 *
 * Layar pengerjaan dulu menuliskan pemetaan ini di dalam JSX-nya, satu cabang
 * `&&` per tipe. Akibatnya menambah tipe soal berarti mengingat dua tempat, dan
 * yang terlewat tidak berbunyi apa-apa — PSYCHOMETRIC dan VIDEO_UPLOAD sampai
 * ke kandidat sebagai layar kosong justru karena itu.
 */
export const RESPONSE_FIELD: Record<string, 'textValue' | 'fileUrl'> = {
  MULTIPLE_CHOICE: 'textValue',
  ESSAY: 'textValue',
  LIVE_CODING: 'textValue',
  URL_SUBMISSION: 'textValue',
  PSYCHOMETRIC: 'textValue',
  FILE_UPLOAD: 'fileUrl',
  VIDEO_UPLOAD: 'fileUrl',
};

export const QuestionTypeRegistry: Record<string, {
  Builder: React.FC<any>;
  Solver: React.FC<any>;
}> = {
  MULTIPLE_CHOICE: {
    Builder: MultipleChoiceBuilder,
    Solver: MultipleChoiceSolver,
  },
  ESSAY: {
    Builder: EssayBuilder,
    Solver: EssaySolver,
  },
  LIVE_CODING: {
    Builder: LiveCodingBuilder,
    Solver: LiveCodingSolver,
  },
  FILE_UPLOAD: {
    Builder: FileUploadBuilder,
    Solver: FileUploadSolver,
  },
  URL_SUBMISSION: {
    Builder: UrlLinkBuilder,
    Solver: UrlLinkSolver,
  },
  VIDEO_UPLOAD: {
    Builder: VideoRecordingBuilder,
    Solver: VideoRecordingSolver,
  },
  PSYCHOMETRIC: {
    Builder: PsychometricBuilder,
    Solver: PsychometricSolver,
  },
};
