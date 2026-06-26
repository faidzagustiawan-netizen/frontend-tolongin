import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Plus, GripVertical, Settings } from 'lucide-react';
import { CreateChallengePayload } from '../../../../../services/challenges.service';
import { Button } from '../../../../../components/common/Button';
import { Input } from '../../../../../components/common/Input';

interface QuestionBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

export default function QuestionBuilder({ manualData, setManualData }: QuestionBuilderProps) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(0);
  const [selectedComponentIdx, setSelectedComponentIdx] = useState<number | null>(null);
  const [bulkInput, setBulkInput] = useState<string>('');
  const [showBulkAdd, setShowBulkAdd] = useState<boolean>(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        { title: `Tahap ${(prev.sections?.length || 0) + 1}`, order: prev.sections?.length || 0, components: [], timeLimit: null, stageType: 'ASSIGNMENT' }
      ]
    }));
    setSelectedSectionIdx((manualData.sections?.length || 0));
    setSelectedComponentIdx(null);
  };

  const removeSection = (secIdx: number) => {
    const newSections = [...(manualData.sections || [])];
    newSections.splice(secIdx, 1);
    setManualData({ ...manualData, sections: newSections });
    if (selectedSectionIdx === secIdx) {
      setSelectedSectionIdx(newSections.length > 0 ? 0 : null);
      setSelectedComponentIdx(null);
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

  const updateSectionStageType = (secIdx: number, stageType: string) => {
    const newSections = [...(manualData.sections || [])];
    // If changing to QUIZ, we should technically warn them if they have non-quiz components, 
    // but for now we just change it.
    newSections[secIdx] = { ...newSections[secIdx], stageType };
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
      options: type === 'MULTIPLE_CHOICE' ? [{ id: Math.random().toString(), text: '', isCorrect: true }] : undefined,
      metadata: type === 'LIVE_CODING' ? { language: 'javascript' } : undefined,
    };
    sec.components = [...(sec.components || []), newComp];
    setManualData({ ...manualData, sections: newSections });
    setSelectedSectionIdx(secIdx);
    setSelectedComponentIdx(sec.components.length - 1);
  };

  const removeComponent = (secIdx: number, compIdx: number) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx].components.splice(compIdx, 1);
    setManualData({ ...manualData, sections: newSections });
    if (selectedSectionIdx === secIdx && selectedComponentIdx === compIdx) {
      setSelectedComponentIdx(null);
    }
  };

  const updateComponent = (secIdx: number, compIdx: number, field: string, value: any) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx].components[compIdx] = { ...newSections[secIdx].components[compIdx], [field]: value };
    setManualData({ ...manualData, sections: newSections });
  };

  const handleBulkAdd = (secIdx: number, compIdx: number) => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split('\n').filter((line) => line.trim() !== '');
    const newSections = [...(manualData.sections || [])];
    const comp = newSections[secIdx].components[compIdx];
    
    const newOptions = lines.map((line) => ({
      id: Math.random().toString(),
      text: line.trim(),
      isCorrect: false,
    }));
    
    comp.options = [...(comp.options || []), ...newOptions];
    
    // If no correct option exists, set the first one
    if (!comp.options.find((o: any) => o.isCorrect) && comp.options.length > 0) {
        comp.options[0].isCorrect = true;
    }

    setManualData({ ...manualData, sections: newSections });
    setBulkInput('');
    setShowBulkAdd(false);
  };

  const activeComp = selectedSectionIdx !== null && selectedComponentIdx !== null 
    ? manualData.sections?.[selectedSectionIdx]?.components?.[selectedComponentIdx] 
    : null;

  const content = (
    <div className={`flex flex-col border border-dark-border overflow-hidden duration-500 ${
      isEditorExpanded ? 'fixed inset-0 z-[100] bg-black rounded-none' : 'h-[750px] bg-dark-bg/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4'
    }`}>
      
      {/* Top Header & Horizontal Tabs for Stages */}
      <div className="bg-dark-bg border-b border-dark-border pt-4 px-4 flex flex-col">
        <div className="mb-4 px-2 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Assessment Builder
            </h3>
            <p className="text-sm text-gray-400">Rancang struktur tes berdasarkan tahapan (progress) di sini.</p>
          </div>
          <button
            onClick={() => setIsEditorExpanded(!isEditorExpanded)}
            className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-4 py-2 rounded-lg transition-colors border border-cyan-500/20"
          >
            {isEditorExpanded ? 'Kecilkan Layar' : 'Perluas Layar Penuh'}
          </button>
        </div>
        
        <div className="flex overflow-x-auto custom-scrollbar gap-2">
          {(manualData.sections || []).map((section, secIdx) => (
            <button 
              key={secIdx}
              onClick={() => { setSelectedSectionIdx(secIdx); setSelectedComponentIdx(null); }}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${
                selectedSectionIdx === secIdx 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                  : 'text-gray-400 hover:bg-white/5 border-transparent'
              }`}
            >
              {section.title || `Tahap ${secIdx + 1}`}
            </button>
          ))}
          <button 
            onClick={addSection} 
            className="px-4 py-3 text-sm font-bold text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Tahap
          </button>
        </div>
      </div>

      {/* Content for Active Stage */}
      {selectedSectionIdx !== null && manualData.sections?.[selectedSectionIdx] && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Stage Settings Header (always visible for the active stage) */}
          <div className="bg-[#111] p-6 border-b border-dark-border flex flex-wrap items-start gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Judul Tahap</label>
              <input 
                value={manualData.sections[selectedSectionIdx].title}
                onChange={(e) => updateSectionTitle(selectedSectionIdx, e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Contoh: Tahap 1 - Desain UI"
              />
            </div>
            <div className="w-48">
              <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Tipe Evaluasi</label>
              <select
                value={manualData.sections[selectedSectionIdx].stageType || 'ASSIGNMENT'}
                onChange={(e) => updateSectionStageType(selectedSectionIdx, e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ASSIGNMENT">Penugasan (Campur)</option>
                <option value="QUIZ">Kuis (Pilihan Ganda)</option>
              </select>
            </div>
            <div className="w-48">
              <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Waktu (Menit)</label>
              <input 
                type="number"
                value={manualData.sections[selectedSectionIdx].timeLimit || ''}
                onChange={(e) => updateSectionTimeLimit(selectedSectionIdx, e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Global"
              />
            </div>
            <div className="pt-7">
              <button 
                onClick={() => removeSection(selectedSectionIdx)} 
                className="p-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> Hapus Tahap
              </button>
            </div>
          </div>

          {/* Split Screen for Questions in this Stage */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Panel: List of Questions */}
            <div className="w-1/3 flex flex-col gap-4 border-r border-dark-border p-6 overflow-y-auto custom-scrollbar bg-dark-bg/20 transition-all duration-300">
                 <h4 className="font-bold text-white mb-2">Tugas / Soal</h4>
                 <div className="space-y-2">
                   {(manualData.sections[selectedSectionIdx].components || []).map((comp: any, compIdx: number) => (
                     <div 
                       key={compIdx} 
                       onClick={() => setSelectedComponentIdx(compIdx)}
                       className={`cursor-pointer p-3 rounded-xl border text-sm flex items-center gap-3 transition-all shadow-sm ${
                         selectedComponentIdx === compIdx
                           ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                           : 'bg-dark-card border-dark-border text-gray-300 hover:bg-white/5 hover:border-white/10'
                       }`}
                     >
                       <GripVertical className="w-4 h-4 text-gray-600" />
                       <div className="flex flex-col overflow-hidden">
                         <span className="truncate font-medium">{compIdx + 1}. {comp.question || 'Soal Kosong'}</span>
                         <span className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{comp.type.replace('_', ' ')}</span>
                       </div>
                     </div>
                   ))}
                   
                   {(!manualData.sections[selectedSectionIdx].components || manualData.sections[selectedSectionIdx].components.length === 0) && (
                     <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-dark-border rounded-xl">
                       Belum ada soal di tahap ini.
                     </div>
                   )}
                 </div>

                 <div className="mt-4 pt-4 border-t border-dark-border">
                   <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">Tambah Tugas Baru</p>
                   {manualData.sections[selectedSectionIdx].stageType === 'QUIZ' ? (
                     <button onClick={() => addComponent(selectedSectionIdx, 'MULTIPLE_CHOICE')} className="w-full text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/5">+ Tambah Soal Pilihan Ganda</button>
                   ) : (
                     <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => addComponent(selectedSectionIdx, 'FILE_UPLOAD')} className="text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/5">File Upload</button>
                       <button onClick={() => addComponent(selectedSectionIdx, 'MULTIPLE_CHOICE')} className="text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/5">Pilihan Ganda</button>
                       <button onClick={() => addComponent(selectedSectionIdx, 'ESSAY')} className="text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors border border-white/5">Essay</button>
                       <button onClick={() => addComponent(selectedSectionIdx, 'LIVE_CODING')} className="text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-2 rounded-lg transition-colors border border-emerald-500/20">Live Coding</button>
                       <button onClick={() => addComponent(selectedSectionIdx, 'URL_LINK')} className="text-xs font-bold text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-2 rounded-lg transition-colors border border-cyan-500/20">Tautan URL</button>
                       <button onClick={() => addComponent(selectedSectionIdx, 'VIDEO_RECORDING')} className="text-xs font-bold text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 px-3 py-2 rounded-lg transition-colors border border-purple-500/20">Video / Audio</button>
                     </div>
                   )}
                 </div>
              </div>

            {/* Right Panel: Detail Editor */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-dark-bg/10">
              {!activeComp ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Settings className="w-16 h-16 mb-6 opacity-10" />
                  <p className="text-lg font-medium">Pilih soal di panel kiri untuk mengedit</p>
                  <p className="text-sm mt-2 opacity-60">Atau tambahkan tugas baru</p>
                </div>
              ) : (
                <div className={`${isEditorExpanded ? 'max-w-5xl mx-auto' : 'max-w-3xl'} space-y-6 transition-all duration-300`}>
                   <div className="flex items-center justify-between border-b border-dark-border pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-wider">
                          {activeComp.type.replace('_', ' ')}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeComponent(selectedSectionIdx!, selectedComponentIdx!)}
                        className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus Soal
                      </button>
                   </div>

                   <Input 
                      label="Teks / Instruksi Tugas" 
                      value={activeComp.question} 
                      onChange={(e) => updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'question', e.target.value)} 
                      placeholder="Masukkan instruksi atau pertanyaan..."
                   />

                   <div className="w-1/3">
                     <Input 
                       label="Poin Nilai"
                       type="number"
                       value={activeComp.points}
                       onChange={(e) => updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'points', parseInt(e.target.value) || 0)}
                     />
                   </div>

                   {/* Live Coding Options */}
                   {activeComp.type === 'LIVE_CODING' && (
                     <div>
                       <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Bahasa Pemrograman Default</label>
                       <select 
                         value={activeComp.metadata?.language || 'javascript'} 
                         onChange={(e) => updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'metadata', { ...activeComp.metadata, language: e.target.value })}
                         className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                       >
                         <option value="javascript">JavaScript</option>
                         <option value="typescript">TypeScript</option>
                         <option value="python">Python</option>
                         <option value="go">Go</option>
                         <option value="java">Java</option>
                       </select>
                     </div>
                   )}

                   {/* Multiple Choice Options Builder */}
                   {activeComp.type === 'MULTIPLE_CHOICE' && activeComp.options && (
                     <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-6 mt-6">
                        <div className="flex items-center justify-between border-b border-dark-border pb-4">
                          <label className="text-base font-bold text-white">Pilihan Jawaban</label>
                          <button 
                            onClick={() => setShowBulkAdd(!showBulkAdd)}
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg transition-colors border border-cyan-500/20"
                          >
                            {showBulkAdd ? 'Tutup Bulk Add' : 'Bulk Add Options'}
                          </button>
                        </div>

                        {showBulkAdd && (
                          <div className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-xl space-y-4">
                            <p className="text-sm text-cyan-200">
                              Paste beberapa baris teks di bawah. Setiap baris baru akan diubah menjadi 1 opsi jawaban otomatis.
                            </p>
                            <textarea
                              value={bulkInput}
                              onChange={(e) => setBulkInput(e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              rows={5}
                              placeholder="Opsi A\nOpsi B\nOpsi C\nOpsi D"
                            />
                            <Button onClick={() => handleBulkAdd(selectedSectionIdx!, selectedComponentIdx!)} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm">
                              Generate Opsi
                            </Button>
                          </div>
                        )}

                        <div className="space-y-3">
                          {activeComp.options.map((opt: any, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-4 bg-dark-bg/50 p-2 pl-4 rounded-xl border border-dark-border focus-within:border-emerald-500/50 transition-colors">
                              <input 
                                type="radio" 
                                name={`correct-${selectedSectionIdx}-${selectedComponentIdx}`} 
                                checked={opt.isCorrect} 
                                onChange={() => {
                                  const newOpts = [...activeComp.options];
                                  newOpts.forEach((o: any) => o.isCorrect = false);
                                  newOpts[optIdx].isCorrect = true;
                                  updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'options', newOpts);
                                }}
                                className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 bg-dark-bg cursor-pointer"
                              />
                              <input
                                value={opt.text}
                                onChange={(e) => {
                                  const newOpts = [...activeComp.options];
                                  newOpts[optIdx].text = e.target.value;
                                  updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'options', newOpts);
                                }}
                                className="flex-1 bg-transparent px-2 py-2 text-sm text-white focus:outline-none"
                                placeholder={`Teks opsi ${optIdx + 1}`}
                              />
                              <button 
                                onClick={() => {
                                  const newOpts = [...activeComp.options];
                                  newOpts.splice(optIdx, 1);
                                  updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'options', newOpts);
                                }}
                                className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => {
                            const newOpts = [...activeComp.options, { id: Math.random().toString(), text: '', isCorrect: false }];
                            updateComponent(selectedSectionIdx!, selectedComponentIdx!, 'options', newOpts);
                          }}
                          className="w-full py-3 mt-4 border-2 border-dashed border-dark-border text-gray-400 hover:text-white hover:border-white/20 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                        >
                          <Plus className="w-4 h-4" /> Tambah Opsi Manual
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State when no section exists */}
      {(!manualData.sections || manualData.sections.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Settings className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">Belum ada tahap yang dibuat.</p>
          <button onClick={addSection} className="mt-4 px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold hover:bg-emerald-500/20 transition-colors">
            Mulai Buat Tahap Pertama
          </button>
        </div>
      )}
    </div>
  );

  if (isEditorExpanded && mounted) {
    return createPortal(content, document.body);
  }

  return content;
}
