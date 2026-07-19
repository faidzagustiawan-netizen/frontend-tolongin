import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Plus, GripVertical, Settings, ChevronDown, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DurationPicker } from '@/components/common/DurationPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionTypeRegistry } from '@/components/question-types';

interface QuestionBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

export default function QuestionBuilder({ manualData, setManualData }: QuestionBuilderProps) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(0);
  const [expandedCompIdx, setExpandedCompIdx] = useState<number | null>(null);
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Ensure all existing sections are set to QUIZ
    if (manualData.sections && manualData.sections.length > 0) {
      let needsUpdate = false;
      const newSections = manualData.sections.map(sec => {
        if (sec.stageType !== 'QUIZ') {
          needsUpdate = true;
          return { ...sec, stageType: 'QUIZ' };
        }
        return sec;
      });
      if (needsUpdate) {
        setManualData(prev => ({ ...prev, sections: newSections as any }));
      }
    } else if (!manualData.sections || manualData.sections.length === 0) {
      // Add default section if none exists
      setManualData(prev => ({
        ...prev,
        sections: [{ title: 'Bagian 1', order: 0, components: [], timeLimit: null, stageType: 'QUIZ' }]
      }));
      setSelectedSectionIdx(0);
    }
  }, []);

  useEffect(() => {
    if (isEditorExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditorExpanded]);

  const addSection = () => {
    setManualData((prev) => ({
      ...prev,
      sections: [
        ...(prev.sections || []),
        { title: `Bagian ${(prev.sections?.length || 0) + 1}`, order: prev.sections?.length || 0, components: [], timeLimit: null, stageType: 'QUIZ' }
      ]
    }));
    setSelectedSectionIdx((manualData.sections?.length || 0));
    setExpandedCompIdx(null);
  };

  const removeSection = (secIdx: number) => {
    const newSections = [...(manualData.sections || [])];
    newSections.splice(secIdx, 1);
    setManualData({ ...manualData, sections: newSections });
    if (selectedSectionIdx === secIdx) {
      setSelectedSectionIdx(newSections.length > 0 ? 0 : null);
      setExpandedCompIdx(null);
    }
  };

  const updateSectionTitle = (secIdx: number, title: string) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx] = { ...newSections[secIdx], title };
    setManualData({ ...manualData, sections: newSections });
  };

  const updateSectionTimeLimit = (secIdx: number, timeLimit: number | null) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx] = { ...newSections[secIdx], timeLimit };
    setManualData({ ...manualData, sections: newSections });
  };

  const addComponent = (secIdx: number, type: string) => {
    const newSections = [...(manualData.sections || [])];
    const sec = newSections[secIdx];
    const newComp = {
      type,
      question: '',
      description: '',
      points: 10,
      options: type === 'MULTIPLE_CHOICE' ? [{ id: Date.now().toString(), text: '', isCorrect: true }] : undefined,
      metadata: type === 'LIVE_CODING' ? { language: 'javascript' } : undefined,
      content: '',
    } as any;
    sec.components = [...(sec.components || []), newComp];
    setManualData({ ...manualData, sections: newSections });
    setExpandedCompIdx(sec.components.length - 1);
  };

  const removeComponent = (secIdx: number, compIdx: number) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx].components.splice(compIdx, 1);
    setManualData({ ...manualData, sections: newSections });
    if (expandedCompIdx === compIdx) {
      setExpandedCompIdx(null);
    }
  };

  const updateComponent = (secIdx: number, compIdx: number, field: string, value: any) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx].components[compIdx] = { ...newSections[secIdx].components[compIdx], [field]: value };
    setManualData({ ...manualData, sections: newSections });
  };

  const totalPoints = (manualData.sections || []).reduce((acc, sec) => {
    return acc + (sec.components || []).reduce((cAcc: number, comp: any) => cAcc + (Number(comp.points) || 0), 0);
  }, 0);

  const totalDuration = (manualData.sections || []).reduce((acc, sec) => {
    return acc + (Number(sec.timeLimit) || 0);
  }, 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (target.tagName === 'BUTTON') return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const focusableElements = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';
      const elements = Array.from(e.currentTarget.querySelectorAll(focusableElements)) as HTMLElement[];
      const index = elements.indexOf(target);
      
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const content = (
    <div 
      onKeyDown={handleKeyDown}
      className={`flex flex-col border border-border overflow-hidden duration-500 ${
      isEditorExpanded ? 'fixed inset-0 z-[100] bg-background rounded-none' : 'h-[750px] bg-background rounded-2xl animate-in fade-in slide-in-from-bottom-4'
    }`}>
      
      {/* Top Header & Horizontal Tabs for Stages */}
      <div className="bg-card border-b border-border pt-4 px-4 flex flex-col">
        <div className="mb-4 px-2 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Kuis Builder (Mode LMS)
            </h3>
            <p className="text-sm text-muted-foreground">Rancang daftar soal pilihan ganda dengan cepat dan efisien.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center justify-center sm:justify-start gap-6 bg-foreground/5 border border-foreground/10 px-4 py-2 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Poin</span>
                <span className="text-emerald-400 font-bold text-sm">{totalPoints} Poin</span>
              </div>
              <div className="w-px h-8 bg-foreground/10"></div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Durasi</span>
                <span className="text-cyan-400 font-bold text-sm">{totalDuration > 0 ? `${totalDuration} Menit` : 'Tak Terbatas'}</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditorExpanded(!isEditorExpanded)}
              className="flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-4 py-3 sm:py-2 rounded-lg transition-colors border border-cyan-500/20 w-full sm:w-auto h-full"
            >
              {isEditorExpanded ? 'Kecilkan Layar' : 'Perluas Layar Penuh'}
            </button>
          </div>
        </div>
        
        <div className="flex overflow-x-auto custom-scrollbar gap-2">
          {(manualData.sections || []).map((section, secIdx) => (
            <button 
              key={secIdx}
              onClick={() => { setSelectedSectionIdx(secIdx); setExpandedCompIdx(null); }}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${
                selectedSectionIdx === secIdx 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                  : 'text-muted-foreground hover:bg-foreground/5 border-transparent'
              }`}
            >
              {section.title || `Bagian ${secIdx + 1}`}
            </button>
          ))}
          <button 
            onClick={addSection} 
            className="px-4 py-3 text-sm font-bold text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Bagian
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedSectionIdx !== null && manualData.sections?.[selectedSectionIdx] && (
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-background relative pb-32">
          
          {/* Section Settings */}
          <div className="bg-card p-6 border-b border-border flex flex-wrap items-start gap-6 shadow-sm sticky top-0 z-20">
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">Judul Bagian</label>
              <input 
                value={manualData.sections[selectedSectionIdx].title}
                onChange={(e) => updateSectionTitle(selectedSectionIdx, e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Contoh: Kuis Pemrograman React"
              />
            </div>
            <div className="flex-1 min-w-[250px]">
              <DurationPicker
                label="Waktu Pengerjaan (Per Tahap)"
                value={manualData.sections?.[selectedSectionIdx]?.timeLimit || null}
                onChange={(val) => updateSectionTimeLimit(selectedSectionIdx, val)}
                placeholder="Tak Terbatas"
              />
            </div>
            <div className="pt-7">
              <button 
                onClick={() => removeSection(selectedSectionIdx)} 
                className="p-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> Hapus Bagian
              </button>
            </div>
          </div>

          {/* List of Questions (LMS Style) */}
          <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-4">
            {(manualData.sections[selectedSectionIdx].components || []).length === 0 ? (
               <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-card">
                 <Settings className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p className="text-lg font-medium text-foreground mb-2">Belum ada pertanyaan</p>
                 <p className="text-sm">Klik tombol "Tambah Pertanyaan" di bawah untuk mulai membuat kuis.</p>
               </div>
            ) : (
              (manualData.sections[selectedSectionIdx].components || []).map((comp: any, compIdx: number) => {
                const isExpanded = expandedCompIdx === compIdx;
                
                return (
                  <motion.div 
                    layout
                    key={compIdx}
                    className={`bg-card border rounded-2xl overflow-hidden transition-colors ${
                      isExpanded ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'border-border hover:border-foreground/20 shadow-sm'
                    }`}
                  >
                    {/* Card Header (Always visible) */}
                    <div 
                      className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer"
                      onClick={() => setExpandedCompIdx(isExpanded ? null : compIdx)}
                    >
                      <div className="mt-1 opacity-50 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-500/20">
                            {comp.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{comp.points} Poin</span>
                        </div>
                        <h4 className={`text-base font-medium truncate transition-colors ${comp.question ? 'text-white' : 'text-muted-foreground italic'}`}>
                          {comp.question || 'Pertanyaan kosong...'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeComponent(selectedSectionIdx, compIdx); }}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-2 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Card Body (Editor) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border bg-background"
                        >
                          <div className="p-5 sm:p-6 space-y-6">
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">Pertanyaan</label>
                                <textarea 
                                  value={comp.question}
                                  onChange={(e) => updateComponent(selectedSectionIdx, compIdx, 'question', e.target.value)}
                                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                                  rows={3}
                                  placeholder="Tuliskan pertanyaan di sini..."
                                />
                              </div>
                              <div className="w-full sm:w-24 flex-shrink-0">
                                <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">Poin</label>
                                <input 
                                  type="number"
                                  value={comp.points}
                                  onChange={(e) => updateComponent(selectedSectionIdx, compIdx, 'points', parseInt(e.target.value) || 0)}
                                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors sm:text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>

                            <div className="pt-2">
                              {(() => {
                                const TypeComponent = QuestionTypeRegistry[comp.type]?.Builder;
                                if (!TypeComponent) return <p className="text-red-400 text-sm">Tipe komponen {comp.type} belum didukung.</p>;
                                return (
                                  <TypeComponent 
                                    comp={comp} 
                                    onChange={(field: string, value: any) => updateComponent(selectedSectionIdx, compIdx, field, value)} 
                                  />
                                );
                              })()}
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}

            {/* Sticky Add Button at the bottom */}
            <div className="pt-6 pb-4">
              <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider text-center">Tambah Pertanyaan Baru</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button onClick={() => addComponent(selectedSectionIdx, 'MULTIPLE_CHOICE')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">Pilihan Ganda</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'ESSAY')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">Essay</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'LIVE_CODING')} className="text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-3 rounded-xl transition-colors border border-emerald-500/20 flex flex-col items-center justify-center gap-2">Live Coding</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'FILE_UPLOAD')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">File Upload</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'URL_LINK')} className="text-xs font-bold text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-3 rounded-xl transition-colors border border-cyan-500/20 flex flex-col items-center justify-center gap-2">Tautan URL</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'VIDEO_RECORDING')} className="text-xs font-bold text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 px-3 py-3 rounded-xl transition-colors border border-purple-500/20 flex flex-col items-center justify-center gap-2">Video / Audio</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isEditorExpanded && mounted) {
    return createPortal(content, document.body);
  }

  return content;
}


