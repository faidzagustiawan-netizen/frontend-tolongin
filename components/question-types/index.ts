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
  URL_LINK: {
    Builder: UrlLinkBuilder,
    Solver: UrlLinkSolver,
  },
  VIDEO_RECORDING: {
    Builder: VideoRecordingBuilder,
    Solver: VideoRecordingSolver,
  },
};
