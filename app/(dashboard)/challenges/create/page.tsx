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
import { Sparkles, Briefcase, PlusCircle, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Info, Lock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManualBuilder from './components/ManualBuilder';
import { CompanyAccessGate } from '@/components/company/CompanyAccessGate';
import { aiDraftKey, clearDraft, manualDraftKey, readDraft, writeDraft } from '@/lib/challengeDraftStorage';

/** Keadaan awal formulir manual, dipakai juga saat pengguna membuang drafnya. */
const EMPTY_MANUAL_DATA: CreateChallengePayload = {
  title: '',
  summary: '',
  description: '',
  category: 'FRONTEND',
  difficulty: 'INTERMEDIATE',
  sections: [{ title: 'Tahap 1', order: 0, components: [], stageType: 'ASSIGNMENT' }],
};

export default function CreateChallengePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loadUserFromStorage, isAuthenticated, isHydrated } = useUserStore();
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'MANUAL' | 'AI'>('TEMPLATES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [cloningTemplateId, setCloningTemplateId] = useState<string | null>(null);
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

  const loadTemplates = React.useCallback(async () => {
    setIsLoadingTemplates(true);
    setTemplatesError(null);
    try {
      setTemplates(await challengesService.getTemplates());
    } catch (err: any) {
      // Kegagalan permintaan tidak lagi menyamar sebagai "belum ada template".
      setTemplatesError(
        err?.message || 'Gagal memuat pustaka template. Periksa koneksi Anda.',
      );
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCloneTemplate = async (templateId: string) => {
    if (!isAuthenticated) return;
    setCloningTemplateId(templateId);
    try {
      const data = await challengesService.cloneTemplate(templateId);

      setSuccessMsg('Template berhasil disalin. Anda dapat menyesuaikannya sekarang.');
      // Load the cloned challenge into manual builder
      setManualData({
        id: data.id,
        title: data.title,
        summary: data.summary,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        sections: data.sections || [],
        gradingRubric: data.gradingRubric,
        status: data.status,
      });
      setActiveTab('MANUAL');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menduplikasi template.');
    } finally {
      setCloningTemplateId(null);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'TALENT') {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  // States for AI Form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT'>('FRONTEND');
  const [aiDifficulty, setAiDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [aiBlueprint, setAiBlueprint] = useState<any>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');

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
    if (savedData && (savedData.status === 'PUBLISHED' || savedData.status === 'CLOSED')) {
      clearDraft(manualDraftKey(draftOwnerId));
    } else if (savedData) {
      setManualData(savedData);
    }

    const savedAiState = readDraft<any>(aiDraftKey(draftOwnerId));
    if (savedAiState) {
      if (savedAiState.aiPrompt) setAiPrompt(savedAiState.aiPrompt);
      if (savedAiState.aiCategory) setAiCategory(savedAiState.aiCategory);
      if (savedAiState.aiDifficulty) setAiDifficulty(savedAiState.aiDifficulty);
      if (savedAiState.aiBlueprint) setAiBlueprint(savedAiState.aiBlueprint);
    }

    setIsDraftLoaded(true);
  }, [draftOwnerId]);

  useEffect(() => {
    if (!draftOwnerId || !isDraftLoaded) return;
    writeDraft(manualDraftKey(draftOwnerId), manualData);
  }, [manualData, draftOwnerId, isDraftLoaded]);

  useEffect(() => {
    if (!draftOwnerId || !isDraftLoaded) return;
    writeDraft(aiDraftKey(draftOwnerId), {
      aiPrompt,
      aiCategory,
      aiDifficulty,
      aiBlueprint,
    });
  }, [aiPrompt, aiCategory, aiDifficulty, aiBlueprint, draftOwnerId, isDraftLoaded]);

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await challengesService.generateAiBlueprint({
        prompt: aiPrompt,
        category: aiCategory,
        difficulty: aiDifficulty,
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
        prompt: refinementPrompt,
        category: aiCategory,
        difficulty: aiDifficulty,
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
      const res = await challengesService.generateAi({
        prompt: aiPrompt,
        category: aiCategory,
        difficulty: aiDifficulty,
        blueprint: aiBlueprint,
      });
      setSuccessMsg('Proses generasi soal dan rubrik sedang berjalan di latar belakang. Anda akan menerima notifikasi begitu drafnya siap.');

      // Bersihkan cache dan arahkan ke daftar challenge milik pengguna, tempat
      // draf hasil AI akan muncul begitu selesai diproses.
      //
      // Pengalihan tidak lagi dipaksakan lewat setTimeout. Menunggu tiga detik
      // tanpa cara melewatinya membuat pesan sukses terasa seperti aplikasi
      // yang menggantung; sekarang pesannya menyediakan tautannya sendiri.
      if (draftOwnerId) clearDraft(aiDraftKey(draftOwnerId));
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
      
      // Draf lokal dibuang lalu langsung berpindah. Jeda dua detik sebelumnya
      // hanya menahan pengguna di layar yang pekerjaannya sudah selesai.
      if (draftOwnerId) clearDraft(manualDraftKey(draftOwnerId));
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
    if (draftOwnerId) clearDraft(manualDraftKey(draftOwnerId));
    setManualData(EMPTY_MANUAL_DATA);
    setIsDiscardOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    toast.success('Draf lokal dibuang. Formulir dikosongkan.');
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
            Buat tantangan teknis atau bisnis untuk talenta. Anda dapat mendesain
            secara manual atau membiarkan AI generatif kami merancang spesifikasi
            dan rubrik secara otomatis.
          </p>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-background p-2 rounded-2xl border border-border w-full sm:w-fit">
        <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
              activeTab === 'TEMPLATES'
            ? 'bg-primary text-white shadow-lg border border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Template Library</span>
          </button>
        {/* Tab AI tidak lagi `disabled` dengan tooltip yang hanya muncul saat
            disorot tetikus. Tombol `disabled` hilang dari urutan tab sehingga
            pengguna keyboard tidak pernah tahu alasannya, dan tooltip hover
            tidak pernah muncul di layar sentuh. Sekarang tombolnya tetap bisa
            difokus dan menjelaskan sendiri apa yang harus dilakukan. */}
        <button
          onClick={() => {
            if (isAiLocked) {
              router.push('/company/billing');
              return;
            }
            setActiveTab('AI');
          }}
          aria-describedby={isAiLocked ? 'ai-tab-lock-note' : undefined}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
            activeTab === 'AI'
              ? 'bg-primary text-white shadow-lg border border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
        >
          {isAiLocked ? (
            <Lock className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          AI Auto-Generate
          {isAiLocked && <span className="sr-only">— butuh paket Pro</span>}
        </button>
        <button
            onClick={() => setActiveTab('MANUAL')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
              activeTab === 'MANUAL'
            ? 'bg-primary text-white shadow-lg border border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>Pembuatan Manual</span>
          </button>
      </div>

      {isAiLocked && (
        <p id="ai-tab-lock-note" className="text-xs text-muted-foreground -mt-6">
          AI Auto-Generate aktif mulai paket Pro.{' '}
          <Link href="/company/billing" className="font-semibold text-success underline underline-offset-4">
            Lihat paket
          </Link>
          .
        </p>
      )}

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
        {activeTab === 'TEMPLATES' ? (
          <motion.div
            key="templates-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoadingTemplates ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground" aria-busy="true">
                <Loader2 className="h-8 w-8 animate-spin mb-4" aria-hidden="true" />
                <p>Memuat Role-Based Templates...</p>
              </div>
            ) : templatesError ? (
              /* Permintaan yang gagal dibedakan dari pustaka yang memang
                 kosong. Sebelumnya keduanya menampilkan kalimat yang sama. */
              <div
                role="alert"
                className="col-span-full flex flex-col items-center justify-center py-12 bg-card rounded-2xl border border-danger/30 text-center px-6"
              >
                <AlertCircle className="h-12 w-12 mb-4 text-danger" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  Pustaka template gagal dimuat
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm">{templatesError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadTemplates()}>
                  Coba muat ulang
                </Button>
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                <Briefcase className="h-12 w-12 mb-4 opacity-50" aria-hidden="true" />
                <p>Belum ada template yang tersedia. Anda bisa menggunakan AI Auto-Generate.</p>
              </div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                      {tpl.category}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {tpl.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{tpl.templateRole || tpl.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">{tpl.summary}</p>
                  
                  <div className="space-y-4">
                    <div className="text-xs space-y-2">
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Modul Teknis & Live Coding</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Soft Skill & Situational Test</span>
                      </div>
                    </div>
                    
                    {/* Keadaan memuat dilekatkan pada template yang ditekan.
                        Sebelumnya `isSubmitting` bersama membuat SELURUH tombol
                        template berputar sekaligus. */}
                    <Button
                      onClick={() => handleCloneTemplate(tpl.id)}
                      disabled={!!cloningTemplateId}
                      isLoading={cloningTemplateId === tpl.id}
                      className="w-full font-bold"
                    >
                      Gunakan Template Ini
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : activeTab === 'AI' ? (
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
                    placeholder="Contoh: Buat studi kasus pengembangan landing page menggunakan React dan integrasi form ke webhook. Tampilannya harus modern dan responsif..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={5}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Kategori Pekerjaan</label>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="FRONTEND">Frontend Development</option>
                        <option value="BACKEND">Backend Development</option>
                        <option value="UI_UX">UI/UX Design</option>
                        <option value="DATA_SCIENCE">Data Science / ML</option>
                        <option value="MARKETING">Digital Marketing</option>
                        <option value="PRODUCT">Product Management</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Tingkat Kesulitan</label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="BEGINNER">Beginner (Pemanasan untuk pemula yang baru belajar)</option>
                        <option value="INTERMEDIATE">Intermediate (Tantangan menengah, butuh pemahaman kuat)</option>
                        <option value="ADVANCED">Advanced (Misi kompleks untuk penyelesaian masalah tingkat tinggi)</option>
                      </select>
                    </div>
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

