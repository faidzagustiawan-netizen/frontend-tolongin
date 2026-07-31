import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  Trash2,
  Plus,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  BookmarkPlus,
  Wand2,
  Loader2,
  ClipboardPaste,
  PenLine,
} from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import {
  QuestionBankItem,
  bankItemToComponent,
  questionBankService,
} from '@/services/questionBank.service';
import { CATEGORY_SHORT_LABELS } from './options';
import { useUserStore } from '@/store/userStore';
import { DurationPicker } from '@/components/common/DurationPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionTypeRegistry } from '@/components/question-types';
import BankPicker from './BankPicker';
import StageGateSettings, { describeStageGate } from './StageGateSettings';
import { evaluateSection } from './stepValidation';
import { parseBulkQuestions } from './bulkQuestions';
import { Section } from '@/types';

interface QuestionBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
  /**
   * Memberi tahu induk bahwa satu tahap sedang dibuka fokusnya.
   *
   * Fokus soal punya jalan keluarnya sendiri ("Semua tahap"), jadi tombol
   * Sebelumnya/Lanjutkan milik stepper harus menyingkir selama itu — dua jalan
   * keluar yang bersaing di satu layar membuat orang menebak-nebak mana yang
   * membawanya ke mana.
   */
  onFocusChange?: (focused: boolean) => void;
}

/** Tipe soal yang nilainya keluar tanpa menunggu AI maupun manusia. */
const AUTO_SCORED_TYPES = new Set(['MULTIPLE_CHOICE', 'PSYCHOMETRIC']);

/**
 * Tipe soal dikelompokkan menurut siapa yang menilainya.
 *
 * Tujuh tombol datar memperlakukan semua tipe sebagai setara, padahal beda yang
 * paling menentukan bagi perusahaan adalah: hasilnya keluar seketika, atau
 * menunggu penilaian. Perusahaan yang memilih dua belas esai baru menyadari
 * akibatnya jauh di belakang — atau tidak sama sekali, sampai kandidat
 * menunggu berhari-hari.
 */
const TYPE_GROUPS: {
  title: string;
  hint: string;
  tone: string;
  types: { type: string; label: string }[];
}[] = [
  {
    title: 'Dinilai otomatis',
    hint: 'Hasilnya keluar seketika begitu kandidat selesai.',
    tone: 'text-emerald-400',
    types: [
      { type: 'MULTIPLE_CHOICE', label: 'Pilihan Ganda' },
      { type: 'PSYCHOMETRIC', label: 'Psikotes (Skala)' },
    ],
  },
  {
    title: 'Butuh penilaian AI atau manusia',
    hint: 'Nilainya tidak keluar seketika; tahap berikutnya ikut menunggu.',
    tone: 'text-amber-500',
    types: [
      { type: 'ESSAY', label: 'Essay' },
      { type: 'LIVE_CODING', label: 'Live Coding' },
      { type: 'FILE_UPLOAD', label: 'File Upload' },
      { type: 'URL_SUBMISSION', label: 'Tautan URL' },
      { type: 'VIDEO_UPLOAD', label: 'Video / Audio' },
    ],
  },
];

const BULK_PLACEHOLDER = `Jelaskan perbedaan REST dan GraphQL.
HTTP status untuk "tidak ditemukan"? | 200 | *404 | 500
Sebutkan tiga prinsip SOLID yang Anda pakai sehari-hari.`;

/**
 * Penyusun tahapan dan soal, dua tingkat.
 *
 * Tingkat pertama adalah daftar tahap: bentuk seluruh prosesnya, terlihat
 * sekaligus. Tingkat kedua adalah satu tahap yang sedang digarap.
 *
 * Sebelumnya keduanya ditumpuk di satu layar — tab tahap yang menggulung ke
 * samping, pengaturan tahap, sebelas kolom syarat masuk, lalu daftar soal —
 * sehingga "berapa tahap dan bagaimana urutannya" dan "tulis soal ini"
 * diputuskan bersamaan padahal jenisnya berbeda.
 *
 * Tahap tunggal yang masih kosong langsung dibuka fokusnya. Daftar berisi satu
 * baris bukan layar, itu pintu tol — dan sebagian besar studi kasus memang
 * hanya punya satu tahap.
 */
export default function QuestionBuilder({
  manualData,
  setManualData,
  onFocusChange,
}: QuestionBuilderProps) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number | null>(null);
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
  const [bulkText, setBulkText] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const { user } = useUserStore();
  // Hanya perusahaan yang punya koleksi pribadi; talenta tidak punya profil
  // perusahaan untuk memilikinya, dan backend menolak permintaannya.
  const canSaveToCollection = user?.role === 'COMPANY';

  const sections = manualData.sections || [];

  useEffect(() => {
    setMounted(true);

    // Tahap pertama dibuatkan bila belum ada, dan fokusnya langsung dibuka:
    // pengguna yang baru sampai di sini datang untuk menulis soal, bukan untuk
    // menatap daftar berisi satu tahap kosong.
    if (sections.length === 0) {
      setManualData((prev) => ({
        ...prev,
        sections: [{ title: 'Bagian 1', order: 0, components: [], timeLimit: null }],
      }));
      setSelectedSectionIdx(0);
      return;
    }

    const onlyOneEmptyStage =
      sections.length === 1 && (sections[0].components?.length || 0) === 0;

    setSelectedSectionIdx(onlyOneEmptyStage ? 0 : null);
  }, []);

  const isFocused = selectedSectionIdx !== null && !!sections[selectedSectionIdx];

  useEffect(() => {
    onFocusChange?.(isFocused);

    // Dilepas saat komponennya turun dari layar. Tanpa ini, berpindah langkah
    // lewat stepper selagi satu tahap terbuka meninggalkan induknya mengira
    // fokus masih menyala — dan tombol Sebelumnya/Lanjutkan hilang di langkah
    // berikutnya tanpa sebab yang terlihat.
    return () => onFocusChange?.(false);
  }, [isFocused, onFocusChange]);

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

  const openStage = (secIdx: number) => {
    setSelectedSectionIdx(secIdx);
    setExpandedCompIdx(null);
    setIsBulkOpen(false);
    setBulkText('');
  };

  /** Kembali ke daftar tahap. Layar penuh ikut ditutup — di daftar tidak ada
   *  yang perlu diperbesar. */
  const backToList = () => {
    setSelectedSectionIdx(null);
    setExpandedCompIdx(null);
    setIsEditorExpanded(false);
    setIsBulkOpen(false);
  };

  const addSection = () => {
    const nextIdx = sections.length;
    setManualData((prev) => ({
      ...prev,
      sections: [
        ...(prev.sections || []),
        {
          title: `Bagian ${(prev.sections?.length || 0) + 1}`,
          order: prev.sections?.length || 0,
          components: [],
          timeLimit: null,
        },
      ],
    }));
    openStage(nextIdx);
  };

  const removeSection = (secIdx: number) => {
    const newSections = [...sections];
    newSections.splice(secIdx, 1);
    setManualData({ ...manualData, sections: newSections });

    // Tahap yang sedang dibuka baru saja lenyap; menahan indeksnya berarti
    // menunjuk tahap lain — atau tidak menunjuk apa pun.
    if (selectedSectionIdx !== null && selectedSectionIdx >= newSections.length) {
      backToList();
    } else if (selectedSectionIdx === secIdx) {
      backToList();
    }
  };

  const updateSectionTitle = (secIdx: number, title: string) => {
    const newSections = [...sections];
    newSections[secIdx] = { ...newSections[secIdx], title };
    setManualData({ ...manualData, sections: newSections });
  };

  const updateSectionTimeLimit = (secIdx: number, timeLimit: number | null) => {
    const newSections = [...sections];
    newSections[secIdx] = { ...newSections[secIdx], timeLimit };
    setManualData({ ...manualData, sections: newSections });
  };

  /**
   * Menerapkan perubahan jadwal atau syarat masuk satu tahap.
   *
   * Satu fungsi untuk seluruh kolomnya, bukan satu per kolom: jumlahnya sepuluh,
   * dan semuanya diperlakukan sama — disalin ke tahap yang sedang dipilih.
   */
  const updateSectionGate = (secIdx: number, patch: Partial<Section>) => {
    const newSections = [...sections];
    newSections[secIdx] = { ...newSections[secIdx], ...patch };
    setManualData({ ...manualData, sections: newSections });
  };

  /**
   * Memindahkan soal ke posisi lain di dalam tahap yang sama.
   *
   * `order` ikut ditulis ulang karena backend memakai nilai itu, bukan urutan
   * larik.
   */
  const moveComponent = (secIdx: number, from: number, to: number) => {
    if (from === to) return;

    const newSections = [...sections];
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
    const next = [...sections];
    if (from === to || to < 0 || to >= next.length) return;

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setManualData({
      ...manualData,
      sections: next.map((section, idx) => ({ ...section, order: idx })),
    });
  };

  const addComponent = (secIdx: number, type: string) => {
    const newSections = [...sections];
    const sec = newSections[secIdx];
    const newComp = {
      type,
      question: '',
      description: '',
      // Soal psikotes tidak menyumbang poin: jawabannya diringkas jadi profil
      // dimensi, bukan dinilai benar-salah.
      points: type === 'PSYCHOMETRIC' ? 0 : 10,
      options:
        type === 'MULTIPLE_CHOICE'
          ? [{ id: Date.now().toString(), text: '', isCorrect: true }]
          : undefined,
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
    const newSections = [...sections];
    newSections[secIdx].components.splice(compIdx, 1);
    setManualData({ ...manualData, sections: newSections });
    if (expandedCompIdx === compIdx) {
      setExpandedCompIdx(null);
    }
  };

  const updateComponent = (secIdx: number, compIdx: number, field: string, value: any) => {
    const newSections = [...sections];
    newSections[secIdx].components[compIdx] = {
      ...newSections[secIdx].components[compIdx],
      [field]: value,
    };
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

    const newSections = [...sections];
    const section = newSections[selectedSectionIdx];
    const existing = section.components || [];

    section.components = [
      ...existing,
      ...items.map((item, idx) => bankItemToComponent(item, existing.length + idx)),
    ];

    setManualData({ ...manualData, sections: newSections });
    setExpandedCompIdx(null);
    toast.success(`${items.length} soal ditambahkan ke ${section.title || 'tahap ini'}.`);
  };

  /**
   * Menambahkan soal hasil tempelan massal ke tahap yang sedang dibuka.
   */
  const addBulkQuestions = () => {
    if (selectedSectionIdx === null) return;

    const { questions, warnings, errors } = parseBulkQuestions(bulkText);

    if (errors.length > 0) {
      // Galat disebut satu per satu dengan nomor barisnya; "format salah" saja
      // memaksa pengguna memeriksa ulang seluruh tempelan.
      errors.slice(0, 3).forEach((message) => toast.error(message));
      if (errors.length > 3) {
        toast.error(`…dan ${errors.length - 3} baris lain bermasalah.`);
      }
      return;
    }

    if (questions.length === 0) {
      toast.error('Belum ada soal yang bisa dibaca dari tempelan itu.');
      return;
    }

    const newSections = [...sections];
    const section = newSections[selectedSectionIdx];
    const existing = section.components || [];

    section.components = [
      ...existing,
      ...questions.map((q, idx) => ({ ...q, order: existing.length + idx })),
    ] as any;

    setManualData({ ...manualData, sections: newSections });
    setBulkText('');
    setIsBulkOpen(false);
    setExpandedCompIdx(null);

    warnings.forEach((message) => toast(message, { icon: '⚠️' }));
    toast.success(`${questions.length} soal ditambahkan.`);
  };

  /**
   * Menyusun kerangka tahapan dari bank, memakai kategori dan level studi
   * kasus yang sedang dibuat.
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

      // Tahap kosong bawaan digantikan, bukan disisakan menggantung di atas.
      const keep = sections.filter((section) => (section.components?.length || 0) > 0);

      const composed = stages.map((stage, idx) => ({
        title: stage.title,
        order: keep.length + idx,
        timeLimit: null,
        components: stage.items.map((item, itemIdx) => bankItemToComponent(item, itemIdx)),
      }));

      setManualData({ ...manualData, sections: [...keep, ...composed] as any });
      setSelectedSectionIdx(null);
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
    const comp: any = sections[secIdx]?.components?.[compIdx];
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

  const totalPoints = sections.reduce(
    (acc, sec) =>
      acc +
      (sec.components || []).reduce(
        (cAcc: number, comp: any) => cAcc + (Number(comp.points) || 0),
        0,
      ),
    0,
  );

  const totalDuration = sections.reduce((acc, sec) => acc + (Number(sec.timeLimit) || 0), 0);

  const sectionStats = (section: Section) => {
    const components = section.components || [];
    return {
      count: components.length,
      points: components.reduce((acc, c: any) => acc + (Number(c.points) || 0), 0),
      needGrading: components.filter((c: any) => !AUTO_SCORED_TYPES.has(c.type)).length,
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (target.tagName === 'BUTTON') return;

      e.preventDefault();
      e.stopPropagation();

      const focusableElements =
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';
      const elements = Array.from(
        e.currentTarget.querySelectorAll(focusableElements),
      ) as HTMLElement[];
      const index = elements.indexOf(target);

      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const bulkPreview = isBulkOpen ? parseBulkQuestions(bulkText) : null;

  // ---------------------------------------------------------------- DAFTAR
  const renderStageList = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" aria-hidden="true" /> Tahapan Seleksi
          </h3>
          <p className="text-sm text-muted-foreground">
            Susun urutan prosesnya dulu. Klik satu tahap untuk menulis soalnya.
          </p>
        </div>
        <div className="flex items-center gap-6 bg-foreground/5 border border-foreground/10 px-4 py-2 rounded-xl flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Poin
            </span>
            <span className="text-emerald-400 font-bold text-sm">{totalPoints} Poin</span>
          </div>
          <div className="w-px h-8 bg-foreground/10" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Durasi
            </span>
            <span className="text-cyan-400 font-bold text-sm">
              {totalDuration > 0 ? `${totalDuration} Menit` : 'Tak Terbatas'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, secIdx) => {
          const stats = sectionStats(section);
          const status = evaluateSection(section);

          return (
            <div
              key={secIdx}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingSectionIdx !== null) moveSection(draggingSectionIdx, secIdx);
                setDraggingSectionIdx(null);
              }}
              className={`bg-card border rounded-2xl transition-colors ${
                draggingSectionIdx === secIdx ? 'opacity-40' : ''
              } ${
                status.code
                  ? 'border-danger/40'
                  : 'border-border hover:border-foreground/20'
              }`}
            >
              <div className="p-4 sm:p-5 flex items-start gap-4">
                {/* Pegangan seret terpisah dari badan kartu: kalau seluruh
                    kartu draggable, klik untuk masuk dan mulai-seret saling
                    berebut peristiwa yang sama. */}
                <div
                  draggable
                  onDragStart={() => setDraggingSectionIdx(secIdx)}
                  onDragEnd={() => setDraggingSectionIdx(null)}
                  title="Seret untuk mengubah urutan tahap"
                  className="mt-1 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing flex-shrink-0"
                >
                  <span className="w-7 h-7 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {secIdx + 1}
                  </span>
                  <GripVertical
                    className="w-4 h-4 text-muted-foreground opacity-50"
                    aria-hidden="true"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openStage(secIdx)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground truncate">
                      {section.title?.trim() || `Tahap ${secIdx + 1}`}
                    </h4>
                    {status.code ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-danger">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {status.label}
                      </span>
                    ) : status.emptyOfQuestions ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        Belum ada soal
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Siap
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {stats.count} soal · {stats.points} poin ·{' '}
                    {section.timeLimit ? `${section.timeLimit} menit` : 'tanpa batas waktu'}
                    {stats.needGrading > 0 && (
                      <span className="text-amber-500 font-semibold">
                        {' '}
                        · {stats.needGrading} butuh dinilai
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {describeStageGate(section as Section, sections as Section[], secIdx)}
                  </p>
                </button>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openStage(secIdx)}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" aria-hidden="true" /> Tulis soal
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(secIdx)}
                    aria-label={`Hapus ${section.title || `tahap ${secIdx + 1}`}`}
                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <ChevronRight
                    className="w-5 h-5 text-muted-foreground hidden sm:block"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 font-bold text-sm transition-colors"
      >
        <Plus className="w-4 h-4" aria-hidden="true" /> Tambah Tahap
      </button>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center mb-3 leading-relaxed">
          Belum tahu harus mulai dari mana? Bank soal bisa menyusunkan tiga tahap —
          teknis, soft skill, dan wawancara. Semuanya tetap bisa Anda ubah.
        </p>
        <button
          type="button"
          onClick={() => void composeFromBank()}
          disabled={isComposing}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-500 font-bold text-sm hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
        >
          {isComposing ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Wand2 className="w-5 h-5" aria-hidden="true" />
          )}
          Susunkan tahapan untuk saya
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------------------- FOKUS
  const renderStageFocus = (secIdx: number) => {
    const section = sections[secIdx];
    if (!section) return null;

    const components = section.components || [];
    const stats = sectionStats(section);

    return (
      <div
        onKeyDown={handleKeyDown}
        className={`flex flex-col border border-border overflow-hidden duration-500 ${
          isEditorExpanded
            ? 'fixed inset-0 z-[100] bg-background rounded-none'
            : 'h-[750px] bg-background rounded-2xl animate-in fade-in slide-in-from-bottom-4'
        }`}
      >
        {/* Jalan keluar sendiri. Tombol kaki ManualBuilder disembunyikan selama
            fokus terbuka, supaya tidak ada dua jalan keluar yang bersaing. */}
        <div className="bg-card border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={backToList}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Semua tahap
            </button>
            <span className="text-muted-foreground" aria-hidden="true">
              /
            </span>
            <span className="font-bold text-foreground text-sm truncate">
              {section.title?.trim() || `Tahap ${secIdx + 1}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {stats.count} soal · {stats.points} poin
              {stats.needGrading > 0 && (
                <span className="text-amber-500 font-semibold">
                  {' '}
                  · {stats.needGrading} butuh dinilai
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setIsEditorExpanded(!isEditorExpanded)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-3 py-2 rounded-lg transition-colors border border-cyan-500/20"
            >
              {isEditorExpanded ? 'Kecilkan' : 'Layar Penuh'}
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-background relative">
          {/* Pengaturan tahap. Tinggal dua: nama dan lama pengerjaan. */}
          <div className="bg-card p-4 sm:p-6 border-b border-border flex flex-wrap items-start gap-6">
            <div className="flex-1 min-w-[250px]">
              <label
                htmlFor="section-title"
                className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider"
              >
                Judul Tahap
              </label>
              <input
                id="section-title"
                value={section.title}
                onChange={(e) => updateSectionTitle(secIdx, e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Contoh: Kuis Pemrograman React"
              />
            </div>
            <div className="flex-1 min-w-[250px]">
              <DurationPicker
                label="Waktu Pengerjaan (Per Tahap)"
                value={section.timeLimit || null}
                onChange={(val) => updateSectionTimeLimit(secIdx, val)}
                placeholder="Tak Terbatas"
              />
            </div>
          </div>

          <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-4">
            {components.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-card">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
                <p className="text-lg font-medium text-foreground mb-2">Belum ada pertanyaan</p>
                <p className="text-sm">Tempel dari spreadsheet, ambil dari bank, atau tulis satu per satu di bawah.</p>
              </div>
            ) : (
              components.map((comp: any, compIdx: number) => {
                const isExpanded = expandedCompIdx === compIdx;

                return (
                  <motion.div
                    layout
                    key={compIdx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingCompIdx !== null) setDragOverCompIdx(compIdx);
                    }}
                    onDragLeave={() =>
                      setDragOverCompIdx((prev) => (prev === compIdx ? null : prev))
                    }
                    onDrop={() => {
                      if (draggingCompIdx !== null) {
                        moveComponent(secIdx, draggingCompIdx, compIdx);
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
                    <div
                      className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer"
                      onClick={() => setExpandedCompIdx(isExpanded ? null : compIdx)}
                    >
                      {/* Tombol panah disediakan berdampingan karena tarik-lepas
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
                            moveComponent(secIdx, compIdx, compIdx - 1);
                          }}
                          disabled={compIdx === 0}
                          aria-label="Pindahkan soal ke atas"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <GripVertical
                          className="w-5 h-5 text-muted-foreground opacity-50"
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveComponent(secIdx, compIdx, compIdx + 1);
                          }}
                          disabled={compIdx === components.length - 1}
                          aria-label="Pindahkan soal ke bawah"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-500/20">
                            {comp.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {comp.points} Poin
                          </span>
                          {!AUTO_SCORED_TYPES.has(comp.type) && (
                            <span className="text-[10px] font-bold text-amber-500">
                              Butuh dinilai
                            </span>
                          )}
                          {comp.sourceItemId && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                              <Layers className="w-3 h-3" aria-hidden="true" /> Dari bank
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-base font-medium truncate transition-colors ${
                            comp.question ? 'text-foreground' : 'text-muted-foreground italic'
                          }`}
                        >
                          {comp.question || 'Pertanyaan kosong...'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {canSaveToCollection && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void saveToCollection(secIdx, compIdx);
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
                          onClick={(e) => {
                            e.stopPropagation();
                            removeComponent(secIdx, compIdx);
                          }}
                          aria-label="Hapus soal"
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <div className="p-2 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="w-5 h-5" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    </div>

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
                                <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">
                                  Pertanyaan
                                </label>
                                <textarea
                                  value={comp.question}
                                  onChange={(e) =>
                                    updateComponent(secIdx, compIdx, 'question', e.target.value)
                                  }
                                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                                  rows={3}
                                  placeholder="Tuliskan pertanyaan di sini..."
                                />
                              </div>
                              <div className="w-full sm:w-24 flex-shrink-0">
                                <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">
                                  Poin
                                </label>
                                <input
                                  type="number"
                                  value={comp.points}
                                  onChange={(e) =>
                                    updateComponent(
                                      secIdx,
                                      compIdx,
                                      'points',
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors sm:text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </div>

                            <div className="pt-2">
                              {(() => {
                                const TypeComponent = QuestionTypeRegistry[comp.type]?.Builder;
                                if (!TypeComponent)
                                  return (
                                    <p className="text-red-400 text-sm">
                                      Tipe komponen {comp.type} belum didukung.
                                    </p>
                                  );
                                return (
                                  <TypeComponent
                                    comp={comp}
                                    onChange={(field: string, value: any) =>
                                      updateComponent(secIdx, compIdx, field, value)
                                    }
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

            {/* Tiga cara mengisi tahap, dari yang paling cepat. Menulis satu per
                satu diletakkan terakhir karena itu yang paling mahal. */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsBulkOpen((prev) => !prev)}
                aria-expanded={isBulkOpen}
                className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-500 font-bold text-sm hover:bg-emerald-500/10 transition-colors"
              >
                <ClipboardPaste className="w-5 h-5" aria-hidden="true" />
                Tempel banyak soal sekaligus
              </button>
              <button
                type="button"
                onClick={() => setIsBankOpen(true)}
                className="flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
              >
                <Layers className="w-5 h-5" aria-hidden="true" />
                Ambil dari bank soal
              </button>
            </div>

            {isBulkOpen && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h5 className="font-bold text-foreground text-sm mb-1">
                    Satu soal per baris
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tanpa tanda <code className="font-mono">|</code> jadi soal esai. Dengan{' '}
                    <code className="font-mono">|</code> jadi pilihan ganda, dan{' '}
                    <code className="font-mono">*</code> di depan opsi menandai kunci
                    jawabannya.
                  </p>
                </div>

                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={7}
                  spellCheck={false}
                  placeholder={BULK_PLACEHOLDER}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors"
                />

                {bulkPreview && bulkPreview.errors.length > 0 && (
                  <ul className="text-xs text-danger space-y-1">
                    {bulkPreview.errors.slice(0, 4).map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}

                {bulkPreview && bulkPreview.warnings.length > 0 && (
                  <ul className="text-xs text-amber-500 space-y-1">
                    {bulkPreview.warnings.slice(0, 4).map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {bulkPreview && bulkPreview.questions.length > 0
                      ? `${bulkPreview.questions.length} soal terbaca.`
                      : 'Belum ada soal yang terbaca.'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkOpen(false);
                        setBulkText('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={addBulkQuestions}
                      disabled={!bulkPreview || bulkPreview.questions.length === 0}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Tambahkan{' '}
                      {bulkPreview && bulkPreview.questions.length > 0
                        ? bulkPreview.questions.length
                        : ''}{' '}
                      soal
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 pb-4 space-y-5">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-center">
                Atau tulis satu per satu
              </p>

              {TYPE_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="mb-2">
                    <p className={`text-xs font-bold ${group.tone}`}>{group.title}</p>
                    <p className="text-[11px] text-muted-foreground">{group.hint}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {group.types.map((entry) => (
                      <button
                        key={entry.type}
                        type="button"
                        onClick={() => addComponent(secIdx, entry.type)}
                        className="text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-3 rounded-xl transition-colors border border-white/5"
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {stats.needGrading > 0 && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <Clock
                    className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-amber-500 leading-relaxed">
                    {stats.needGrading} soal di tahap ini butuh dinilai AI atau manusia,
                    jadi hasilnya tidak keluar seketika. Tahap sesudahnya yang memakai
                    ambang nilai akan ikut menunggu — atur perlakuannya di{' '}
                    <strong>Jadwal &amp; syarat masuk</strong> di bawah.
                  </p>
                </div>
              )}
            </div>
          </div>

          <StageGateSettings
            key={secIdx}
            sections={sections as Section[]}
            index={secIdx}
            onChange={(patch) => updateSectionGate(secIdx, patch)}
          />
        </div>
      </div>
    );
  };

  const focus = isFocused ? renderStageFocus(selectedSectionIdx!) : null;

  const content = focus ?? renderStageList();

  return (
    <>
      {isEditorExpanded && mounted && focus
        ? createPortal(focus, document.body)
        : content}

      <BankPicker
        open={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        defaultCategory={manualData.category}
        defaultDifficulty={manualData.difficulty}
        targetSectionTitle={
          (selectedSectionIdx !== null ? sections[selectedSectionIdx]?.title : '') || 'tahap ini'
        }
        onAdd={addFromBank}
      />
    </>
  );
}
