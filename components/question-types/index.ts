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
