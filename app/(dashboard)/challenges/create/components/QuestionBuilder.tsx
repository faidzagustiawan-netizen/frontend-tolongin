import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Trash2, Plus, GripVertical, Settings, ChevronDown, ChevronUp, ChevronRight, CheckCircle2, Clock, Layers, BookmarkPlus, Wand2, Loader2 } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import {
  QuestionBankItem,
  bankItemToComponent,
  questionBankService,
} from '@/services/questionBank.service';
import { CATEGORY_SHORT_LABELS } from './options';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DurationPicker } from '@/components/common/DurationPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionTypeRegistry } from '@/components/question-types';
import BankPicker from './BankPicker';
import StageGateSettings from './StageGateSettings';
import { Section } from '@/types';

interface QuestionBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

export default function QuestionBuilder({ manualData, setManualData }: QuestionBuilderProps) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(0);
  const [expandedCompIdx, setExpandedCompIdx] = useState<number | null>(null);
  const [isEditorExpanded, setIsEditorExpanded] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [savingCompIdx, setSavingCompIdx] = useState<number | null>(null);
  // Indeks yang sedang diseret. Disimpan di state, bukan hanya di dataTransfer,
  // supaya kartu tujuan bisa memberi penanda sebelum dilepas.
  const [draggingCompIdx, setDraggingCompIdx] = useState<number | null>(null);
  const [dragOverCompIdx, setDragOverCompIdx] = useState<number | null>(null);
  const [draggingSectionIdx, setDraggingSectionIdx] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const { user } = useUserStore();
  // Hanya perusahaan yang punya koleksi pribadi; talenta tidak punya profil
  // perusahaan untuk memilikinya, dan backend menolak permintaannya.
  const canSaveToCollection = user?.role === 'COMPANY';

  useEffect(() => {
    setMounted(true);

    // Tahap pertama dibuatkan bila belum ada.
    //
    // Yang dulu ada di sini juga MENIMPA stageType setiap tahap menjadi QUIZ
    // saat komponen dipasang. Akibatnya mode ASSIGNMENT tidak pernah bisa
    // dipilih — bahkan keadaan awal formulir yang sudah menyetelnya ke
    // ASSIGNMENT langsung ditimpa — dan `renderAssignmentMode` di PreviewTab
    // menjadi kode mati yang tidak akan pernah dieksekusi.
    if (!manualData.sections || manualData.sections.length === 0) {
      setManualData((prev) => ({
        ...prev,
        sections: [
          {
            title: 'Bagian 1',
            order: 0,
            components: [],
            timeLimit: null,
            stageType: 'QUIZ',
          },
        ],
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

  const updateSectionStageType = (secIdx: number, stageType: 'QUIZ' | 'ASSIGNMENT') => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx] = { ...newSections[secIdx], stageType };
    setManualData({ ...manualData, sections: newSections });
  };

  /**
   * Menerapkan perubahan jadwal atau syarat masuk satu tahap.
   *
   * Satu fungsi untuk seluruh kolomnya, bukan satu per kolom: jumlahnya sepuluh,
   * dan semuanya diperlakukan sama — disalin ke tahap yang sedang dipilih.
   */
  const updateSectionGate = (secIdx: number, patch: Partial<Section>) => {
    const newSections = [...(manualData.sections || [])];
    newSections[secIdx] = { ...newSections[secIdx], ...patch };
    setManualData({ ...manualData, sections: newSections });
  };

  /**
   * Memindahkan soal ke posisi lain di dalam tahap yang sama.
   *
   * Sebelumnya kartu soal menampilkan pegangan geser lengkap dengan kursor
   * `grab`, tetapi tidak ada satu pun penangan tarik di berkas ini — urutan
   * soal sama sekali tidak bisa diubah selain dengan menghapus dan menulis
   * ulang. `order` ikut ditulis ulang karena backend memakai nilai itu, bukan
   * urutan larik.
   */
  const moveComponent = (secIdx: number, from: number, to: number) => {
    if (from === to) return;

    const newSections = [...(manualData.sections || [])];
    const components = [...(newSections[secIdx].components || [])];
    if (to < 0 || to >= components.length) return;

    const [moved] = components.splice(from, 1);
    components.splice(to, 0, moved);

    newSections[secIdx] = {
      ...newSections[secIdx],
      components: components.map((comp, idx) => ({ ...comp, order: idx })),
    };

    setManualData({ ...manualData, sections: newSections });
    setExpandedCompIdx(null);
  };

  const moveSection = (from: number, to: number) => {
    const sections = [...(manualData.sections || [])];
    if (from === to || to < 0 || to >= sections.length) return;

    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);

    setManualData({
      ...manualData,
      sections: sections.map((section, idx) => ({ ...section, order: idx })),
    });
    setSelectedSectionIdx(to);
    setExpandedCompIdx(null);
  };

  const addComponent = (secIdx: number, type: string) => {
    const newSections = [...(manualData.sections || [])];
    const sec = newSections[secIdx];
    const newComp = {
      type,
      question: '',
      description: '',
      // Soal psikotes tidak menyumbang poin: jawabannya diringkas jadi profil
      // dimensi, bukan dinilai benar-salah.
      points: type === 'PSYCHOMETRIC' ? 0 : 10,
      options: type === 'MULTIPLE_CHOICE' ? [{ id: Date.now().toString(), text: '', isCorrect: true }] : undefined,
      metadata:
        type === 'LIVE_CODING'
          ? { language: 'javascript' }
          : type === 'PSYCHOMETRIC'
            ? { dimension: '', scaleMin: 1, scaleMax: 5, reverse: false }
            : undefined,
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

  /**
   * Menambahkan soal terpilih dari bank ke tahap yang sedang dibuka.
   *
   * Isinya disalin, bukan ditautkan: menyunting soal di bank tidak boleh
   * mengubah ujian yang sedang dikerjakan kandidat. `sourceItemId` yang ikut
   * terbawa hanya jejak asal.
   */
  const addFromBank = (items: QuestionBankItem[]) => {
    if (selectedSectionIdx === null || items.length === 0) return;

    const newSections = [...(manualData.sections || [])];
    const section = newSections[selectedSectionIdx];
    const existing = section.components || [];

    section.components = [
      ...existing,
      ...items.map((item, idx) => bankItemToComponent(item, existing.length + idx)),
    ];

    setManualData({ ...manualData, sections: newSections });
    setExpandedCompIdx(null);
    toast.success(
      `${items.length} soal ditambahkan ke ${section.title || 'tahap ini'}.`,
    );
  };

  /**
   * Menyusun kerangka tahapan dari bank, memakai kategori dan level studi
   * kasus yang sedang dibuat.
   *
   * Bank sudah tahu apa yang relevan, tetapi sebelumnya pengguna tetap harus
   * menyaring lalu mencentang satu per satu — sepuluh klik untuk mencapai
   * susunan yang paling lumrah. Yang dihasilkan di sini hanyalah titik awal:
   * seluruh soalnya tetap bisa dihapus, diurutkan ulang, dan disunting.
   */
  const composeFromBank = async () => {
    setIsComposing(true);
    try {
      const [technical, general] = await Promise.all([
        // Soal bidang: dikunci ke kategori studi kasus.
        questionBankService.getAll({
          category: manualData.category,
          difficulty: manualData.difficulty,
          limit: 24,
        }),
        // Soal lintas bidang punya `category` null, jadi tidak bisa diminta
        // lewat penyaring kategori — diambil terpisah lalu disaring di sini.
        questionBankService.getAll({ limit: 40 }),
      ]);

      const crossField = general.data.filter((item) => item.companyId === null && !item.category);
      const fieldOnly = technical.data.filter((item) => !!item.category);

      const stages: { title: string; items: QuestionBankItem[] }[] = [
        {
          title: `Uji Teknis ${CATEGORY_SHORT_LABELS[manualData.category] ?? ''}`.trim(),
          items: fieldOnly.slice(0, 5),
        },
        {
          title: 'Soft Skill & Situasional',
          items: crossField
            .filter((item) => item.type === 'MULTIPLE_CHOICE' || item.type === 'ESSAY')
            .slice(0, 4),
        },
        {
          title: 'Wawancara Terekam',
          items: crossField.filter((item) => item.type === 'VIDEO_UPLOAD').slice(0, 2),
        },
      ].filter((stage) => stage.items.length > 0);

      if (stages.length === 0) {
        toast.error('Bank soal belum punya bahan yang cocok untuk kategori ini.');
        return;
      }

      const existing = manualData.sections || [];
      // Tahap kosong bawaan digantikan, bukan disisakan menggantung di atas.
      const keep = existing.filter((section) => (section.components?.length || 0) > 0);

      const composed = stages.map((stage, idx) => ({
        title: stage.title,
        order: keep.length + idx,
        timeLimit: null,
        stageType: (stage.title === 'Wawancara Terekam' ? 'ASSIGNMENT' : 'QUIZ') as
          | 'QUIZ'
          | 'ASSIGNMENT',
        components: stage.items.map((item, itemIdx) => bankItemToComponent(item, itemIdx)),
      }));

      setManualData({ ...manualData, sections: [...keep, ...composed] as any });
      setSelectedSectionIdx(keep.length);
      setExpandedCompIdx(null);

      const totalAdded = composed.reduce((acc, stage) => acc + stage.components.length, 0);
      toast.success(
        `${composed.length} tahap tersusun dengan ${totalAdded} soal. Sesuaikan sesuai kebutuhan Anda.`,
      );
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyusun tahapan dari bank soal.');
    } finally {
      setIsComposing(false);
    }
  };

  /** Menyimpan soal yang sedang disusun ke koleksi pribadi perusahaan. */
  const saveToCollection = async (secIdx: number, compIdx: number) => {
    const comp: any = manualData.sections?.[secIdx]?.components?.[compIdx];
    if (!comp) return;

    if (!comp.question?.trim()) {
      toast.error('Isi pertanyaannya lebih dulu sebelum disimpan ke koleksi.');
      return;
    }

    setSavingCompIdx(compIdx);
    try {
      await questionBankService.save({
        type: comp.type,
        question: comp.question,
        description: comp.description,
        options: comp.options,
        metadata: comp.metadata,
        defaultPoints: Number(comp.points) || 10,
        category: manualData.category,
        difficulty: manualData.difficulty,
      });
      toast.success('Soal tersimpan ke koleksi Anda.');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan soal ke koleksi.');
    } finally {
      setSavingCompIdx(null);
    }
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
              draggable
              onDragStart={() => setDraggingSectionIdx(secIdx)}
              onDragEnd={() => setDraggingSectionIdx(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingSectionIdx !== null) moveSection(draggingSectionIdx, secIdx);
                setDraggingSectionIdx(null);
              }}
              onClick={() => { setSelectedSectionIdx(secIdx); setExpandedCompIdx(null); }}
              title="Seret untuk mengubah urutan tahap"
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-colors whitespace-nowrap border-b-2 cursor-grab active:cursor-grabbing ${
                draggingSectionIdx === secIdx ? 'opacity-40' : ''
              } ${
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
            {/* Mode pengerjaan tahap. Sebelumnya dipaksa QUIZ oleh efek saat
                komponen dipasang, sehingga ASSIGNMENT tidak pernah bisa dipilih
                meski skema, DTO, dan tampilan pengerjaannya sudah mendukung. */}
            <div className="flex-1 min-w-[250px]">
              <label
                htmlFor="section-stage-type"
                className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider"
              >
                Mode Pengerjaan
              </label>
              <select
                id="section-stage-type"
                value={manualData.sections[selectedSectionIdx].stageType || 'QUIZ'}
                onChange={(e) =>
                  updateSectionStageType(
                    selectedSectionIdx,
                    e.target.value as 'QUIZ' | 'ASSIGNMENT',
                  )
                }
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="QUIZ">Kuis — satu soal per layar, berurutan</option>
                <option value="ASSIGNMENT">Tugas — semua soal tampil sekaligus</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {manualData.sections[selectedSectionIdx].stageType === 'ASSIGNMENT'
                  ? 'Cocok untuk pengerjaan bebas: kandidat bisa melompat antar soal.'
                  : 'Cocok untuk ujian: kandidat maju satu per satu.'}
              </p>
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

          {/* Jadwal & syarat masuk tahap ini. Diletakkan sebelum daftar soal
              karena menentukan siapa yang akan melihat soal-soal di bawahnya. */}
          <StageGateSettings
            sections={(manualData.sections || []) as Section[]}
            index={selectedSectionIdx}
            onChange={(patch) => updateSectionGate(selectedSectionIdx, patch)}
          />

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
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingCompIdx !== null) setDragOverCompIdx(compIdx);
                    }}
                    onDragLeave={() => setDragOverCompIdx((prev) => (prev === compIdx ? null : prev))}
                    onDrop={() => {
                      if (draggingCompIdx !== null) {
                        moveComponent(selectedSectionIdx, draggingCompIdx, compIdx);
                      }
                      setDraggingCompIdx(null);
                      setDragOverCompIdx(null);
                    }}
                    className={`bg-card border rounded-2xl overflow-hidden transition-colors ${
                      draggingCompIdx === compIdx ? 'opacity-40' : ''
                    } ${
                      dragOverCompIdx === compIdx && draggingCompIdx !== compIdx
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                        : isExpanded
                          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                          : 'border-border hover:border-foreground/20 shadow-sm'
                    }`}
                  >
                    {/* Card Header (Always visible) */}
                    <div
                      className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer"
                      onClick={() => setExpandedCompIdx(isExpanded ? null : compIdx)}
                    >
                      {/* Pegangan geser yang benar-benar bekerja. Sebelumnya ikon
                          ini hanya hiasan: kursornya menjanjikan tarik-lepas,
                          tetapi tidak ada penangan apa pun di belakangnya.
                          Tombol panah disediakan berdampingan karena tarik-lepas
                          tidak bisa dioperasikan dengan papan ketik. */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggingCompIdx(compIdx);
                        }}
                        onDragEnd={() => {
                          setDraggingCompIdx(null);
                          setDragOverCompIdx(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Seret untuk mengubah urutan soal"
                        className="mt-1 flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveComponent(selectedSectionIdx, compIdx, compIdx - 1);
                          }}
                          disabled={compIdx === 0}
                          aria-label="Pindahkan soal ke atas"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <GripVertical className="w-5 h-5 text-muted-foreground opacity-50" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveComponent(selectedSectionIdx, compIdx, compIdx + 1);
                          }}
                          disabled={
                            compIdx ===
                            (manualData.sections?.[selectedSectionIdx]?.components?.length || 1) - 1
                          }
                          aria-label="Pindahkan soal ke bawah"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-500/20">
                            {comp.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{comp.points} Poin</span>
                          {comp.sourceItemId && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                              <Layers className="w-3 h-3" aria-hidden="true" /> Dari bank
                            </span>
                          )}
                        </div>
                        <h4 className={`text-base font-medium truncate transition-colors ${comp.question ? 'text-white' : 'text-muted-foreground italic'}`}>
                          {comp.question || 'Pertanyaan kosong...'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {canSaveToCollection && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void saveToCollection(selectedSectionIdx, compIdx);
                            }}
                            disabled={savingCompIdx === compIdx}
                            title="Simpan ke koleksi soal saya"
                            aria-label="Simpan ke koleksi soal saya"
                            className="p-2 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
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

            {/* Bank soal ditawarkan sebelum daftar tipe soal: menyusun dari
                bahan yang sudah ada hampir selalu lebih cepat daripada menulis
                dari nol, dan soal lintas bidang ikut terbawa di sana. */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void composeFromBank()}
                disabled={isComposing}
                className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-500 font-bold text-sm hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {isComposing ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="w-5 h-5" aria-hidden="true" />
                )}
                Susunkan tahapan untuk saya
              </button>
              <button
                type="button"
                onClick={() => setIsBankOpen(true)}
                className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
              >
                <Layers className="w-5 h-5" aria-hidden="true" />
                Pilih sendiri dari bank
              </button>
              <p className="text-[11px] text-muted-foreground text-center sm:col-span-2">
                Penyusunan otomatis membuat tiga tahap — teknis, soft skill, dan
                wawancara — dari bank soal. Semuanya tetap bisa Anda ubah.
              </p>
            </div>

            {/* Sticky Add Button at the bottom */}
            <div className="pt-6 pb-4">
              <p className="text-xs text-muted-foreground font-bold mb-3 uppercase tracking-wider text-center">Atau Tulis Pertanyaan Baru</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button onClick={() => addComponent(selectedSectionIdx, 'MULTIPLE_CHOICE')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">Pilihan Ganda</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'ESSAY')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">Essay</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'LIVE_CODING')} className="text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-3 rounded-xl transition-colors border border-emerald-500/20 flex flex-col items-center justify-center gap-2">Live Coding</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'FILE_UPLOAD')} className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center justify-center gap-2">File Upload</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'URL_SUBMISSION')} className="text-xs font-bold text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-3 rounded-xl transition-colors border border-cyan-500/20 flex flex-col items-center justify-center gap-2">Tautan URL</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'VIDEO_UPLOAD')} className="text-xs font-bold text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 px-3 py-3 rounded-xl transition-colors border border-purple-500/20 flex flex-col items-center justify-center gap-2">Video / Audio</button>
                <button onClick={() => addComponent(selectedSectionIdx, 'PSYCHOMETRIC')} className="text-xs font-bold text-fuchsia-400 bg-fuchsia-400/10 hover:bg-fuchsia-400/20 px-3 py-3 rounded-xl transition-colors border border-fuchsia-500/20 flex flex-col items-center justify-center gap-2">Psikotes (Skala)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BankPicker
        open={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        defaultCategory={manualData.category}
        defaultDifficulty={manualData.difficulty}
        targetSectionTitle={
          (selectedSectionIdx !== null
            ? manualData.sections?.[selectedSectionIdx]?.title
            : '') || 'tahap ini'
        }
        onAdd={addFromBank}
      />
    </div>
  );

  if (isEditorExpanded && mounted) {
    return createPortal(content, document.body);
  }

  return content;
}


