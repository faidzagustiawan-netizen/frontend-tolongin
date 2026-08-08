import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Play, CheckCircle2, Lock, Clock } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { QuestionTypeRegistry } from '@/components/question-types';
import { describeStageGate } from './StageGateSettings';
import { Section } from '@/types';

interface PreviewTabProps {
  manualData: CreateChallengePayload;
  /** Kembali ke penyuntingan soal. */
  onClose: () => void;
  /** Pratinjau dianggap sesuai; langsung ke langkah publikasi. */
  onApprove: () => void;
}

export default function PreviewTab({ manualData, onClose, onApprove }: PreviewTabProps) {
  // null means showing timeline/dashboard. Otherwise showing active stage index.
  const [activeStageIdx, setActiveStageIdx] = useState<number | null>(null);
  
  // States for Exam Mode
  const [examQuestionIdx, setExamQuestionIdx] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});

  // Mock stage completion state
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  const formatTime = (minutes?: number | null) => {
    if (!minutes) return 'Tidak ada batas waktu';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} jam ${m > 0 ? m + ' mnt' : ''}`;
    return `${m} menit`;
  };

  const handleStartStage = (idx: number) => {
    setActiveStageIdx(idx);
    setExamQuestionIdx(0);
  };

  const handleSubmitStage = (idx: number) => {
    // Dulu `alert()` bawaan peramban berisi dump JSON jawaban — sisa
    // penelusuran yang ikut tampil ke perusahaan yang sedang melihat pratinjau
    // studi kasusnya sendiri. Yang perlu mereka tahu cuma bahwa ini simulasi.
    toast.success(
      `Tahap ${idx + 1} selesai. Ini pratinjau — jawaban tidak dikirim ke mana pun.`,
    );

    setCompletedStages([...completedStages, idx]);
    setActiveStageIdx(null);
    setExamAnswers({});
  };

  // --- RENDER TIMELINE / DASHBOARD ---
  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">{manualData.title || 'Untitled Challenge'}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{manualData.summary || 'Deskripsi singkat belum diatur.'}</p>
      </div>

      <div className="bg-background/50 border border-border rounded-2xl p-8">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" /> Milestone Tahapan
        </h2>

        <div className="space-y-6">
          {(manualData.sections || []).map((section, idx) => {
            const isCompleted = completedStages.includes(idx);
            // In a real app, logic for locking might depend on previous stage completion
            const isLocked = idx > 0 && !completedStages.includes(idx - 1);

            return (
              <div key={idx} className={`relative flex gap-6 ${isLocked ? 'opacity-50' : ''}`}>
                {/* Timeline Line */}
                {idx !== (manualData.sections?.length || 0) - 1 && (
                  <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-border"></div>
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                  isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                  isLocked ? 'bg-background border-border text-muted-foreground' :
                  'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : isLocked ? <Lock className="w-5 h-5" /> : <span className="font-bold">{idx + 1}</span>}
                </div>

                {/* Card */}
                <div className={`flex-1 bg-card border border-border rounded-xl p-5 ${isLocked ? '' : 'hover:border-foreground/10 transition-colors'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.components?.length || 0} Tugas • {formatTime(section.timeLimit)}
                      </p>
                      {/* Syarat masuk ikut ditampilkan supaya pratinjau ini
                          mencerminkan aturan yang sebenarnya, bukan hanya
                          urutan tahapnya. */}
                      <p className="text-xs text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
                        {describeStageGate(
                          section as Section,
                          (manualData.sections || []) as Section[],
                          idx,
                        )}
                      </p>
                    </div>

                    <div>
                      {isCompleted ? (
                        <button disabled className="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Selesai
                        </button>
                      ) : isLocked ? (
                        <button disabled className="px-5 py-2.5 rounded-xl font-bold text-sm bg-background text-muted-foreground flex items-center gap-2 cursor-not-allowed border border-border">
                          <Lock className="w-4 h-4" /> Terkunci
                        </button>
                      ) : (
                        <button onClick={() => handleStartStage(idx)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-600 text-black flex items-center gap-2 transition-colors">
                          <Play className="w-4 h-4" /> Mulai Tahap
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(!manualData.sections || manualData.sections.length === 0) && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
              Belum ada tahapan yang dirancang.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- RENDER EXAM MODE (QUIZ) ---
  const renderExamMode = (section: any) => {
    const totalQuestions = section.components?.length || 0;
    const currentComp = section.components?.[examQuestionIdx];

    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col sm:flex-row gap-6 p-6">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl text-foreground">Soal No. {examQuestionIdx + 1}</h2>
              <p className="text-sm text-muted-foreground mt-1">Pilih satu jawaban yang paling tepat.</p>
            </div>
            <div className="px-4 py-2 bg-background border border-border rounded-lg text-emerald-400 font-mono font-bold flex items-center gap-2">
               <Clock className="w-4 h-4" /> {section.timeLimit ? `${section.timeLimit}:00` : '--:--'}
            </div>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            {currentComp ? (
              <div className="max-w-3xl">
                <p className="text-lg text-foreground mb-8 leading-relaxed whitespace-pre-wrap">{currentComp.question}</p>
                <div className="space-y-4">
                  {(() => {
                    const TypeComponent = QuestionTypeRegistry[currentComp.type]?.Solver;
                    if (!TypeComponent) return <p className="text-red-400 text-sm">Tipe komponen {currentComp.type} belum didukung di Preview.</p>;
                    return (
                      <TypeComponent
                        comp={currentComp}
                        value={examAnswers[`${examQuestionIdx}`]}
                        onChange={(val: any) => setExamAnswers({ ...examAnswers, [`${examQuestionIdx}`]: val })}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Soal tidak ditemukan.</p>
            )}
          </div>

          <div className="p-6 border-t border-border bg-[#111] flex items-center justify-between">
            <button 
              disabled={examQuestionIdx === 0}
              onClick={() => setExamQuestionIdx(Math.max(0, examQuestionIdx - 1))}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-background border border-border text-foreground hover:bg-foreground/5 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            
            {examQuestionIdx === totalQuestions - 1 ? (
              <button onClick={() => handleSubmitStage(activeStageIdx!)} className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-black flex items-center gap-2">
                Selesai & Kumpulkan <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => setExamQuestionIdx(Math.min(totalQuestions - 1, examQuestionIdx + 1))}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-600 text-black flex items-center gap-2"
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Navigation Grid */}
        <div className="w-full sm:w-72 bg-card border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="font-bold text-foreground mb-4">Navigasi Soal</h3>
          <div className="grid grid-cols-5 gap-2 overflow-y-auto custom-scrollbar flex-1 content-start">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isAnswered = !!examAnswers[`${idx}`];
              const isActive = examQuestionIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setExamQuestionIdx(idx)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                    isActive 
                      ? 'bg-cyan-500 text-black border-2 border-white' 
                      : isAnswered 
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400' 
                        : 'bg-background border border-border text-muted-foreground hover:bg-foreground/5'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/30"></div> Sudah Dijawab</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-background border border-border"></div> Belum Dijawab</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
          </div>
          <span className="font-bold text-foreground text-lg">Platform Assessment</span>
          <span className="bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-0.5 rounded ml-2 border border-yellow-500/30 uppercase tracking-wider">
            Mode Preview
          </span>
        </div>
        {/* Dua jalan keluar, bukan satu. Sebelumnya pratinjau hanya bisa
            ditutup kembali ke tempat asal, sehingga meninjau lalu menerbitkan
            berarti mencari sendiri langkah publikasi di stepper. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Kembali ke Tahapan &amp; Soal
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Sudah Sesuai, Lanjut Publikasi
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeStageIdx === null
        ? renderDashboard()
        : renderExamMode(manualData.sections![activeStageIdx])}
    </div>
  );
}


