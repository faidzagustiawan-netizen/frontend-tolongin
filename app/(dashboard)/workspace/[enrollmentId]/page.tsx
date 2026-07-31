'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '@/services/submissions.service';
import { verificationService } from '@/services/verification.service';
import { pistonService } from '@/services/piston.service';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { FileUploader } from '@/components/workspace/FileUploader';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, CheckCircle2, AlertCircle, GitBranch, Layout, Globe, Send, Award, Timer, Lock, FileText,
  ShieldCheck, Camera, AlertTriangle, ArrowLeft, ExternalLink, Play, Eye, EyeOff, Copy, Check, Cloud, CloudOff, Maximize2, Minimize2, Terminal, Sparkles, Clock, Grid, UserCheck, BadgeCheck, Layers, Code2, Video, Link2, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getLearningRecommendation } from '@/lib/learning-taxonomy';
import { RubricTable } from '@/components/challenge/RubricTable';
import { ChallengeStages } from '@/components/challenge/ChallengeStages';
import { ContinuousProctoring } from '@/components/workspace/ContinuousProctoring';
import { useStageGate, StageExpiryWatcher } from '@/hooks/useStageGate';
import { stagesService } from '@/services/stages.service';
const FaceScanner = dynamic(() => import('@/components/workspace/FaceScanner').then(mod => mod.FaceScanner), { ssr: false });
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => <div className="p-4 bg-background text-muted-foreground animate-pulse text-xs font-mono">Memuat IDE Eksternal...</div> });

export default function EnrollmentWorkspacePage() {
  const { user, loadUserFromStorage } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const selectedEnrollmentId = params.enrollmentId as string;

  // State untuk Talenta
  const [solutionFilesUrl, setSolutionFilesUrl] = useState<string>('');
  const [repositoryUrl, setRepositoryUrl] = useState<string>('');
  const [figmaUrl, setFigmaUrl] = useState<string>('');
  const [liveDemoUrl, setLiveDemoUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [timeLeftString, setTimeLeftString] = useState<string>('--:--:--');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [componentResponses, setComponentResponses] = useState<Record<string, any>>({});
  
  // UX Optimization States
  const [hideTimer, setHideTimer] = useState<boolean>(false);
  const [runTour, setRunTour] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
  // Auto-Save State
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState<boolean>(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State untuk Eksekusi Live Coding
  const [executionOutput, setExecutionOutput] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});
  // Wizard State
  type Step = 'OVERVIEW' | 'FACE_CHECK' | 'QUESTIONS' | 'SUBMITTED';
  const [currentStep, setCurrentStep] = useState<Step>('OVERVIEW');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [examQuestionIdx, setExamQuestionIdx] = useState(0);
  const [activeTahapanPage, setActiveTahapanPage] = useState(0);
  const [showNotes, setShowNotes] = useState<boolean>(false);

  useEffect(() => {
    setExamQuestionIdx(0);
  }, [activeSectionIndex]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        const formElements = Array.from(document.querySelectorAll('input, select, textarea')).filter(el => {
          if (el.tagName === 'BUTTON') return false;
          if ((el as HTMLInputElement).readOnly || (el as HTMLInputElement).disabled) return false;
          return true;
        }) as HTMLElement[];
        
        const currentIndex = formElements.indexOf(target);
        if (currentIndex > -1 && currentIndex < formElements.length - 1) {
          e.preventDefault();
          formElements[currentIndex + 1].focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Proctoring & Anti-Joki State
  const [proctoringEvents, setProctoringEvents] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  
  const [faceVerified, setFaceVerified] = useState<boolean | null>(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamOpen, setWebcamOpen] = useState<boolean>(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Query untuk Talenta
  const { data: talentData, isLoading: isTalentLoading, refetch: refetchTalent } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user,
  });

  // Query untuk Verification Status
  const { data: verificationStatusData } = useQuery({
    queryKey: ['verification-status'],
    queryFn: () => verificationService.getStatus(),
    enabled: !!user,
  });
  const kycStatus = verificationStatusData?.data?.status || 'UNVERIFIED';

  // Keadaan tahap datang dari server, termasuk keputusan terbuka atau tidak dan
  // sisa waktunya. Halaman ini tidak menghitung apa pun sendiri: hitungan di
  // peramban bisa dihentikan dengan menutup tab.
  const stageGate = useStageGate(selectedEnrollmentId, {
    enabled: !!selectedEnrollmentId && !!user,
  });

  const enrollments = talentData?.data || [];
  const selectedEnrollment = enrollments.find((e: any) => e.id === selectedEnrollmentId);
  const isProctored = selectedEnrollment?.challenge?.gradingRubric?.requireProctoring ?? true;
  
  // Ambil pengaturan spesifik dari proctoringSettings (opsional).
  // Kolom `proctoringSettings` adalah tempat sebenarnya; pembacaan dari
  // gradingRubric dipertahankan sebagai cadangan untuk challenge yang dibuat
  // sebelum kolomnya dipisahkan.
  const proctoringSettings =
    selectedEnrollment?.challenge?.proctoringSettings
    || selectedEnrollment?.challenge?.gradingRubric?.proctoringSettings
    || {};
  const requireFaceScan = proctoringSettings.requireFaceScan !== false && isProctored; // Default true jika isProctored
  const trackTabSwitches = proctoringSettings.trackTabSwitches ?? isProctored;
  const maxTabSwitches = proctoringSettings.maxTabSwitches || 0;
  const blockCopyPaste = proctoringSettings.blockCopyPaste || false;
  const blockRightClick = proctoringSettings.blockRightClick || false;
  const enforceFullscreen = proctoringSettings.enforceFullscreen || false;
  const continuousTracking = proctoringSettings.continuousTracking || false;

  // Prevent Navigation & Refresh
  useEffect(() => {
    if (currentStep === 'QUESTIONS' && !isSubmitting && !submitSuccess && !isExpired) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [currentStep, isSubmitting, submitSuccess, isExpired]);

  // Redirect if not found
  useEffect(() => {
    if (!isTalentLoading && !selectedEnrollment) {
      router.push('/');
    } else if (selectedEnrollment) {
      const subs = selectedEnrollment.submissions || [];
      if (subs.length > 0) {
        setCurrentStep('SUBMITTED');
      } else {
        // If not submitted, start the tour if they haven't seen it yet
        const hasSeenTour = localStorage.getItem('hasSeenWorkspaceTour');
        if (!hasSeenTour) {
          setRunTour(true);
        }
      }
    }
  }, [isTalentLoading, selectedEnrollment, router]);

  const finishTour = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenWorkspaceTour', 'true');
  };

  // Hydration Draft Data (Auto-Load)
  useEffect(() => {
    if (selectedEnrollment && !isHydrated) {
      if (selectedEnrollment.draftData) {
        const draft = selectedEnrollment.draftData;
        setComponentResponses(draft.componentResponses || {});
        setCustomInputs(draft.customInputs || {});
        setNotes(draft.notes || '');

        // Status pengawasan ikut dipulihkan. Tanpa ini, memuat ulang halaman
        // mengembalikan hitungan ke nol sehingga batas perpindahan tab bisa
        // dilewati hanya dengan menekan F5.
        setTabSwitchCount(draft.tabSwitchCount || 0);
        setProctoringEvents(draft.proctoringEvents || []);
        setIsLockedOut(!!draft.isLockedOut);
      }
      setIsHydrated(true);
    }
  }, [selectedEnrollment, isHydrated]);

  // Payload draf terbaru disimpan di ref agar bisa dikirim dari event handler
  // (beforeunload, unmount) tanpa ikut memicu render ulang.
  const draftPayloadRef = useRef<Record<string, unknown>>({});
  useEffect(() => {
    draftPayloadRef.current = {
      componentResponses,
      customInputs,
      notes,
      tabSwitchCount,
      proctoringEvents,
      isLockedOut,
    };
  }, [componentResponses, customInputs, notes, tabSwitchCount, proctoringEvents, isLockedOut]);

  const flushDraft = useCallback(async () => {
    if (!isHydrated || !selectedEnrollmentId) return;
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    try {
      setIsSavingDraft(true);
      await submissionsService.saveDraft(
        selectedEnrollmentId,
        draftPayloadRef.current as any,
      );
      setLastDraftSavedAt(new Date());
    } catch (err) {
      console.error('Gagal menyimpan draf:', err);
    } finally {
      setIsSavingDraft(false);
    }
  }, [isHydrated, selectedEnrollmentId]);

  // Debounced Auto-Save (Server-Side)
  useEffect(() => {
    if (!isHydrated || currentStep !== 'QUESTIONS' || isExpired) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    // Penanda hanya menyala saat permintaan benar-benar berjalan. Sebelumnya
    // dinyalakan di awal jeda, sehingga selama pengguna mengetik terus
    // indikatornya menampilkan "menyimpan" padahal belum ada yang terkirim.
    setHasUnsavedDraft(true);
    draftTimerRef.current = setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        await submissionsService.saveDraft(selectedEnrollmentId, {
          componentResponses,
          customInputs,
          notes,
          tabSwitchCount,
          proctoringEvents,
          isLockedOut,
        });
        setLastDraftSavedAt(new Date());
        setHasUnsavedDraft(false);
      } catch (err) {
        console.error('Gagal auto-save:', err);
      } finally {
        setIsSavingDraft(false);
      }
    }, 3000); // Tunggu 3 detik setelah user berhenti mengetik

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [componentResponses, customInputs, notes, tabSwitchCount, proctoringEvents, isLockedOut, isHydrated, currentStep, isExpired, selectedEnrollmentId]);

  // Simpan sisa perubahan saat komponen dilepas (mis. pengguna berpindah
  // halaman). Tanpa ini, ketikan dalam 3 detik terakhir hilang tanpa jejak.
  useEffect(() => {
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
        void submissionsService
          .saveDraft(selectedEnrollmentId, draftPayloadRef.current as any)
          .catch(() => undefined);
      }
    };
  }, [selectedEnrollmentId]);

  // LMS Timer
  useEffect(() => {
    if (!selectedEnrollment) return;
    const startedAtMs = new Date(selectedEnrollment.startedAt).getTime();
    const durationHours = selectedEnrollment.challenge?.gradingRubric?.durationHours || 72;
    const expiresAtMs = startedAtMs + durationHours * 3600 * 1000;
    const submissions = selectedEnrollment?.submissions || [];
    const latestSubmission = submissions[submissions.length - 1];

    const updateTimer = () => {
      let now = Date.now();
      if (latestSubmission) {
        now = new Date(latestSubmission.createdAt).getTime();
      }

      const diff = expiresAtMs - now;
      if (diff <= 0) {
        setIsExpired((wasExpired) => {
          // Auto-save dimatikan begitu waktu habis, jadi perubahan terakhir
          // harus didorong sekali di sini agar tidak hangus bersama tenggat.
          if (!wasExpired) void flushDraft();
          return true;
        });
        setTimeLeftString('00h 00m 00s');
      } else {
        setIsExpired(false);
        const hrs = Math.floor(diff / (1000 * 3600));
        const mins = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftString(
          `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
        );
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [selectedEnrollment, flushDraft]);

  // Tab Switching Listener (Proctoring)
  useEffect(() => {
    if (!selectedEnrollment || !trackTabSwitches || isExpired || currentStep !== 'QUESTIONS') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          if (maxTabSwitches > 0 && newCount > maxTabSwitches) {
            setIsLockedOut(true);
            setProctoringEvents((list) => [...list, `[${timestamp}] Pelanggaran Fatal: Pindah tab melebihi batas maksimal (${maxTabSwitches}).`]);
          } else {
            setShowTabWarning(true);
            setProctoringEvents((list) => [...list, `[${timestamp}] Jendela peramban ditutup / Berpindah ke aplikasi eksternal (Ke-${newCount})`]);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedEnrollment, trackTabSwitches, isExpired, maxTabSwitches, currentStep]);

  // Enforce Fullscreen
  useEffect(() => {
    if (enforceFullscreen && currentStep === 'QUESTIONS' && !isExpired) {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && !isLockedOut) {
          setShowTabWarning(true); // Re-use tab warning for fullscreen exit
        }
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, [enforceFullscreen, currentStep, isExpired, isLockedOut]);

  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API is not supported or was blocked.", err);
    }
  };

  const handleExitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Could not exit fullscreen.", err);
    }
  };

  // Start Webcam Stream
  const handleStartWebcam = () => {
    setWebcamOpen(true);
    setIsVerifyingFace(false);
  };

  const handleFaceVerification = async (scannedDescriptor: number[], imageDataUrl?: string) => {
    setIsVerifyingFace(true);

    try {
      if (!imageDataUrl) {
        setFaceVerified(false);
        alert('Gagal mengambil gambar wajah dari kamera.');
        setIsVerifyingFace(false);
        return;
      }

      const result = await verificationService.verifyExecution({ livePhotoUrl: imageDataUrl });

      if (result.verified) {
        setFaceVerified(true);
        setWebcamOpen(false);
      } else {
        setFaceVerified(false);
        alert(`${result.message}`);
      }
    } catch (err: any) {
      setFaceVerified(false);
      alert(err.response?.data?.message || err.message || 'Terjadi kesalahan saat memverifikasi wajah.');
    } finally {
      setIsVerifyingFace(false);
    }
  };

  if (isTalentLoading || !selectedEnrollment) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-foreground/5 rounded-xl w-1/3" />
        <div className="h-40 bg-foreground/5 rounded-xl w-full" />
      </div>
    );
  }

  const rawSections = selectedEnrollment?.challenge?.sections || [];
  const rawComponents = selectedEnrollment?.challenge?.components || [];
  const sections = rawSections.length > 0 
    ? rawSections 
    : (rawComponents.length > 0 ? [{ id: 'default', title: 'Seksi Ujian', components: rawComponents }] : []);
  const customOutputs: Array<{ id: string; label: string; placeholder: string; required?: boolean }> =
    selectedEnrollment?.challenge?.gradingRubric?.customOutputs || [];

  // Keadaan tahap dipasangkan lewat id, bukan indeks: urutan di layar dan
  // urutan jawaban server tidak dijamin sama, dan menukar keduanya berarti
  // membuka tahap yang salah.
  const stageBySection = new Map(stageGate.stages.map((s) => [s.sectionId, s]));
  const activeSection = sections[activeSectionIndex];
  const activeStage = activeSection ? stageBySection.get(activeSection.id) : undefined;

  // Studi kasus lama tanpa satu pun `ChallengeSection` — atau yang belum punya
  // baris attempt — tidak boleh terkunci gara-gara fitur ini. Tanpa keadaan
  // tahap dari server, halaman berperilaku seperti sebelumnya.
  const isStageGated = stageGate.stages.length > 0;
  const isActiveStageRunning = !isStageGated || activeStage?.status === 'IN_PROGRESS';
  const isActiveStageDone =
    !!activeStage &&
    ['SUBMITTED', 'AWAITING_GRADE', 'PASSED', 'FAILED', 'EXPIRED'].includes(
      activeStage.status,
    );

  /** Sisa waktu tahap aktif, sebagai HH:MM:SS. */
  const stageTimeLeft = (() => {
    if (stageGate.remainingSeconds === null) return null;
    const total = stageGate.remainingSeconds;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  })();

  const handleComponentChange = (componentId: string, value: any, field: 'textValue' | 'fileUrl') => {
    setComponentResponses(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        componentId,
        [field]: value
      }
    }));
  };

  const handleRunCode = async (componentId: string, language: string) => {
    setIsExecuting(prev => ({ ...prev, [componentId]: true }));
    setExecutionOutput(prev => ({ ...prev, [componentId]: 'Executing...' }));
    try {
      const code = componentResponses[componentId]?.textValue || '';
      const output = await pistonService.execute(language, code);
      setExecutionOutput(prev => ({ ...prev, [componentId]: output }));
    } catch (err: any) {
      setExecutionOutput(prev => ({ ...prev, [componentId]: `[Error]\n${err.message}` }));
    } finally {
      setIsExecuting(prev => ({ ...prev, [componentId]: false }));
    }
  };

  const handleSubmitSolution = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedEnrollment) return;
    // Batas global challenge tetap berlaku. Batas per tahap tidak diperiksa di
    // sini: pengumpulan saat waktu tahap habis justru yang dikehendaki —
    // pekerjaan yang sudah ada dikirim alih-alih hilang, dan server yang
    // memutuskan menerimanya atau tidak.
    if (isExpired) return;

    if (isProctored && faceVerified === null) {
      setSubmitError('Pemeriksaan Pengawasan Ujian: Anda wajib melakukan Verifikasi Wajah Anti-Joki sebelum mengirimkan solusi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    let proctoringNotes = '';
    if (isProctored) {
      proctoringNotes = `\n\n### 🔒 Log Pengawasan Ujian (Browser Proctoring)\n- **Status Biometrik Wajah**: ${faceVerified ? 'TERVERIFIKASI (99.4% Sesuai KTP Terdaftar)' : 'TIDAK TERVERIFIKASI'}\n- **Total Perpindahan Jendela / Tab Switching**: ${tabSwitchCount} kali (Pengerjaan di IDE eksternal diizinkan)\n- **Riwayat Waktu Penutupan Tab**:\n${proctoringEvents.length > 0 ? proctoringEvents.map(e => `  * ${e}`).join('\n') : '  * Tidak ada perpindahan mencurigakan'}`;
    }

    let combinedNotes = notes;
    if (customOutputs.length > 0) {
      const customNotes = customOutputs
        .map((out) => `### [${out.label}]\n${customInputs[out.id] || 'Tidak diserahkan'}`)
        .join('\n\n');
      combinedNotes = `${notes ? notes + '\n\n' : ''}## Custom Deliverables\n${customNotes}`;
    }

    combinedNotes += proctoringNotes;

    const responsesArray = Object.values(componentResponses);

    try {
      await submissionsService.submitSolution({
        enrollmentId: selectedEnrollment.id,
        // Tahap yang dikumpulkan. Dikirim hanya bila studi kasus ini memang
        // bertahap — tanpa itu backend memperlakukannya sebagai pengumpulan
        // menyeluruh, seperti sebelum tahapan ada.
        sectionId: isStageGated ? activeSection?.id : undefined,
        solutionFilesUrl,
        repositoryUrl,
        figmaUrl,
        liveDemoUrl,
        notes: combinedNotes,
        responses: responsesArray,
      });

      await stageGate.refresh();
      const refreshed = await stagesService
        .getStages(selectedEnrollment.id)
        .catch(() => null);

      // Tahap berikutnya yang sudah terbuka langsung dituju; kalau tidak ada,
      // pengerjaan memang selesai. Keputusan "sudah terbuka" tetap milik server.
      const nextIndex = refreshed
        ? sections.findIndex((section: any) => {
            const stage = refreshed.find((s) => s.sectionId === section.id);
            return stage?.unlocked && stage.status !== 'IN_PROGRESS'
              ? true
              : stage?.status === 'IN_PROGRESS';
          })
        : -1;

      if (isStageGated && nextIndex >= 0 && nextIndex !== activeSectionIndex) {
        setActiveSectionIndex(nextIndex);
        setExamQuestionIdx(0);
        setComponentResponses({});
        setSubmitSuccess(false);
      } else {
        setSubmitSuccess(true);
        setCurrentStep('SUBMITTED');
        handleExitFullscreen();
      }

      refetchTalent();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          'Gagal mengirimkan solusi. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const submissions = selectedEnrollment?.submissions || [];
  const latestSubmission = submissions[submissions.length - 1];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 font-[var(--font-plus-jakarta)]">
      {/* Waktu tahap habis memicu pengumpulan otomatis: pekerjaan yang sudah
          tersimpan dikirim alih-alih hilang bersama waktunya. Server tetap yang
          memutuskan menerima atau menolak. */}
      <StageExpiryWatcher
        expiredSectionId={stageGate.expiredSectionId}
        onExpire={() => void handleSubmitSolution()}
      />

      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Workspace
      </Link>

      {/* 1. HERO SECTION (Paling Atas di Mobile & Desktop) */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm w-full">
        {/* Banner Image */}
        <div className="h-48 w-full relative overflow-hidden bg-background">
          <Image
            src={selectedEnrollment.challenge.bannerUrl || '/images/challenge-banner.png'}
            alt={selectedEnrollment.challenge.title || 'Banner Studi Kasus'}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-black/20 pointer-events-none"></div>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-8">
          {/* Logo overlay & Issuer */}
          <div className="flex items-end gap-5 -mt-10 mb-6 relative z-10">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center border-4 border-card shadow-sm overflow-hidden shrink-0">
              {selectedEnrollment.challenge?.challengeType === 'PUBLIC' ? (
                selectedEnrollment.challenge?.creator?.avatarUrl ? (
                  <img src={selectedEnrollment.challenge.creator.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-3xl font-display">
                    {(selectedEnrollment.challenge?.creator?.fullName || 'T')[0].toUpperCase()}
                  </span>
                )
              ) : selectedEnrollment.challenge?.company?.logoUrl ? (
                <img src={selectedEnrollment.challenge.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-5xl font-display">T</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-foreground tracking-tight">
                {selectedEnrollment.challenge?.challengeType === 'PUBLIC'
                  ? (selectedEnrollment.challenge?.creator?.fullName || 'Talenta')
                  : (selectedEnrollment.challenge?.company?.companyName || 'Platform')}
              </span>
              {(selectedEnrollment.challenge?.company || selectedEnrollment.challenge?.challengeType === 'PUBLIC') && (
                <BadgeCheck className="w-5 h-5 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-8">
            {selectedEnrollment.challenge.title}
          </h1>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 md:gap-x-20 mb-8 max-w-4xl">
            <div className="flex items-center">
              <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
                <Grid className="w-4 h-4" />
                <span className="text-sm font-semibold">Kategori</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                <span className="text-[10px] uppercase border border-border px-3 py-1 rounded-full tracking-wider">
                  {/* Sebelumnya jatuh ke "DATA SCIENCE" saat bidangnya kosong —
                      menampilkan bidang yang tidak pernah dipilih siapa pun. */}
                  {selectedEnrollment.challenge.category || 'Lintas bidang'}
                </span>
              </div>
            </div>

            <div className="flex items-center md:pl-16">
              <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Batas waktu</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {selectedEnrollment.challenge.gradingRubric?.durationHours || 72} Jam
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-semibold">Mode proctoring</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {isProctored ? 'Aktif (Biometrik Wajib)' : 'Non-Aktif'}
              </div>
            </div>

            <div className="flex items-center md:pl-16">
              <div className="flex items-center gap-2 text-muted-foreground w-40 shrink-0">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Evaluasi AI</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                Instant Feedback
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-base text-foreground font-medium mt-4">
            {selectedEnrollment.challenge.shortDescription || 'Memahami dan memprediksi churn dengan model pembelajaran mesin.'}
          </div>
        </div>
      </div>

      {/* 2. FLEX CONTAINER: Kriteria (setelah Hero di mobile) -> Challenge Tahapan & Workspace */}
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
        
        {/* Kolom Kiri: Sidebar Kriteria (Persentase Fluid: w-full lg:w-1/3 xl:w-1/4 shrink-0) */}
        <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0 space-y-6 lg:sticky lg:top-24 self-start">
          {/* Kriteria & Bobot Penilaian AI */}
          {selectedEnrollment.challenge.gradingRubric && (
            <div className="rounded-3xl shadow-xl overflow-hidden bg-card border border-border">
              <RubricTable rubric={selectedEnrollment.challenge.gradingRubric} />
            </div>
          )}

          {/* Informasi & Bantuan */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Informasi & Bantuan</h4>
            <div className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
              <Clock className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p>Waktu pengerjaan disarankan adalah 3-7 hari setelah Anda mendaftar.</p>
            </div>
            <div className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
              <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>Pastikan Anda mencantumkan tautan repositori GitHub dan demo langsung yang dapat diakses publik.</p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Challenge Tahapan & Workspace (w-full lg:w-2/3 xl:w-3/4 flex-1) */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex-1 min-w-0 space-y-8">
          {/* Tahapan & Struktur Ujian */}
          <ChallengeStages sections={sections} />

          {/* Sesi Pengerjaan */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground mt-1">Sesi Pengerjaan</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md transition-all ${
                  isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-background border-border text-emerald-400'
                }`}>
                  {isExpired ? <Lock className="h-4 w-4 flex-shrink-0" /> : <Timer className="h-4 w-4 flex-shrink-0 animate-spin-slow" />}
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold tracking-wider">{timeLeftString}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">{isExpired ? 'Waktu Habis' : (selectedEnrollment?.submissions?.length > 0) ? 'Sisa Waktu (Saat Submit)' : 'Sisa Waktu Server'}</p>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider bg-foreground/5 border border-foreground/10 px-3 py-2 rounded-xl text-muted-foreground">
                  {selectedEnrollment.status}
                </span>
              </div>
            </div>

            {isExpired && currentStep !== 'SUBMITTED' ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
                <Lock className="h-12 w-12 text-red-400 mx-auto" />
                <h4 className="font-display text-xl font-bold text-foreground">Waktu Pengerjaan Telah Berakhir</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Batas waktu pengerjaan LMS yang dihitung dari waktu server saat Anda pertama kali mendaftar telah habis. Pengumpulan solusi saat ini telah dikunci.
                </p>
              </div>
            ) : currentStep === 'OVERVIEW' ? (
              <div className="space-y-6 text-center py-8">
                <ShieldCheck className="h-16 w-16 text-emerald-400 mx-auto opacity-80" />
                <h4 className="font-display text-2xl font-bold text-foreground">Siap Memulai Pengerjaan?</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Pastikan Anda siap. Saat Anda menekan tombol di bawah, Anda akan masuk ke mode pengerjaan. {isProctored && 'Sistem akan memverifikasi wajah Anda dan mencatat aktivitas peramban secara penuh (Proctoring).'}
                </p>
                <Button 
                  onClick={() => {
                    if (isProctored) {
                      setCurrentStep('FACE_CHECK');
                    } else {
                      handleEnterFullscreen();
                      router.push(`/workspace/${selectedEnrollmentId}/session`);
                    }
                  }} 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold h-14 px-8 mt-4"
                >
                  Mulai Pengerjaan Sekarang
                </Button>
              </div>
            ) : currentStep === 'FACE_CHECK' ? (
              <div className="space-y-6">
                {/* PROCTORING SECURITY & BIOMETRIC BANNER */}
                {isProctored && (
                  <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-inner">
                    <div className="flex items-start gap-3.5">
                      <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-display font-bold text-foreground text-sm">🔒 Pengawasan Ujian Aktif (Flexible Proctoring)</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pengerjaan di IDE eksternal atau aplikasi desain diizinkan secara penuh. Sistem mencatat penutupan atau perpindahan tab sebanyak <strong className="text-amber-400">{tabSwitchCount} kali</strong> sebagai log transparansi bagi tim rekruter.
                        </p>
                        {kycStatus !== 'VERIFIED' && (
                          <div className="bg-amber-500/20 border border-amber-500/50 p-3 rounded-xl text-amber-300 text-xs flex items-center gap-2 mt-2 shadow-inner">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
                            <span>Status Profil Anda belum Terverifikasi KTP. Harap lakukan verifikasi KTP/Selfie di halaman Profil agar pencocokan biometrik berjalan optimal.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <Camera className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Status Wajah Anti-Joki:</span>
                          {isVerifyingFace ? (
                            <span className="text-xs font-bold text-cyan-400 animate-pulse flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Sedang Memverifikasi & Mencocokkan Wajah AI...
                            </span>
                          ) : faceVerified === null ? (
                            <span className="text-xs font-bold text-amber-400 animate-pulse">Belum Dilakukan (Wajib Sebelum Submisi)</span>
                          ) : faceVerified ? (
                            <span className="text-xs font-bold text-emerald-400">✓ Wajah Terverifikasi 99.4% Sesuai KTP/KYC</span>
                          ) : (
                            <span className="text-xs font-bold text-red-400">✗ Wajah Tidak Sesuai Identitas!</span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleStartWebcam}
                        disabled={isVerifyingFace}
                        isLoading={isVerifyingFace}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold flex-shrink-0"
                      >
                        <Camera className="h-4 w-4 mr-2" /> Ambil & Analisis Wajah
                      </Button>
                    </div>

                    {/* Webcam Preview Modal / Stream */}
                    <AnimatePresence>
                      {webcamOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 overflow-hidden"
                        >
                          <FaceScanner 
                            onCaptureComplete={handleFaceVerification}
                            onCancel={() => setWebcamOpen(false)}
                            isVerifying={isVerifyingFace}
                            title="Verifikasi Wajah Peserta"
                            description="Sistem akan membandingkan wajah Anda dengan profil yang terdaftar secara instan (Lokal)."
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {faceVerified && (
                      <Button
                        onClick={() => {
                          handleEnterFullscreen();
                          router.push(`/workspace/${selectedEnrollmentId}/session`);
                        }}
                        size="lg"
                        className="w-full mt-6 bg-[#1E7F4D] hover:bg-[#196B40] text-white font-bold h-14 text-base shadow-xl rounded-2xl flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        Wajah Terverifikasi. Mulai Kerjakan Soal Sekarang
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : currentStep === 'QUESTIONS' ? (
              <form 
                onSubmit={handleSubmitSolution} 
                className="space-y-6 relative"
                onCopy={blockCopyPaste ? (e) => e.preventDefault() : undefined}
                onPaste={blockCopyPaste ? (e) => e.preventDefault() : undefined}
                onCut={blockCopyPaste ? (e) => e.preventDefault() : undefined}
                onContextMenu={blockRightClick ? (e) => e.preventDefault() : undefined}
              >
                {/* CONTINUOUS PROCTORING BACKGROUND COMPONENT */}
                {continuousTracking && !isExpired && (
                  <ContinuousProctoring
                    onViolation={(msg) => {
                      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      setProctoringEvents((list) => [...list, `[${timestamp}] ${msg}`]);
                    }}
                  />
                )}

                {/* TAB SWITCH / FULLSCREEN WARNING MODAL */}
                <AnimatePresence>
                  {showTabWarning && !isLockedOut && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                    >
                      <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                          <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">Pelanggaran Terdeteksi!</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Sistem mendeteksi Anda telah meninggalkan halaman ujian (pindah aplikasi/tab) atau keluar dari mode layar penuh. Tindakan ini telah dicatat dalam laporan proctoring Anda.
                          </p>
                          {maxTabSwitches > 0 && (
                            <p className="text-xs font-bold text-red-400 mt-4">
                              (Peringatan Ke-{tabSwitchCount} dari Maksimal {maxTabSwitches})
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => {
                            setShowTabWarning(false);
                            if (enforceFullscreen) handleEnterFullscreen();
                          }}
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12"
                        >
                          Saya Mengerti, Kembali ke Ujian
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {isLockedOut && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6"
                    >
                      <div className="max-w-md w-full bg-red-500/20 border-2 border-red-500 rounded-3xl p-8 text-center space-y-6">
                        <Lock className="w-16 h-16 text-red-500 mx-auto" />
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">Akses Dikunci!</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Anda telah melanggar batas maksimal perpindahan tab atau aplikasi ({maxTabSwitches} kali). Ujian ini telah dikunci secara otomatis.
                          </p>
                        </div>
                        <Button 
                          onClick={() => router.push('/')}
                          className="w-full bg-white text-red-600 font-bold h-12"
                        >
                          Kembali ke Dashboard
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {submitSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4 text-emerald-400 shadow-lg">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs leading-relaxed">
                      <p className="font-bold text-sm">Solusi Berhasil Dikirim!</p>
                      <p>Sistem AI kami sedang menganalisis kode dan dokumen Anda. Hasil evaluasi akan muncul dalam beberapa menit.</p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400 shadow-lg">
                    <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium leading-relaxed">{submitError}</p>
                  </div>
                )}

                {/* CHALLENGE DESCRIPTION / INSTRUCTIONS */}
                <div className="space-y-6 border-b border-border pb-8 relative">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-emerald-400" /> Instruksi & Spesifikasi Studi Kasus
                    </h4>
                    {/* INDIKATOR AUTO-SAVE
                        Tiga keadaan terpisah. Sebelumnya apa pun yang bukan
                        "sedang menyimpan" ditampilkan sebagai "tersimpan",
                        termasuk saat masih ada ketikan yang belum terkirim —
                        jaminan palsu yang berbahaya di tengah ujian. */}
                    <div className="flex items-center gap-2 text-xs font-mono" aria-live="polite">
                      {isSavingDraft ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Timer className="w-3 h-3 animate-spin-slow" /> Menyimpan draf...
                        </span>
                      ) : hasUnsavedDraft ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Timer className="w-3 h-3" /> Perubahan belum tersimpan
                        </span>
                      ) : lastDraftSavedAt ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tersimpan{' '}
                          {lastDraftSavedAt.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Draf tersinkron
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-muted-foreground space-y-4 leading-relaxed text-sm bg-background p-6 rounded-2xl border border-border shadow-inner">
                    {selectedEnrollment.challenge.description.split('\n\n').map((paragraph: string, i: number) => {
                      if (paragraph.startsWith('### ')) {
                        return <h4 key={i} className="text-base font-bold text-foreground mt-4 mb-2">{paragraph.replace('### ', '')}</h4>;
                      }
                      if (paragraph.startsWith('- ')) {
                        return (
                          <ul key={i} className="list-disc list-inside space-y-1 ml-4 text-xs">
                            {paragraph.split('\n').map((item, j) => (
                              <li key={j}>{item.replace('- ', '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={i}>{paragraph}</p>;
                    })}
                  </div>
                </div>

                {/* DYNAMIC SECTIONS RENDERING */}
                {sections.length > 0 && (
                  <div className="space-y-6 border-t border-border pt-8">
                    <h4 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" /> Lembar Ujian
                    </h4>

                    {sections.length > 1 && (
                      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                        {sections.map((sec: any, idx: number) => {
                          const stage = stageBySection.get(sec.id);
                          // Tanpa keadaan dari server tahap dianggap terbuka —
                          // studi kasus lama tanpa gerbang tidak boleh berubah
                          // perilakunya. Keputusan penguncian hanya datang dari
                          // server, tidak pernah dihitung di sini.
                          const locked = !!stage && !stage.unlocked;
                          const done =
                            !!stage &&
                            ['SUBMITTED', 'AWAITING_GRADE', 'PASSED', 'FAILED'].includes(
                              stage.status,
                            );

                          return (
                            <button
                              key={sec.id || idx}
                              type="button"
                              disabled={locked}
                              title={stage?.lockReason ?? undefined}
                              onClick={() => setActiveSectionIndex(idx)}
                              className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border flex items-center gap-2 ${
                                locked
                                  ? 'bg-background border-border text-muted-foreground/50 cursor-not-allowed'
                                  : activeSectionIndex === idx
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                              }`}
                            >
                              {locked && <Lock className="w-3.5 h-3.5" aria-hidden="true" />}
                              {done && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                              {sec.title}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Alasan terkunci ditampilkan utuh, bukan hanya sebagai
                        tooltip: kalimatnya memuat angka yang perlu dibaca
                        kandidat — ambang nilai dan nilainya sendiri. */}
                    {activeStage && !activeStage.unlocked && activeStage.lockReason && (
                      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-bold text-amber-500 mb-1">Tahap Terkunci</p>
                          <p className="text-sm text-foreground">{activeStage.lockReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Layar antara sebelum jam berjalan. Waktu dicap oleh
                        kehendak kandidat, bukan oleh kebetulan halaman termuat —
                        kalau tidak, membuka tautan berarti kehilangan waktu. */}
                    {activeStage && activeStage.unlocked && !isActiveStageRunning && !isActiveStageDone && (
                      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
                        <Timer className="w-10 h-10 text-emerald-400 mx-auto" aria-hidden="true" />
                        <div>
                          <h5 className="font-bold text-lg text-foreground">{activeStage.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeStage.timeLimit
                              ? `Waktu pengerjaan ${activeStage.timeLimit} menit, dihitung sejak Anda menekan tombol di bawah.`
                              : 'Tahap ini tidak berbatas waktu.'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => void stageGate.startStage(activeStage.sectionId)}
                          className="mx-auto"
                        >
                          <Play className="w-4 h-4" /> Mulai Tahap
                        </Button>
                      </div>
                    )}

                    {isActiveStageDone && activeStage && (
                      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-bold text-emerald-400 mb-1">
                            {activeStage.status === 'EXPIRED'
                              ? 'Waktu Tahap Habis'
                              : 'Tahap Sudah Dikumpulkan'}
                          </p>
                          <p className="text-sm text-foreground">
                            {activeStage.score !== null
                              ? `Nilai tahap ini: ${activeStage.score.toFixed(1)}/100.`
                              : 'Nilainya sedang dihitung. Tahap berikutnya terbuka setelah nilainya keluar.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Hitung mundur tahap. Angkanya berasal dari sisa waktu
                        yang dilaporkan server, bukan dari `timeLimit` dikali di
                        peramban — jam peramban tidak bisa dipercaya. */}
                    {isActiveStageRunning && stageTimeLeft && (
                      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3">
                        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Timer className="w-4 h-4" aria-hidden="true" /> Sisa waktu tahap ini
                        </span>
                        <span
                          className={`font-mono font-bold text-lg ${
                            (stageGate.remainingSeconds ?? 0) < 60
                              ? 'text-red-400'
                              : 'text-foreground'
                          }`}
                        >
                          {stageTimeLeft}
                        </span>
                      </div>
                    )}
                    
                    {/* Soal hanya ditampilkan setelah tahapnya benar-benar
                        dimulai. Menampilkannya lebih awal berarti kandidat bisa
                        membaca dan menyiapkan jawaban sebelum jam berjalan —
                        batas waktu jadi tidak berarti apa-apa. */}
                    {isActiveStageRunning && (
                    <div className="space-y-6">
                      <div className="flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-inner">
                          <div className="p-6 border-b border-border flex items-center justify-between">
                            <div>
                              <h2 className="font-bold text-xl text-foreground">Soal No. {examQuestionIdx + 1}</h2>
                              <p className="text-sm text-muted-foreground mt-1">Selesaikan tugas sesuai dengan format yang diminta.</p>
                            </div>
                            {sections[activeSectionIndex]?.components?.[examQuestionIdx]?.points && (
                              <span className="text-xs bg-background border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 whitespace-nowrap font-bold shadow-sm">
                                {sections[activeSectionIndex].components[examQuestionIdx].points} Poin
                              </span>
                            )}
                          </div>
                          
                          <div className="p-6 sm:p-8 flex-1 overflow-x-hidden">
                            {sections[activeSectionIndex]?.components?.[examQuestionIdx] ? (() => {
                              const currentComp = sections[activeSectionIndex].components[examQuestionIdx];
                              return (
                                <div className="max-w-4xl w-full">
                                  <p className="text-lg text-foreground mb-6 leading-relaxed whitespace-pre-wrap">{currentComp.question}</p>
                                  {currentComp.description && (
                                    <p className="text-sm text-muted-foreground mb-8 bg-black/20 p-4 rounded-xl border border-white/5">{currentComp.description}</p>
                                  )}
                                  
                                  <div className="space-y-4">
                                    {currentComp.type === 'MULTIPLE_CHOICE' && currentComp.options && (
                                      <div className="space-y-3">
                                        {(currentComp.options || []).map((opt: any, optIdx: number) => (
                                          <label 
                                            key={optIdx} 
                                            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                              componentResponses[currentComp.id]?.textValue === opt.id 
                                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white' 
                                                : 'bg-background/50 border-border text-muted-foreground hover:border-foreground/20'
                                            }`}
                                          >
                                            <input 
                                              type="radio" 
                                              name={`q-${examQuestionIdx}`} 
                                              className="mt-1 w-5 h-5 text-cyan-500 focus:ring-cyan-500 bg-background" 
                                              checked={componentResponses[currentComp.id]?.textValue === opt.id}
                                              onChange={() => handleComponentChange(currentComp.id, opt.id, 'textValue')}
                                            />
                                            <span className="flex-1 text-base">{opt.text}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}

                                    {currentComp.type === 'ESSAY' && (
                                      <Textarea
                                        placeholder="Ketik jawaban Anda di sini..."
                                        value={componentResponses[currentComp.id]?.textValue || ''}
                                        onChange={(e) => handleComponentChange(currentComp.id, e.target.value, 'textValue')}
                                        rows={8}
                                      />
                                    )}

                                    {currentComp.type === 'URL_SUBMISSION' && (
                                      <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Masukkan Tautan (URL)</label>
                                        <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                                          <div className="px-4 py-3 bg-[#1a1a1a] border-r border-border text-muted-foreground">
                                            https://
                                          </div>
                                          <input 
                                            type="url" 
                                            value={componentResponses[currentComp.id]?.textValue || ''}
                                            onChange={(e) => handleComponentChange(currentComp.id, e.target.value, 'textValue')}
                                            className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder-gray-600 focus:outline-none w-full min-w-0"
                                            placeholder="contoh: github.com/username/repo"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {currentComp.type === 'FILE_UPLOAD' && (
                                      <div className="bg-background p-6 rounded-2xl border border-border">
                                        <FileUploader
                                          onUploadComplete={(url) => handleComponentChange(currentComp.id, url, 'fileUrl')}
                                          maxSizeMB={25}
                                        />
                                        {componentResponses[currentComp.id]?.fileUrl && (
                                          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                                            <span className="text-emerald-400 text-sm font-medium truncate pr-4">Berkas berhasil diunggah</span>
                                            <a href={componentResponses[currentComp.id].fileUrl} target="_blank" rel="noreferrer" className="text-xs bg-emerald-500 text-black px-3 py-1.5 rounded-lg font-bold shrink-0 hover:bg-emerald-400">Lihat Berkas</a>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {currentComp.type === 'VIDEO_UPLOAD' && (
                                      <div className="space-y-4">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const isRecording = componentResponses[currentComp.id]?.textValue === 'Rekaman Berhasil Disimpan';
                                            handleComponentChange(currentComp.id, isRecording ? '' : 'Rekaman Berhasil Disimpan', 'textValue');
                                          }}
                                          className={`w-full py-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors ${componentResponses[currentComp.id]?.textValue === 'Rekaman Berhasil Disimpan' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-background border-border text-muted-foreground hover:bg-foreground/5 hover:border-cyan-500/50'}`}
                                        >
                                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${componentResponses[currentComp.id]?.textValue === 'Rekaman Berhasil Disimpan' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                            <Camera className="w-5 h-5 text-foreground" />
                                          </div>
                                          <div className="text-center">
                                            <span className="block font-bold text-lg mb-1">{componentResponses[currentComp.id]?.textValue === 'Rekaman Berhasil Disimpan' ? 'Rekaman Selesai Disimpan' : 'Klik untuk Mulai Merekam'}</span>
                                            <span className="text-sm opacity-70">Maksimal durasi 5 menit</span>
                                          </div>
                                        </button>
                                      </div>
                                    )}

                                    {currentComp.type === 'LIVE_CODING' && (
                                      <div className="rounded-xl overflow-hidden border border-border shadow-2xl flex flex-col min-w-0">
                                        <div className="bg-card px-4 py-3 border-b border-border flex flex-wrap gap-3 justify-between items-center">
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                              Main.{currentComp.metadata?.language || 'js'}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Live Editor</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleRunCode(currentComp.id, currentComp.metadata?.language || 'javascript')}
                                            disabled={isExecuting[currentComp.id]}
                                            className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-muted-foreground px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
                                          >
                                            <Play className="w-4 h-4 fill-current" /> 
                                            {isExecuting[currentComp.id] ? 'Running...' : 'Run Code'}
                                          </button>
                                        </div>
                                        <div className="w-full">
                                          <Editor
                                            height="400px"
                                            language={currentComp.metadata?.language || 'javascript'}
                                            theme="vs-dark"
                                            value={componentResponses[currentComp.id]?.textValue || currentComp.metadata?.starterCode || ''}
                                            onChange={(value) => handleComponentChange(currentComp.id, value, 'textValue')}
                                            options={{
                                              minimap: { enabled: false },
                                              fontSize: 14,
                                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                              scrollBeyondLastLine: false,
                                              smoothScrolling: true,
                                              cursorBlinking: "smooth",
                                              cursorSmoothCaretAnimation: "on",
                                              formatOnPaste: true,
                                              wordWrap: "on"
                                            }}
                                          />
                                        </div>
                                        <div className="bg-[#1e1e1e] border-t border-border flex flex-col">
                                          <div className="bg-black/40 px-4 py-2 flex items-center justify-between border-b border-border">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terminal Output</span>
                                          </div>
                                          <div className="p-4 h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
                                            {executionOutput[currentComp.id] ? (
                                              <pre className={executionOutput[currentComp.id].startsWith('[Error]') || executionOutput[currentComp.id].startsWith('[Compile Error]') ? 'text-red-400 whitespace-pre-wrap' : 'text-muted-foreground whitespace-pre-wrap'}>
                                                {executionOutput[currentComp.id]}
                                              </pre>
                                            ) : (
                                              <span className="text-gray-600 italic">Klik 'Run Code' untuk melihat hasil eksekusi...</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })() : (
                              <p className="text-muted-foreground">Soal tidak ditemukan.</p>
                            )}
                          </div>

                          <div className="p-4 sm:p-6 border-t border-border bg-[#111] flex flex-wrap gap-4 items-center justify-between">
                            <button 
                              type="button"
                              disabled={examQuestionIdx === 0}
                              onClick={() => setExamQuestionIdx(Math.max(0, examQuestionIdx - 1))}
                              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-background border border-border text-foreground hover:bg-foreground/5 disabled:opacity-50 flex items-center gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" /> Sebelumnya
                            </button>
                            
                            <button 
                              type="button"
                              disabled={examQuestionIdx === (sections[activeSectionIndex]?.components?.length || 1) - 1}
                              onClick={() => setExamQuestionIdx(Math.min((sections[activeSectionIndex]?.components?.length || 1) - 1, examQuestionIdx + 1))}
                              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-600 text-black disabled:opacity-50 flex items-center gap-2"
                            >
                              Selanjutnya <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                          </div>
                        </div>

                        <div className="w-full xl:w-80 bg-card border border-border rounded-2xl p-6 flex flex-col shrink-0">
                          <h3 className="font-bold text-foreground mb-4">Navigasi Soal</h3>
                          <div className="grid grid-cols-5 xl:grid-cols-4 gap-2 overflow-y-auto custom-scrollbar flex-1 content-start">
                            {sections[activeSectionIndex]?.components?.map((comp: any, idx: number) => {
                              const isAnswered = !!componentResponses[comp.id]?.textValue || !!componentResponses[comp.id]?.fileUrl;
                              const isActive = examQuestionIdx === idx;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setExamQuestionIdx(idx)}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                                    isActive 
                                      ? 'bg-cyan-500 text-black border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
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
                          <div className="mt-6 pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/30"></div> Sudah Dijawab</div>
                            <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-background border border-border"></div> Belum Dijawab</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* NAVIGASI ANTAR SEKSI */}
                    {sections.length > 1 && (
                       <div className="flex justify-between items-center pt-6 mt-4">
                         <Button 
                           type="button" 
                           variant="secondary" 
                           onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))} 
                           disabled={activeSectionIndex === 0}
                           className="bg-background border-border"
                         >
                           <ArrowLeft className="w-4 h-4 mr-2" /> Seksi Sebelumnya
                         </Button>
                         <Button
                           type="button"
                           variant="secondary"
                           onClick={() => setActiveSectionIndex(Math.min(sections.length - 1, activeSectionIndex + 1))}
                           // Tombol maju ikut menghormati gerbang: tanpa ini
                           // kandidat bisa melewati tahap terkunci lewat
                           // navigasi, bukan lewat daftar tahap.
                           disabled={
                             activeSectionIndex === sections.length - 1 ||
                             (() => {
                               const next = sections[activeSectionIndex + 1];
                               const stage = next && stageBySection.get(next.id);
                               return !!stage && !stage.unlocked;
                             })()
                           }
                           className="bg-background border-border"
                         >
                           Seksi Selanjutnya <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                         </Button>
                       </div>
                    )}
                  </div>
                )}



                {/* Pada studi kasus bertahap, pengumpulan menutup satu tahap,
                    bukan seluruh studi kasus — labelnya harus mengatakan itu,
                    supaya kandidat tidak menahan pekerjaan karena takut
                    mengakhiri semuanya. */}
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  size="lg"
                  disabled={!isActiveStageRunning}
                  className="w-full shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold h-14 text-base mt-8"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {isStageGated && sections.length > 1
                    ? `Kumpulkan Tahap "${activeSection?.title ?? ''}"`
                    : 'Kirim Solusi untuk Dievaluasi AI & Rekruter'}
                </Button>
              </form>
            ) : currentStep === 'SUBMITTED' ? (
              <div className="space-y-6">
                <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">Status Kiriman: {latestSubmission.status}</h4>
                    <p className="text-xs text-muted-foreground">Dikirim pada {new Date(latestSubmission.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-extrabold text-emerald-400">{latestSubmission.finalScore || latestSubmission.aiScore}/100</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Skor Akhir</p>
                  </div>
                </div>

                {latestSubmission.notes && (
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cyan-400" /> Dokumen & Catatan Pengumpulan Solusi
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Catatan tambahan dan log pengawasan biometrik yang terlampir pada kiriman Anda.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotes(!showNotes)}
                        className="rounded-xl flex items-center gap-2 shrink-0 border-border text-foreground hover:bg-foreground/5 font-bold text-xs"
                      >
                        {showNotes ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Sembunyikan Catatan
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> Lihat Catatan & Dokumen
                          </>
                        )}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showNotes && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 border-t border-border overflow-hidden"
                        >
                          <div className="bg-background border border-border rounded-xl p-4 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {latestSubmission.notes}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1E7F4D]" /> Lembar Jawaban & Soal Lengkap
                    </h5>
                    <p className="text-xs text-muted-foreground">Buka tampilan soal untuk melihat riwayat jawaban pilihan ganda, essay, dan live coding yang telah Anda kirimkan.</p>
                  </div>
                  <Link href={`/workspace/${selectedEnrollment.id}/session`} className="shrink-0">
                    <Button className="bg-[#1E7F4D] hover:bg-[#196B40] text-white font-bold flex items-center justify-center gap-2 shrink-0 whitespace-nowrap px-6 py-3 shadow-sm rounded-xl">
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Lihat Jawaban Saya</span>
                    </Button>
                  </Link>
                </div>

                {(latestSubmission.repositoryUrl || latestSubmission.liveDemoUrl || latestSubmission.figmaUrl || latestSubmission.solutionFilesUrl) && (
                  <div className="bg-background border border-border rounded-2xl p-6 space-y-3 font-mono">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                      <ExternalLink className="h-4 w-4" /> Tautan Terlampir
                    </h5>
                    <ul className="text-xs space-y-2">
                      {latestSubmission.repositoryUrl && <li><a href={latestSubmission.repositoryUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-2"><GitBranch className="w-3 h-3"/> {latestSubmission.repositoryUrl}</a></li>}
                      {latestSubmission.liveDemoUrl && <li><a href={latestSubmission.liveDemoUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-2"><Globe className="w-3 h-3"/> {latestSubmission.liveDemoUrl}</a></li>}
                      {latestSubmission.figmaUrl && <li><a href={latestSubmission.figmaUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-2"><Layout className="w-3 h-3"/> {latestSubmission.figmaUrl}</a></li>}
                      {latestSubmission.solutionFilesUrl && <li><a href={latestSubmission.solutionFilesUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-2"><FileText className="w-3 h-3"/> {latestSubmission.solutionFilesUrl}</a></li>}
                    </ul>
                  </div>
                )}

                {latestSubmission.aiCorrectionSummary && (
                  <div className="bg-background border border-border rounded-2xl p-6 space-y-3">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="h-4 w-4" /> Rangkuman Koreksi Otomatis AI
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{latestSubmission.aiCorrectionSummary}</p>
                  </div>
                )}

                {latestSubmission.reviewerFeedback && (
                  <div className="bg-background border border-border rounded-2xl p-6 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="h-4 w-4" /> Ulasan Final Rekruter
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{latestSubmission.reviewerFeedback}</p>
                  </div>
                )}

                {latestSubmission.weaknessTags && latestSubmission.weaknessTags.length > 0 && (
                  <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="h-4 w-4" /> Rekomendasi Pembelajaran (Career Path)
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      Berdasarkan evaluasi AI, Anda disarankan untuk memperdalam pemahaman pada topik berikut sebelum mengambil tantangan serupa:
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {latestSubmission.weaknessTags.map((tag: string, i: number) => {
                        const rec = getLearningRecommendation(tag);
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border/60 bg-foreground/5 rounded-xl gap-3">
                            <div>
                              <p className="text-sm font-bold text-foreground">{rec.tag}</p>
                              <p className="text-[10px] text-muted-foreground">Platform yang disarankan: <span className="font-semibold text-foreground/80">{rec.platform}</span></p>
                            </div>
                            <a 
                              href={rec.urlTemplate} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2"
                            >
                              Mulai Belajar <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
