import React, { useState } from 'react';
import { ChevronLeft, UploadCloud, ChevronRight, Play, CheckCircle2, Lock, Clock } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { pistonService } from '@/services/piston.service';
import { QuestionTypeRegistry } from '@/components/question-types';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => <div className="p-4 bg-background text-muted-foreground animate-pulse text-xs font-mono">Memuat Editor...</div> });

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
  
  // States for Assignment Mode
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, any>>({});

  // Mock stage completion state
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  // States for Live Coding Execution
  const [executionOutput, setExecutionOutput] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  const handleRunCode = async (compId: string, language: string) => {
    setIsExecuting(prev => ({ ...prev, [compId]: true }));
    setExecutionOutput(prev => ({ ...prev, [compId]: 'Executing...' }));
    try {
      const code = assignmentAnswers[`q-${compId}`] || '';
      const output = await pistonService.execute(language, code);
      setExecutionOutput(prev => ({ ...prev, [compId]: output }));
    } catch (err: any) {
      setExecutionOutput(prev => ({ ...prev, [compId]: `[Error]\n${err.message}` }));
    } finally {
      setIsExecuting(prev => ({ ...prev, [compId]: false }));
    }
  };

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
    const isExam = manualData.sections?.[idx]?.stageType === 'QUIZ';
    const answersToSubmit = isExam ? examAnswers : assignmentAnswers;
    
    alert(`Berhasil mengumpulkan stage ${idx + 1}! Payload Jawaban:\n\n${JSON.stringify(answersToSubmit, null, 2)}`);
    
    setCompletedStages([...completedStages, idx]);
    setActiveStageIdx(null);
    if (isExam) setExamAnswers({});
    else setAssignmentAnswers({});
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-foreground/5 border border-foreground/10 text-muted-foreground uppercase">
                          {section.stageType || 'ASSIGNMENT'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.components?.length || 0} Tugas • {formatTime(section.timeLimit)}
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

  // --- RENDER ASSIGNMENT MODE ---
  const renderAssignmentMode = (section: any) => {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setActiveStageIdx(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Dashboard
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">{section.title}</h1>
            <p className="text-muted-foreground">Selesaikan penugasan di bawah ini sebelum batas waktu berakhir.</p>
          </div>
          <div className="px-6 py-3 bg-card border border-border rounded-xl text-emerald-400 font-mono font-bold text-xl flex items-center gap-3">
             <Clock className="w-6 h-6" /> {section.timeLimit ? `${section.timeLimit}:00` : '--:--'}
          </div>
        </div>

        <div className="space-y-6 mb-12">
          {(section.components || []).map((comp: any, compIdx: number) => (
            <div key={compIdx} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border bg-[#111]">
                <div className="flex justify-between items-start gap-4">
                   <h3 className="text-lg font-bold text-foreground leading-relaxed">{compIdx + 1}. {comp.question || 'Tanpa Instruksi'}</h3>
                   <span className="shrink-0 text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-500/20 uppercase">
                     {comp.type.replace('_', ' ')}
                   </span>
                </div>
              </div>
              
              <div className="p-6 bg-background/50">
                {comp.type === 'FILE_UPLOAD' && (
                  <label className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors cursor-pointer">
                    <UploadCloud className="w-12 h-12 mb-3 text-cyan-500/50" />
                    <p className="font-medium text-foreground mb-1">
                      {assignmentAnswers[`q-${compIdx}`] ? assignmentAnswers[`q-${compIdx}`].name : 'Klik untuk Upload File'}
                    </p>
                    <p className="text-sm">Atau drag and drop file di sini (PDF, ZIP, maks 50MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: e.target.files?.[0] })}
                    />
                  </label>
                )}
                
                {comp.type === 'ESSAY' && (
                  <textarea 
                    rows={5} 
                    value={assignmentAnswers[`q-${compIdx}`] || ''}
                    onChange={(e) => setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Tuliskan jawaban Anda di sini..."
                  ></textarea>
                )}
                
                {comp.type === 'LIVE_CODING' && (
                  <div className="flex flex-col bg-[#0d0d0d] border border-border rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-[#1a1a1a] px-4 py-3 border-b border-border flex justify-between items-center">
                       <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 font-mono">
                         main.{comp.metadata?.language === 'typescript' ? 'ts' : comp.metadata?.language === 'python' ? 'py' : comp.metadata?.language === 'go' ? 'go' : comp.metadata?.language === 'java' ? 'java' : comp.metadata?.language === 'rust' ? 'rs' : 'js'}
                       </span>
                       <button
                         type="button"
                         onClick={() => handleRunCode(compIdx.toString(), comp.metadata?.language || 'javascript')}
                         disabled={isExecuting[compIdx.toString()]}
                         className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                       >
                         <Play className="w-4 h-4 fill-current" />
                         {isExecuting[compIdx.toString()] ? 'Running...' : 'Run Code'}
                       </button>
                    </div>
                    <Editor
                      height="400px"
                      language={comp.metadata?.language || 'javascript'}
                      theme="vs-dark"
                      value={assignmentAnswers[`q-${compIdx}`] || ''}
                      onChange={(value) => setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: value })}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        formatOnPaste: true
                      }}
                    />
                    
                    <div className="bg-[#1e1e1e] border-t border-border flex flex-col">
                      <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-border">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terminal Output</span>
                      </div>
                      <div className="p-4 h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
                        {executionOutput[compIdx.toString()] ? (
                          <pre className={executionOutput[compIdx.toString()].startsWith('[Error]') || executionOutput[compIdx.toString()].startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
                            {executionOutput[compIdx.toString()]}
                          </pre>
                        ) : (
                          <span className="text-gray-600 italic">Klik 'Run Code' untuk melihat hasil eksekusi...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {comp.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    {(comp.options || []).map((opt: any, optIdx: number) => (
                      <label key={optIdx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background cursor-pointer hover:border-foreground/20 transition-all">
                        <input 
                          type="radio" 
                          name={`assignment-q-${compIdx}`} 
                          checked={assignmentAnswers[`q-${compIdx}`] === opt.text}
                          onChange={() => setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: opt.text })}
                          className="mt-1 w-5 h-5 text-cyan-500 bg-transparent" 
                        />
                        <span className="text-foreground">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {comp.type === 'URL_LINK' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Masukkan Tautan (URL)</label>
                    <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                      <div className="px-4 py-3 bg-[#1a1a1a] border-r border-border text-muted-foreground">
                        https://
                      </div>
                      <input 
                        type="url" 
                        value={assignmentAnswers[`q-${compIdx}`] || ''}
                        onChange={(e) => setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: e.target.value })}
                        className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder-gray-600 focus:outline-none"
                        placeholder="contoh: github.com/username/repo"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Pastikan tautan dapat diakses secara publik (contoh: Github Repo, Figma, Google Drive).</p>
                  </div>
                )}

                {comp.type === 'VIDEO_RECORDING' && (
                  <button 
                    onClick={() => {
                      const isRecording = assignmentAnswers[`q-${compIdx}`] === 'recorded';
                      setAssignmentAnswers({ ...assignmentAnswers, [`q-${compIdx}`]: isRecording ? null : 'recorded' });
                    }}
                    className={`w-full border-2 border-dashed ${assignmentAnswers[`q-${compIdx}`] === 'recorded' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400' : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5 text-muted-foreground'} rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer`}
                  >
                    <div className={`w-12 h-12 rounded-full ${assignmentAnswers[`q-${compIdx}`] === 'recorded' ? 'bg-emerald-500/20' : 'bg-purple-500/10'} flex items-center justify-center mb-3`}>
                      <div className={`w-4 h-4 rounded-full ${assignmentAnswers[`q-${compIdx}`] === 'recorded' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                    </div>
                    <p className="font-medium mb-1">
                      {assignmentAnswers[`q-${compIdx}`] === 'recorded' ? 'Rekaman Berhasil Disimpan (Mock)' : 'Mulai Perekaman Video/Audio'}
                    </p>
                    <p className="text-sm">Sistem akan meminta izin akses kamera dan mikrofon Anda.</p>
                  </button>
                )}
              </div>
            </div>
          ))}

          {(!section.components || section.components.length === 0) && (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl bg-card">
              Belum ada tugas pada tahapan ini.
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-6">
          <button onClick={() => handleSubmitStage(activeStageIdx!)} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl flex items-center gap-2 transition-all">
            Kumpulkan Penugasan <CheckCircle2 className="w-5 h-5" />
          </button>
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
      {activeStageIdx === null ? (
        renderDashboard()
      ) : (
        manualData.sections![activeStageIdx].stageType === 'QUIZ' 
          ? renderExamMode(manualData.sections![activeStageIdx])
          : renderAssignmentMode(manualData.sections![activeStageIdx])
      )}
    </div>
  );
}


