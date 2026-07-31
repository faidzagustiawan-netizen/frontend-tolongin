'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { challengesService, CreateChallengePayload } from '@/services/challenges.service';
import { submissionsService } from '@/services/submissions.service';
import { getPlan, subscriptionLimitsEnforced } from '@/lib/plans';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Info, Lock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManualBuilder from './components/ManualBuilder';
import ContextForm from './components/ContextForm';
import PathPicker from './components/PathPicker';
import {
  DIFFICULTY_SHORT_LABELS,
  ChallengeContext,
  EMPTY_CONTEXT,
  categoryLabel,
} from './components/options';
import { CompanyAccessGate } from '@/components/company/CompanyAccessGate';
import {
  aiDraftKey,
  clearDraft,
  contextDraftKey,
  manualDraftKey,
  readDraft,
  writeDraft,
} from '@/lib/challengeDraftStorage';

/** Keadaan awal formulir manual, dipakai juga saat pengguna membuang drafnya. */
const EMPTY_MANUAL_DATA: CreateChallengePayload = {
  title: '',
  summary: '',
  description: '',
  category: '',
  difficulty: 'INTERMEDIATE',
  sections: [{ title: 'Tahap 1', order: 0, components: [] }],
};

/**
 * Urutan layar pembuatan.
 *
 * CONTEXT menanyakan apa yang dicari, PATH menawarkan cara membuatnya dengan
 * konteks itu sudah terpasang, lalu MANUAL atau AI mengerjakannya. Sebelumnya
 * tidak ada CONTEXT sama sekali: halaman langsung meminta pengguna memilih
 * salah satu dari tiga tab sebelum ada dasar untuk memilih.
 */
type Phase = 'CONTEXT' | 'PATH' | 'MANUAL' | 'AI';

const STEP_LABELS = ['Konteks', 'Cara membuat', 'Penyusunan'];

/** MANUAL dan AI sama-sama langkah ketiga; keduanya cara menyusun isi. */
const PHASE_STEP_INDEX: Record<Phase, number> = {
  CONTEXT: 0,
  PATH: 1,
  MANUAL: 2,
  AI: 2,
};

export default function CreateChallengePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loadUserFromStorage, isAuthenticated, isHydrated } = useUserStore();
  const [phase, setPhase] = useState<Phase>('CONTEXT');
  const [context, setContext] = useState<ChallengeContext>(EMPTY_CONTEXT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssetWarningOpen, setIsAssetWarningOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isCompany = user?.role === 'COMPANY';
  const plan = getPlan(user?.profile?.subscriptionTier as string | undefined);
  // Batas paket mati secara bawaan selama pengembangan; lihat
  // `subscriptionLimitsEnforced` di lib/plans.ts. Aturannya tetap utuh di sini
  // supaya menyalakannya kembali cukup lewat satu variabel environment.
  const isAiLocked =
    subscriptionLimitsEnforced() &&
    isCompany &&
    user?.profile?.subscriptionTier === 'STARTUP';

  // Kuota dihitung dari DRAFT + PUBLISHED, sama persis dengan
  // assertCompanyQuota di backend.
  const { data: statsData } = useQuery({
    queryKey: ['challenge-stats'],
    queryFn: () => submissionsService.getChallengeStats(),
    enabled: isCompany && isAuthenticated && user?.isVerified !== false,
  });

  const quotaUsed = (statsData?.data ?? []).filter(
    (c: any) => c.status === 'DRAFT' || c.status === 'PUBLISHED',
  ).length;
  const isQuotaFull =
    subscriptionLimitsEnforced() &&
    isCompany &&
    plan.activeChallengeQuota !== null &&
    quotaUsed >= plan.activeChallengeQuota;

  /**
   * Membuka formulir manual dengan jawaban langkah konteks sudah terpasang.
   * Judulnya diusulkan dari peran yang dicari — tetap bisa diubah, tetapi
   * pengguna tidak lagi menghadapi formulir yang sepenuhnya kosong.
   */
  const handleChooseManual = () => {
    setManualData((prev) => ({
      ...prev,
      title: prev.title || `Studi Kasus ${context.role}`,
      // Peran yang dicari kini ikut tersimpan, bukan sekadar menyemai judul
      // lalu hilang. Itu jawaban yang paling perusahaan yakini, dan satu-
      // satunya tempat bidang di luar keenam kategori bisa disebutkan.
      role: prev.role || context.role,
      category: context.category,
      difficulty: context.difficulty,
      deadlineAt: prev.deadlineAt ?? context.deadlineAt,
    }));
    setErrorMsg(null);
    setSuccessMsg(null);
    setPhase('MANUAL');
  };

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'TALENT') {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  // States for AI Form.
  //
  // Kategori dan tingkat kesulitan tidak lagi punya state sendiri di sini:
  // keduanya sudah dijawab di langkah konteks, dan menanyakannya ulang berarti
  // dua sumber kebenaran yang bisa berbeda diam-diam.
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBlueprint, setAiBlueprint] = useState<any>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');

  /**
   * Peran yang dicari disisipkan ke prompt karena endpoint blueprint hanya
   * menerima prompt bebas beserta kategori dan level — tidak ada field
   * tersendiri untuk posisi.
   */
  const buildAiPrompt = (instruction: string) =>
    `Posisi yang dicari: ${context.role}.\n\n${instruction}`;

  // States for Manual Form
  const [manualData, setManualData] = useState<CreateChallengePayload>(EMPTY_MANUAL_DATA);

  // Draf disimpan per pengguna. Sebelum identitas diketahui tidak ada yang
  // dimuat maupun ditulis, supaya pekerjaan satu akun tidak pernah mendarat di
  // kunci milik akun lain.
  const draftOwnerId = user?.id ?? null;
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const hasLocalDraft =
    !!manualData.title ||
    !!manualData.summary ||
    !!manualData.description ||
    !!manualData.id;

  useEffect(() => {
    if (!draftOwnerId) return;

    const savedData = readDraft<CreateChallengePayload>(manualDraftKey(draftOwnerId));
    // Draf yang menunjuk studi kasus yang sudah terbit atau diarsipkan dibuang
    // begitu saja. Menyalin template menaruh `id` di dalam draf; bila studi
    // kasus itu kemudian diterbitkan dari layar lain, memulihkannya di sini
    // hanya menjebak pengguna di mode baca-saja tanpa jalan keluar.
    const staleDraft =
      savedData && (savedData.status === 'PUBLISHED' || savedData.status === 'CLOSED');

    if (staleDraft) {
      clearDraft(manualDraftKey(draftOwnerId));
    } else if (savedData) {
      setManualData(savedData);
    }

    const savedAiState = readDraft<any>(aiDraftKey(draftOwnerId));
    if (savedAiState) {
      if (savedAiState.aiPrompt) setAiPrompt(savedAiState.aiPrompt);
      if (savedAiState.aiBlueprint) setAiBlueprint(savedAiState.aiBlueprint);
    }

    const savedContext = readDraft<ChallengeContext>(contextDraftKey(draftOwnerId));
    if (savedContext?.role) setContext({ ...EMPTY_CONTEXT, ...savedContext });

    // Layar pembuka dipilih dari pekerjaan yang tertinggal, bukan selalu dari
    // awal: yang sedang meninjau blueprint kembali ke layar AI, yang sudah
    // mengisi formulir kembali ke formulirnya, dan yang baru menjawab konteks
    // kembali ke daftar pilihan jalur.
    const hasManualWork =
      !staleDraft &&
      !!(savedData?.title || savedData?.summary || savedData?.description || savedData?.id);

    if (savedAiState?.aiBlueprint) {
      setPhase('AI');
    } else if (hasManualWork) {
      setPhase('MANUAL');
    } else if (savedContext?.role) {
      setPhase('PATH');
    }

    setIsDraftLoaded(true);
  }, [draftOwnerId]);

  useEffect(() => {
    if (!draftOwnerId || !isDraftLoaded) return;
    writeDraft(manualDraftKey(draftOwnerId), manualData);
  }, [manualData, draftOwnerId, isDraftLoaded]);

  useEffect(() => {
    if (!draftOwnerId || !isDraftLoaded) return;
    writeDraft(aiDraftKey(draftOwnerId), { aiPrompt, aiBlueprint });
  }, [aiPrompt, aiBlueprint, draftOwnerId, isDraftLoaded]);

  useEffect(() => {
    if (!draftOwnerId || !isDraftLoaded) return;
    writeDraft(contextDraftKey(draftOwnerId), context);
  }, [context, draftOwnerId, isDraftLoaded]);

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await challengesService.generateAiBlueprint({
        prompt: buildAiPrompt(aiPrompt),
        category: context.category,
        difficulty: context.difficulty,
      });
      setAiBlueprint(res.data);
      setSuccessMsg('Blueprint kerangka soal berhasil dibuat. Silakan tinjau dan konfirmasi untuk melanjutkan.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI blueprint generator. Pastikan API key backend telah terkonfigurasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefineBlueprint = async () => {
    if (!refinementPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await challengesService.generateAiBlueprint({
        prompt: buildAiPrompt(refinementPrompt),
        category: context.category,
        difficulty: context.difficulty,
        previousBlueprint: aiBlueprint
      });
      setAiBlueprint(res.data);
      setRefinementPrompt('');
      setSuccessMsg('Blueprint berhasil direvisi berdasarkan masukan Anda!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal merevisi blueprint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestAiGenerate = () => {
    if (!aiPrompt || !aiBlueprint) return;

    // Dulu `window.confirm`: dialog bawaan peramban yang tidak bisa ditata,
    // dan isinya mengulang persis panel kuning yang sudah tampil di layar.
    if (aiBlueprint.requiredAssets && aiBlueprint.requiredAssets.length > 0) {
      setIsAssetWarningOpen(true);
      return;
    }

    void handleAiGenerate();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || !aiBlueprint) return;

    setIsAssetWarningOpen(false);
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await challengesService.generateAi({
        prompt: buildAiPrompt(aiPrompt),
        // Jalur manual sudah menyimpan peran yang dicari; tanpa ini jalur AI
        // membuangnya, dan challenge hasil AI lahir tanpa posisi.
        role: context.role,
        category: context.category,
        difficulty: context.difficulty,
        blueprint: aiBlueprint,
      });
      setSuccessMsg('Proses generasi soal dan rubrik sedang berjalan di latar belakang. Anda akan menerima notifikasi begitu drafnya siap.');
      // Draf hasil AI menempati satu slot kuota begitu dibuat, jadi hitungan
      // di layar harus ikut disegarkan.
      void queryClient.invalidateQueries({ queryKey: ['challenge-stats'] });

      // Bersihkan cache dan arahkan ke daftar challenge milik pengguna, tempat
      // draf hasil AI akan muncul begitu selesai diproses.
      //
      // Pengalihan tidak lagi dipaksakan lewat setTimeout. Menunggu tiga detik
      // tanpa cara melewatinya membuat pesan sukses terasa seperti aplikasi
      // yang menggantung; sekarang pesannya menyediakan tautannya sendiri.
      // Sama seperti penyimpanan manual: pekerjaannya sudah diserahkan, jadi
      // konteks pembukanya ikut ditutup supaya kunjungan berikutnya mulai
      // bersih, bukan melanjutkan peran yang barusan selesai.
      if (draftOwnerId) {
        clearDraft(aiDraftKey(draftOwnerId));
        clearDraft(contextDraftKey(draftOwnerId));
      }
      setAiPrompt('');
      setAiBlueprint(null);
      setContext(EMPTY_CONTEXT);
      setPhase('CONTEXT');
      setIsSubmitting(false);
      return;
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI generator. Pastikan API key backend telah terkonfigurasi.');
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!manualData.title || !manualData.summary || !manualData.description) {
      setErrorMsg("Harap isi Judul, Ringkasan, dan Deskripsi Studi Kasus.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...manualData,
        status,
        gradingRubric: manualData.gradingRubric || {
          completeness: 30,
          quality: 40,
          efficiency: 30,
        }
      };

      if (manualData.id) {
        await challengesService.update(manualData.id, payload);
      } else {
        await challengesService.create(payload);
      }
      
      // Seluruh draf lokal dibuang, bukan hanya formulirnya.
      //
      // Konteks pembuka dan keadaan AI dulu tertinggal, sehingga membuka
      // /challenges/create berikutnya langsung mendarat di langkah "Cara
      // membuat" dengan peran yang dicari dari studi kasus yang barusan
      // selesai — seolah pekerjaan lama belum ditutup.
      if (draftOwnerId) {
        clearDraft(manualDraftKey(draftOwnerId));
        clearDraft(contextDraftKey(draftOwnerId));
        clearDraft(aiDraftKey(draftOwnerId));
      }
      // State ikut dikosongkan, bukan hanya localStorage. Efek autosave
      // menulis ulang setiap kali state berubah, jadi membersihkan kuncinya
      // saja akan langsung tertimpa oleh isi formulir yang barusan dikirim.
      setManualData(EMPTY_MANUAL_DATA);
      setContext(EMPTY_CONTEXT);
      setAiPrompt('');
      setAiBlueprint(null);
      setPhase('CONTEXT');
      // Hitungan kuota berasal dari cache React Query; tanpa disegarkan,
      // spanduk "kuota penuh" masih memakai angka sebelum penyimpanan ini.
      void queryClient.invalidateQueries({ queryKey: ['challenge-stats'] });
      toast.success(
        status === 'DRAFT'
          ? 'Draf berhasil disimpan.'
          : 'Studi kasus berhasil dipublikasikan.',
      );
      // /challenges/mine khusus talenta dan memantulkan akun perusahaan ke
      // dasbor. Mengirim semua orang ke sana membuat perusahaan mental dua
      // kali setelah menekan Publikasikan.
      router.push(isCompany ? '/' : '/challenges/mine');
      return;
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan studi kasus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Membuang draf lokal dan mengembalikan formulir ke keadaan kosong.
   *
   * Tanpa ini pekerjaan yang sudah dimulai tidak punya jalan keluar: draf
   * dipulihkan otomatis setiap kali halaman dibuka, termasuk salinan template
   * yang ternyata tidak jadi dipakai.
   */
  const handleDiscardDraft = () => {
    if (draftOwnerId) {
      clearDraft(manualDraftKey(draftOwnerId));
      clearDraft(aiDraftKey(draftOwnerId));
      clearDraft(contextDraftKey(draftOwnerId));
    }
    setManualData(EMPTY_MANUAL_DATA);
    setContext(EMPTY_CONTEXT);
    setAiPrompt('');
    setAiBlueprint(null);
    setIsDiscardOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPhase('CONTEXT');
    toast.success('Draf lokal dibuang. Mulai lagi dari awal.');
  };

  const currentStepIndex = PHASE_STEP_INDEX[phase];

  /**
   * Penanda langkah bisa dipakai mundur, tidak maju.
   *
   * Melompat ke depan akan melewati jawaban yang menyeleksi template dan
   * mengisi prompt AI, sehingga layar tujuannya kosong tanpa penjelasan.
   */
  const handleStepClick = (index: number) => {
    if (index >= currentStepIndex) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setPhase(index === 0 ? 'CONTEXT' : 'PATH');
  };

  // Pembajakan tombol Enter dihapus.
  //
  // Handler lama menyulap Enter menjadi "pindah ke field berikutnya" di
  // seluruh halaman. Akibatnya Enter tidak lagi mengirim formulir seperti yang
  // diharapkan pengguna, urutan lompatannya memakai urutan DOM dan bukan
  // urutan tab, dan tombol dilewati begitu saja. Perilaku bawaan peramban
  // sudah benar; Tab memang tugasnya berpindah field.

  if (!isHydrated) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse" aria-busy="true">
        <div className="h-40 bg-foreground/5 rounded-3xl" />
        <div className="h-12 bg-foreground/5 rounded-2xl w-2/3" />
        <div className="h-80 bg-foreground/5 rounded-3xl" />
      </div>
    );
  }

  if (!user || (user.role !== 'COMPANY' && user.role !== 'TALENT')) {
    return null;
  }

  return (
    <CompanyAccessGate>
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 shadow-2xl">

  {/* Glow lama tetap dipertahankan */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Background Shape */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="
              M38 0
              C55 5 72 18 100 32
              L100 100
              L0 100
              L0 0
              Z
            "
            className="fill-primary"
          />
        </svg>

        {/* Overlay transparan agar lebih lembut */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight leading-tight">
            Buat Challenge,
            <br />
            Temukan Talenta Berkualitas
          </h1>

          <p className="max-w-2xl text-sm text-white/90 leading-relaxed">
            Mulai dengan menyebutkan posisi yang Anda cari. Dari situ kami
            tunjukkan template yang cocok, atau biarkan AI menyusunkan
            kerangkanya — Anda tetap yang memutuskan.
          </p>
        </div>

      </div>

      {/* Penanda langkah menggantikan bar tab.
          Tab lama menyajikan tiga cara membuat sebagai pilihan sejajar yang
          harus diambil sebelum apa pun diketahui. Sekarang urutannya
          dinyatakan: konteks dulu, cara membuat kemudian, baru penyusunan. */}
      <nav aria-label="Langkah pembuatan">
        <ol className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
          {STEP_LABELS.map((label, index) => {
            const isCurrent = index === currentStepIndex;
            const isDone = index < currentStepIndex;

            return (
              <li key={label} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={index > currentStepIndex}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                    isCurrent
                      ? 'bg-primary text-white'
                      : isDone
                        ? 'text-foreground hover:bg-foreground/5'
                        : 'text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-white/20'
                        : isDone
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-foreground/5'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                  </span>
                  {label}
                </button>
                {index < STEP_LABELS.length - 1 && (
                  <span className="text-muted-foreground/40" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Kuota diperiksa sebelum formulir dibuka, bukan setelah seluruh studi
          kasus selesai disusun lalu ditolak backend saat disimpan. */}
      {isQuotaFull && (
        <div
          role="status"
          className="bg-warning/10 border border-warning/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-warning">
                Kuota paket {plan.name} sudah penuh
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anda memakai {quotaUsed} dari {plan.activeChallengeQuota} studi
                kasus aktif. Arsipkan salah satunya atau tingkatkan paket sebelum
                membuat yang baru — kalau tidak, penyimpanan akan ditolak setelah
                formulir selesai diisi.
              </p>
            </div>
          </div>
          <Link href="/company/billing" className="flex-shrink-0">
            <Button size="sm">Lihat Paket</Button>
          </Link>
        </div>
      )}

      {/* `role="status"` dan `role="alert"`: tanpa keduanya pembaca layar tidak
          pernah mengumumkan hasil pengiriman formulir sepanjang ini. */}
      {successMsg && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 text-success shadow-lg"
        >
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-3">
            <p className="text-sm font-medium leading-relaxed">{successMsg}</p>
            <Link
              href={isCompany ? '/' : '/challenges/mine'}
              className="inline-block text-sm font-bold underline underline-offset-4"
            >
              Buka daftar studi kasus saya
            </Link>
          </div>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 border border-danger/30 rounded-2xl p-6 flex items-start gap-4 text-danger shadow-lg"
        >
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'CONTEXT' ? (
          <motion.div
            key="context-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ContextForm
              context={context}
              setContext={setContext}
              onContinue={() => setPhase('PATH')}
            />
          </motion.div>
        ) : phase === 'PATH' ? (
          <motion.div
            key="path-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PathPicker
              context={context}
              isAiLocked={isAiLocked}
              onEditContext={() => setPhase('CONTEXT')}
              onChooseAi={() => setPhase('AI')}
              onChooseManual={handleChooseManual}
            />
          </motion.div>
        ) : phase === 'AI' ? (
          <motion.div
            key="ai-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-3xl p-8 shadow-xl"
          >
            <div className="space-y-6">
              {!aiBlueprint ? (
                <form onSubmit={handleGenerateBlueprint} className="space-y-6">
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex gap-4 text-sm text-cyan-200">
                    <Info className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                    <p>
                      Ceritakan masalah atau fitur yang sedang perusahaan Anda butuhkan. AI akan merumuskan <strong>Kerangka Studi Kasus (Blueprint)</strong> terlebih dahulu untuk Anda tinjau sebelum membuat detail instruksi teknis dan kode-kodenya.
                    </p>
                  </div>

                  <Textarea
                    label="Prompt Kebutuhan Bisnis / Teknis"
                    placeholder={`Contoh: kandidat ${context.role} harus membangun halaman pendaftaran dengan validasi dan integrasi ke webhook internal kami...`}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={5}
                  />

                  {/* Kategori dan tingkat kesulitan tidak ditanyakan ulang di
                      sini — keduanya sudah dijawab di langkah konteks. Yang
                      dikirim ke AI dinyatakan terbuka supaya tidak ada isi
                      permintaan yang tersembunyi dari pengguna. */}
                  <div className="bg-background border border-border rounded-2xl p-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">AI akan menyusun untuk</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                      {context.role}
                    </span>
                    <span className="px-3 py-1 bg-foreground/5 text-foreground text-xs font-bold rounded-full border border-border">
                      {categoryLabel(context.category)}
                    </span>
                    <span className="px-3 py-1 bg-foreground/5 text-foreground text-xs font-bold rounded-full border border-border">
                      {DIFFICULTY_SHORT_LABELS[context.difficulty] ?? context.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhase('CONTEXT')}
                      className="text-xs font-semibold text-primary underline underline-offset-4 ml-auto"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <Button 
                      type="submit" 
                      isLoading={isSubmitting} 
                      disabled={!aiPrompt}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold text-base shadow-xl"
                    >
                      <Sparkles className="h-5 w-5 mr-2" /> Buat Kerangka (Blueprint)
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-foreground mb-2">Pratinjau Kerangka (Blueprint)</h3>
                    <p className="text-sm text-muted-foreground mb-4">Silakan tinjau kerangka berikut. Jika sudah sesuai, kami akan *generate* detail kode dan soal yang sangat komprehensif.</p>
                    <div className="bg-background rounded-xl p-4 border border-border space-y-4">
                      {aiBlueprint.reasoning && (
                        <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 mb-4">
                          <span className="text-xs font-extrabold text-primary uppercase flex items-center gap-2 tracking-wider">
                            <Sparkles className="w-4 h-4" /> AI Reasoning
                          </span>
                          <p className="text-foreground text-sm mt-3 leading-relaxed opacity-90">{aiBlueprint.reasoning}</p>
                        </div>
                      )}
                      
                      {aiBlueprint.requiredAssets && aiBlueprint.requiredAssets.length > 0 && (
                        <div className="bg-yellow-500/10 p-5 rounded-xl border border-yellow-500/30 mb-4">
                          <span className="text-xs font-extrabold text-yellow-500 uppercase flex items-center gap-2 tracking-wider">
                            <AlertCircle className="w-4 h-4" /> Butuh Aset Eksternal
                          </span>
                          <p className="text-foreground text-sm mt-3 leading-relaxed opacity-90">
                            AI mendeteksi bahwa studi kasus ini membutuhkan aset eksternal berikut: <strong className="text-yellow-500">{aiBlueprint.requiredAssets.join(', ')}</strong>.
                          </p>
                          <p className="text-foreground text-sm mt-2 leading-relaxed opacity-90 text-red-400 font-medium">
                            PERHATIAN: Jika aset ini tidak diserahkan atau dijelaskan, kemungkinan soal yang digenerate tidak akan maksimal dan tidak sesuai dengan keinginan Anda.
                          </p>
                          <p className="text-foreground text-sm mt-2 leading-relaxed opacity-90">
                            Anda memiliki dua opsi: <br/>
                            1. Jelaskan struktur kolom/data Anda di kotak revisi di bawah agar AI dapat memahami konteksnya.<br/>
                            2. Lanjutkan tanpa merevisi, tetapi pastikan Anda mengisi tautannya di bagian <strong>Aset &amp; Sumber Daya</strong> pada langkah Informasi Umum sebelum mempublikasikan studi kasus ini.
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase">Judul</span>
                        <p className="text-foreground font-semibold mt-1">{aiBlueprint.title}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase">Ringkasan</span>
                        <p className="text-foreground text-sm mt-1">{aiBlueprint.summary}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tahapan & Silabus Ujian</span>
                        <div className="mt-4 space-y-4">
                          {aiBlueprint.sections_outline?.map((sec: any, idx: number) => (
                            <div key={idx} className="bg-card/50 border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-foreground text-base">{sec.title}</span>
                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                                  {sec.competencies?.join(', ')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{sec.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-foreground mb-2">Ada yang ingin diubah?</label>
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="Contoh: Tolong ganti tahap wawancara dengan live coding algoritma..."
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        rows={2}
                        className="flex-1"
                        disabled={isSubmitting}
                      />
                      <Button
                        onClick={handleRefineBlueprint}
                        isLoading={isSubmitting}
                        disabled={!refinementPrompt}
                        className="self-end"
                        variant="secondary"
                      >
                        Revisi
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border">
                    <Button 
                      onClick={() => setAiBlueprint(null)}
                      variant="outline"
                      className="flex-1 py-4 font-bold border-border"
                      disabled={isSubmitting}
                    >
                      Batal & Edit Prompt
                    </Button>
                    <Button
                      onClick={requestAiGenerate}
                      isLoading={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold shadow-xl"
                    >
                      <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" /> Konfirmasi &amp; Buat Detail Soal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {hasLocalDraft && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Pekerjaan Anda tersimpan otomatis di peramban ini dan dipulihkan
                  setiap kali halaman dibuka.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDiscardOpen(true)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Buang draf & mulai baru
                </Button>
              </div>
            )}
            <ManualBuilder
              manualData={manualData}
              setManualData={setManualData}
              handleManualSubmit={handleManualSubmit}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={isAssetWarningOpen}
        title="Lanjut tanpa menjelaskan aset?"
        confirmLabel="Lanjutkan tanpa merevisi"
        cancelLabel="Kembali dan jelaskan aset"
        isBusy={isSubmitting}
        onCancel={() => setIsAssetWarningOpen(false)}
        onConfirm={() => void handleAiGenerate()}
      >
        <p>
          AI mendeteksi studi kasus ini membutuhkan aset eksternal yang belum
          Anda jelaskan
          {aiBlueprint?.requiredAssets?.length
            ? `: ${aiBlueprint.requiredAssets.join(', ')}`
            : ''}
          .
        </p>
        <p>
          Tanpa rincian aset atau strukturnya, soal yang dihasilkan besar
          kemungkinan meleset dari yang Anda maksud. Anda bisa kembali dan
          menjelaskannya di kotak revisi.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={isDiscardOpen}
        title="Buang draf lokal ini?"
        confirmLabel="Ya, buang draf"
        cancelLabel="Batal"
        onCancel={() => setIsDiscardOpen(false)}
        onConfirm={handleDiscardDraft}
      >
        <p>
          Seluruh isi formulir manual akan dikosongkan dan salinan otomatis di
          peramban ini dihapus.
        </p>
        <p>
          Studi kasus yang sudah tersimpan di server — draf maupun yang sudah
          terbit — tidak ikut terhapus.
        </p>
      </ConfirmDialog>
    </div>
    </CompanyAccessGate>
  );
}

