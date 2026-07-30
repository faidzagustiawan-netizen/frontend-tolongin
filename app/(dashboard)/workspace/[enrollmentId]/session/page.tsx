'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '@/services/submissions.service';
import { verificationService } from '@/services/verification.service';
import { pistonService } from '@/services/piston.service';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Input';
import { FileUploader } from '@/components/workspace/FileUploader';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, CheckCircle2, AlertCircle, GitBranch, Layout, Globe, Send, Timer, Lock, FileText,
  ShieldCheck, Camera, AlertTriangle, ArrowLeft, ExternalLink, Play, Clock, UserCheck, Layers, Code2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ContinuousProctoring } from '@/components/workspace/ContinuousProctoring';
import { useStageGate, StageExpiryWatcher } from '@/hooks/useStageGate';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-background text-muted-foreground animate-pulse text-xs font-mono">
      Memuat IDE Eksternal...
    </div>
  ),
});

export default function ExamSessionPage() {
  const { user, loadUserFromStorage } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const selectedEnrollmentId = params.enrollmentId as string;

  // Answer States
  const [solutionFilesUrl, setSolutionFilesUrl] = useState<string>('');
  const [repositoryUrl, setRepositoryUrl] = useState<string>('');
  const [figmaUrl, setFigmaUrl] = useState<string>('');
  const [liveDemoUrl, setLiveDemoUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [componentResponses, setComponentResponses] = useState<Record<string, any>>({});

  // Submission & Timer States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [timeLeftString, setTimeLeftString] = useState<string>('--:--:--');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Auto-Save States
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState<boolean>(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Coding Execution States
  const [executionOutput, setExecutionOutput] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  // Stage & Question Navigation States
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [examQuestionIdx, setExamQuestionIdx] = useState(0);
  const [completedSectionIndices, setCompletedSectionIndices] = useState<number[]>([]);
  const [showStageConfirmModal, setShowStageConfirmModal] = useState<boolean>(false);
  const [isBetweenStages, setIsBetweenStages] = useState<boolean>(false);

  // Proctoring States
  const [proctoringEvents, setProctoringEvents] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  useEffect(() => {
    setExamQuestionIdx(0);
  }, [activeSectionIndex]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Query Enrollment Data
  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user,
  });

  const enrollments = talentData?.data || [];
  const selectedEnrollment = enrollments.find((e: any) => e.id === selectedEnrollmentId);

  const submissions = selectedEnrollment?.submissions || [];
  const latestSubmission = submissions[submissions.length - 1];

  // Keadaan tahap menurut server: terbuka atau tidak, alasannya, dan sisa
  // waktunya. Dipanggil di sini — sebelum apa pun yang membacanya — karena hook
  // tidak boleh berada sesudah `return` awal untuk keadaan memuat.
  const stageGate = useStageGate(selectedEnrollmentId, {
    enabled: !!selectedEnrollmentId && !!user,
  });
  const isStageGated = stageGate.stages.length > 0;

  /**
   * Apakah seluruh pengerjaan sudah selesai.
   *
   * Bukan sekadar "ada submisi": pada pengerjaan bertahap, submisi pertama masuk
   * setelah tahap pertama, dan memperlakukan itu sebagai selesai membuat seluruh
   * tahap sesudahnya hanya-baca — kandidat tidak bisa mengisi apa pun lagi.
   * Karena itu yang dihitung adalah tidak adanya tahap yang masih bisa
   * dikerjakan.
   */
  const isSubmitted = isStageGated
    ? stageGate.stages.every((s) =>
        ['SUBMITTED', 'AWAITING_GRADE', 'PASSED', 'FAILED', 'EXPIRED'].includes(
          s.status,
        ),
      )
    : submissions.length > 0;

  const isProctored = selectedEnrollment?.challenge?.gradingRubric?.requireProctoring ?? true;
  const proctoringSettings =
    selectedEnrollment?.challenge?.proctoringSettings ||
    selectedEnrollment?.challenge?.gradingRubric?.proctoringSettings ||
    {};
  const trackTabSwitches = proctoringSettings.trackTabSwitches ?? isProctored;
  const maxTabSwitches = proctoringSettings.maxTabSwitches || 0;
  const blockCopyPaste = proctoringSettings.blockCopyPaste || false;
  const blockRightClick = proctoringSettings.blockRightClick || false;
  const enforceFullscreen = proctoringSettings.enforceFullscreen || false;
  const continuousTracking = proctoringSettings.continuousTracking || false;

  const rawSections = selectedEnrollment?.challenge?.sections || [];
  const rawComponents = selectedEnrollment?.challenge?.components || [];
  const sections = rawSections.length > 0
    ? rawSections
    : (rawComponents.length > 0 ? [{ id: 'default', title: 'Seksi Ujian', components: rawComponents }] : []);

  const stageBySection = new Map(stageGate.stages.map((s) => [s.sectionId, s]));

  /**
   * Apakah satu tahap boleh dibuka kandidat ini.
   *
   * Jawaban server didahulukan. Aturan lama — "tahap sebelumnya sudah ditandai
   * selesai" — hanya berlaku bila tidak ada keadaan tahap sama sekali; aturan itu
   * seluruhnya hidup di peramban dan karena itu tidak mengikat siapa pun.
   */
  const isSectionUnlocked = (sectionIdx: number) => {
    const stage = stageBySection.get(sections[sectionIdx]?.id);
    if (stage) return stage.unlocked;

    if (isSubmitted) return true;
    if (sectionIdx === 0) return true;
    return completedSectionIndices.includes(sectionIdx - 1);
  };

  const activeStage = stageBySection.get(sections[activeSectionIndex]?.id);

  /**
   * Tahap ini masih menunggu kandidat menekan "Mulai".
   *
   * Bukan hanya berlaku di antara dua tahap: saat halaman ujian pertama kali
   * dibuka pun jam belum berjalan. Tanpa penjaga ini soal tampil lebih awal, dan
   * kandidat bisa membaca serta menyiapkan jawaban sebelum waktunya dihitung —
   * batas waktu jadi tidak berarti apa-apa.
   */
  const needsStageStart =
    isStageGated &&
    !!activeStage &&
    activeStage.status !== 'IN_PROGRESS' &&
    !isSubmitted;

  /** Sisa waktu tahap aktif sebagai HH:MM:SS, atau null bila tak berbatas. */
  const stageTimeLeft = (() => {
    if (stageGate.remainingSeconds === null) return null;
    const total = stageGate.remainingSeconds;
    return [
      Math.floor(total / 3600),
      Math.floor((total % 3600) / 60),
      total % 60,
    ]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  })();

  // Prevent Navigation & Refresh while in active exam
  useEffect(() => {
    if (!isSubmitted && !isSubmitting && !submitSuccess && !isExpired) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isSubmitted, isSubmitting, submitSuccess, isExpired]);

  // Redirect if enrollment not found
  useEffect(() => {
    if (!isTalentLoading && !selectedEnrollment) {
      router.push('/');
    }
  }, [isTalentLoading, selectedEnrollment, router]);

  // Hydration Data (Draft or Submitted Solutions)
  useEffect(() => {
    if (selectedEnrollment && !isHydrated) {
      if (isSubmitted && latestSubmission) {
        const respMap: Record<string, any> = {};
        if (latestSubmission.componentResponses) {
          latestSubmission.componentResponses.forEach((res: any) => {
            respMap[res.componentId] = {
              componentId: res.componentId,
              textValue: res.textValue,
              fileUrl: res.fileUrl,
            };
          });
        }
        setComponentResponses(respMap);
        if (latestSubmission.repositoryUrl) setRepositoryUrl(latestSubmission.repositoryUrl);
        if (latestSubmission.liveDemoUrl) setLiveDemoUrl(latestSubmission.liveDemoUrl);
        if (latestSubmission.figmaUrl) setFigmaUrl(latestSubmission.figmaUrl);
        if (latestSubmission.solutionFilesUrl) setSolutionFilesUrl(latestSubmission.solutionFilesUrl);
        if (latestSubmission.notes) setNotes(latestSubmission.notes);
      } else if (selectedEnrollment.draftData) {
        const draft = selectedEnrollment.draftData;
        setComponentResponses(draft.componentResponses || {});
        setCustomInputs(draft.customInputs || {});
        setNotes(draft.notes || '');
        setTabSwitchCount(draft.tabSwitchCount || 0);
        setProctoringEvents(draft.proctoringEvents || []);
        setIsLockedOut(!!draft.isLockedOut);
        if (Array.isArray(draft.completedSectionIndices)) {
          setCompletedSectionIndices(draft.completedSectionIndices);
        }
      }
      setIsHydrated(true);
    }
  }, [selectedEnrollment, isSubmitted, latestSubmission, isHydrated]);

  // Draft payload ref for saving on unmount
  const draftPayloadRef = useRef<Record<string, unknown>>({});
  useEffect(() => {
    draftPayloadRef.current = {
      componentResponses,
      customInputs,
      notes,
      tabSwitchCount,
      proctoringEvents,
      isLockedOut,
      completedSectionIndices,
    };
  }, [componentResponses, customInputs, notes, tabSwitchCount, proctoringEvents, isLockedOut, completedSectionIndices]);

  const flushDraft = useCallback(async () => {
    if (isSubmitted || !isHydrated || !selectedEnrollmentId) return;
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    try {
      setIsSavingDraft(true);
      await submissionsService.saveDraft(selectedEnrollmentId, draftPayloadRef.current as any);
      setLastDraftSavedAt(new Date());
    } catch (err) {
      console.error('Gagal menyimpan draf:', err);
    } finally {
      setIsSavingDraft(false);
    }
  }, [isSubmitted, isHydrated, selectedEnrollmentId]);

  // Debounced Auto-Save (Server-Side)
  useEffect(() => {
    if (isSubmitted || !isHydrated || isExpired) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
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
          completedSectionIndices,
        });
        setLastDraftSavedAt(new Date());
        setHasUnsavedDraft(false);
      } catch (err) {
        console.error('Gagal auto-save:', err);
      } finally {
        setIsSavingDraft(false);
      }
    }, 3000);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [componentResponses, customInputs, notes, tabSwitchCount, proctoringEvents, isLockedOut, completedSectionIndices, isHydrated, isExpired, selectedEnrollmentId, isSubmitted]);

  // Save draft on unmount
  useEffect(() => {
    return () => {
      if (!isSubmitted && draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
        void submissionsService.saveDraft(selectedEnrollmentId, draftPayloadRef.current as any).catch(() => undefined);
      }
    };
  }, [selectedEnrollmentId, isSubmitted]);

  // LMS Timer
  useEffect(() => {
    if (!selectedEnrollment || isSubmitted) return;
    const startedAtMs = new Date(selectedEnrollment.startedAt).getTime();
    const durationHours = selectedEnrollment.challenge?.gradingRubric?.durationHours || 72;
    const expiresAtMs = startedAtMs + durationHours * 3600 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAtMs - now;
      if (diff <= 0) {
        setIsExpired((wasExpired) => {
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
  }, [selectedEnrollment, flushDraft, isSubmitted]);

  // Tab Switching Listener (Proctoring) — PAUSED DURING INTER-STAGE BREAK
  useEffect(() => {
    if (!selectedEnrollment || !trackTabSwitches || isExpired || isSubmitted || isBetweenStages) return;

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
            setProctoringEvents((list) => [...list, `[${timestamp}] Berpindah tab / aplikasi eksternal (Ke-${newCount})`]);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedEnrollment, trackTabSwitches, isExpired, maxTabSwitches, isSubmitted, isBetweenStages]);

  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen API blocked or unsupported.", err);
    }
  };

  /**
   * Menutup tahap yang sedang dikerjakan.
   *
   * Dulu ini hanya menandai tahap sebagai selesai di draf dan berpindah — tidak
   * ada apa pun yang dikumpulkan sampai tombol terakhir ditekan. Akibatnya tidak
   * ada nilai per tahap, jadi tidak ada angka untuk dibandingkan dengan ambang
   * lolos. Kini jawabannya benar-benar dikumpulkan per tahap.
   */
  const handleConfirmCompleteStage = async () => {
    const nextSectionIdx = activeSectionIndex + 1;
    const newCompleted = Array.from(new Set([...completedSectionIndices, activeSectionIndex]));
    setShowStageConfirmModal(false);
    setSubmitError(null);

    if (isStageGated) {
      const submitted = await submitStage();
      if (!submitted) return;
    } else {
      try {
        await submissionsService.saveDraft(selectedEnrollmentId, {
          ...draftPayloadRef.current,
          completedSectionIndices: newCompleted,
        } as any);
      } catch (err) {
        console.error('Gagal menyimpan draf status tahap:', err);
      }
    }

    setCompletedSectionIndices(newCompleted);
    setActiveSectionIndex(nextSectionIdx);
    setExamQuestionIdx(0);
    setIsBetweenStages(true);
  };

  /**
   * Memulai tahap berikutnya.
   *
   * Pada studi kasus bertahap, ini juga saat jam mulai berjalan — dicap server
   * atas kehendak kandidat, bukan saat halaman termuat.
   */
  const handleStartNextStage = async () => {
    const nextStage = stageBySection.get(sections[activeSectionIndex]?.id);

    if (nextStage && nextStage.status !== 'IN_PROGRESS') {
      await stageGate.startStage(nextStage.sectionId);
      // Gerbang bisa menolak — misalnya nilai tahap sebelumnya belum keluar.
      // Dalam hal itu layar antara dibiarkan terbuka beserta alasannya.
      if (stageGate.error) return;
    }

    setIsBetweenStages(false);
    if (enforceFullscreen) {
      handleEnterFullscreen();
    }
  };

  const handleComponentChange = (componentId: string, value: any, field: 'textValue' | 'fileUrl') => {
    if (isSubmitted) return;
    setComponentResponses((prev) => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        componentId,
        [field]: value,
      },
    }));
  };

  const handleRunCode = async (componentId: string, language: string) => {
    setIsExecuting((prev) => ({ ...prev, [componentId]: true }));
    setExecutionOutput((prev) => ({ ...prev, [componentId]: 'Executing...' }));
    try {
      const code = componentResponses[componentId]?.textValue || '';
      const output = await pistonService.execute(language, code);
      setExecutionOutput((prev) => ({ ...prev, [componentId]: output }));
    } catch (err: any) {
      setExecutionOutput((prev) => ({ ...prev, [componentId]: `[Error]\n${err.message}` }));
    } finally {
      setIsExecuting((prev) => ({ ...prev, [componentId]: false }));
    }
  };

  /**
   * Menyusun catatan pengumpulan: keluaran khusus yang diminta perusahaan
   * ditambah jejak pengawasan. Dipakai bersama oleh pengumpulan per tahap dan
   * pengumpulan akhir supaya keduanya tidak pernah berbeda isinya.
   */
  const buildSubmissionNotes = () => {
    let proctoringNotes = '';
    if (isProctored) {
      proctoringNotes = `\n\n### 🔒 Log Pengawasan Ujian (Browser Proctoring)\n- **Total Perpindahan Tab**: ${tabSwitchCount} kali\n- **Riwayat Log**:\n${proctoringEvents.length > 0 ? proctoringEvents.map((ev) => `  * ${ev}`).join('\n') : '  * Tidak ada perpindahan mencurigakan'}`;
    }

    let combinedNotes = notes;
    const customOutputs: Array<{ id: string; label: string }> =
      selectedEnrollment?.challenge?.gradingRubric?.customOutputs || [];

    if (customOutputs.length > 0) {
      const customNotes = customOutputs
        .map((out) => `### [${out.label}]\n${customInputs[out.id] || 'Tidak diserahkan'}`)
        .join('\n\n');
      combinedNotes = `${notes ? notes + '\n\n' : ''}## Custom Deliverables\n${customNotes}`;
    }

    return combinedNotes + proctoringNotes;
  };

  /**
   * Mengumpulkan tahap yang sedang dikerjakan.
   *
   * Mengembalikan `true` bila berhasil. Kegagalan tidak boleh membuat kandidat
   * berpindah tahap: jawabannya belum tercatat di server, dan tahap ini tidak
   * bisa dibuka ulang.
   */
  const submitStage = async (): Promise<boolean> => {
    const sectionId = sections[activeSectionIndex]?.id;
    if (!selectedEnrollment || !sectionId) return false;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submissionsService.submitSolution({
        enrollmentId: selectedEnrollment.id,
        sectionId,
        solutionFilesUrl,
        repositoryUrl,
        figmaUrl,
        liveDemoUrl,
        notes: buildSubmissionNotes(),
        responses: Object.values(componentResponses),
      });

      await stageGate.refresh();
      return true;
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          'Gagal mengumpulkan tahap ini. Silakan periksa koneksi Anda.',
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSolution = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedEnrollment || isExpired) return;
    // Pada studi kasus bertahap, `isSubmitted` menjadi benar begitu tahap
    // pertama masuk — memakainya sebagai penjaga akan menghalangi pengumpulan
    // tahap-tahap sesudahnya.
    if (!isStageGated && isSubmitted) return;

    // Tahap terakhir tetap dikumpulkan sebagai tahap, bukan sebagai pengumpulan
    // menyeluruh: nilainya dibutuhkan per tahap, dan backend yang menyatakan
    // pendaftaran selesai setelah tidak ada tahap tersisa.
    if (isStageGated) {
      const ok = await submitStage();
      if (!ok) return;

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/workspace/${selectedEnrollment.id}`);
      }, 2000);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await submissionsService.submitSolution({
        enrollmentId: selectedEnrollment.id,
        solutionFilesUrl,
        repositoryUrl,
        figmaUrl,
        liveDemoUrl,
        notes: buildSubmissionNotes(),
        responses: Object.values(componentResponses),
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/workspace/${selectedEnrollment.id}`);
      }, 2000);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          'Gagal mengirimkan solusi. Silakan periksa koneksi Anda.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTalentLoading || !selectedEnrollment) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-foreground/5 rounded-xl w-1/3" />
        <div className="h-96 bg-foreground/5 rounded-xl w-full" />
      </div>
    );
  }

  const currentSection = sections[activeSectionIndex] || sections[0];
  const componentsList = currentSection?.components || [];
  const currentComp = componentsList[examQuestionIdx];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-[var(--font-plus-jakarta)]">
      {/* Waktu tahap habis: jawaban yang sudah tersimpan dikumpulkan alih-alih
          hilang bersama waktunya. Server tetap yang memutuskan menerima atau
          menolak — hitungan di layar hanya tampilan. */}
      <StageExpiryWatcher
        expiredSectionId={stageGate.expiredSectionId}
        onExpire={() => void handleSubmitSolution()}
      />

      {/* CONTINUOUS PROCTORING COMPONENT — PAUSED IN INTER-STAGE BREAK */}
      {continuousTracking && !isExpired && !isSubmitted && !isBetweenStages && (
        <ContinuousProctoring
          onViolation={(msg) => {
            const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setProctoringEvents((list) => [...list, `[${timestamp}] ${msg}`]);
          }}
        />
      )}

      {/* WARNING MODALS */}
      <AnimatePresence>
        {showTabWarning && !isLockedOut && !isSubmitted && !isBetweenStages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-card border border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Pelanggaran Terdeteksi!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sistem mendeteksi Anda telah meninggalkan halaman ujian (pindah aplikasi/tab). Tindakan ini telah dicatat dalam laporan pengawasan rekruter.
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
                Saya Mengerti, Kembali ke Soal
              </Button>
            </div>
          </motion.div>
        )}

        {isLockedOut && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-card border-2 border-red-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <Lock className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Akses Ujian Dikunci!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anda telah melanggar batas maksimal perpindahan tab/aplikasi ({maxTabSwitches} kali). Ujian ini dikunci secara otomatis.
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/workspace/${selectedEnrollmentId}`)}
                className="w-full bg-foreground text-background font-bold h-12"
              >
                Kembali ke Overview Workspace
              </Button>
            </div>
          </motion.div>
        )}

        {/* STAGE COMPLETION CONFIRMATION MODAL */}
        {showStageConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-[#1E7F4D]/20 rounded-full flex items-center justify-center mx-auto text-[#1E7F4D] dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Selesaikan {sections[activeSectionIndex]?.title || `Tahap ${activeSectionIndex + 1}`}?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Apakah Anda yakin telah selesai menjawab seluruh soal pada tahap ini dan ingin mengunci jawaban untuk melanjutkan ke tahap berikutnya?
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStageConfirmModal(false)}
                  className="flex-1"
                >
                  Periksa Kembali
                </Button>
                <Button
                  onClick={handleConfirmCompleteStage}
                  className="flex-1 bg-[#1E7F4D] hover:bg-[#196B40] text-white font-bold"
                >
                  Ya, Selesaikan Tahap
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER BAR */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/workspace/${selectedEnrollmentId}`}>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" /> Keluar dari Sesi
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight line-clamp-1">
              {selectedEnrollment.challenge?.title}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Sesi Pengerjaan Soal Pilihan & Studi Kasus</p>
          </div>
        </div>

        {/* TIMER & AUTO-SAVE BADGES */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {isSubmitted ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E7F4D]/10 border border-[#1E7F4D]/30 text-[#1E7F4D] dark:text-emerald-400 font-bold text-xs shadow-sm">
              <Eye className="w-4 h-4" /> Mode Lihat Jawaban (Read-Only)
            </div>
          ) : (
            <>
              {/* Draft Auto-Save Status */}
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 bg-background border border-border rounded-xl">
                {isSavingDraft ? (
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 animate-spin-slow" /> Menyimpan...
                  </span>
                ) : hasUnsavedDraft ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Ada Draf Belum Tersimpan
                  </span>
                ) : lastDraftSavedAt ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Draf Tersimpan{' '}
                    {lastDraftSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Draf Tersinkron
                  </span>
                )}
              </div>

              {/* Batas waktu tahap. Angkanya berasal dari sisa waktu yang
                  dilaporkan server, bukan dari `timeLimit` dikali di peramban:
                  jam peramban bisa digeser, dan menutup tab tidak boleh
                  menghentikan hitungan. */}
              {stageTimeLeft && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm font-mono text-xs font-bold ${
                    (stageGate.remainingSeconds ?? 0) < 60
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                      : 'bg-background border-border text-cyan-400'
                  }`}
                  title="Sisa waktu tahap ini"
                >
                  <Timer className="h-4 w-4" />
                  <span>{stageTimeLeft}</span>
                </div>
              )}

              {/* Countdown Timer — batas keseluruhan challenge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm font-mono text-xs font-bold ${
                isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-background border-border text-emerald-400'
              }`}>
                <Timer className="h-4 w-4" />
                <span>{timeLeftString}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MAIN EXAM BODY: SPLIT LAYOUT */}
      <form 
        onSubmit={handleSubmitSolution} 
        className="flex flex-col lg:flex-row items-start gap-8 w-full"
        onCopy={blockCopyPaste && !isSubmitted && !isBetweenStages ? (e) => e.preventDefault() : undefined}
        onPaste={blockCopyPaste && !isSubmitted && !isBetweenStages ? (e) => e.preventDefault() : undefined}
        onCut={blockCopyPaste && !isSubmitted && !isBetweenStages ? (e) => e.preventDefault() : undefined}
        onContextMenu={blockRightClick && !isSubmitted && !isBetweenStages ? (e) => e.preventDefault() : undefined}
      >
        {/* LEFT COLUMN: STICKY QUESTION NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-1/4 xl:w-1/5 shrink-0 space-y-6 lg:sticky lg:top-24 self-start">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="font-bold text-foreground text-base mb-1">Navigasi Soal Ujian</h3>
              <p className="text-xs text-muted-foreground">Pilih nomor soal untuk mulai menjawab.</p>
            </div>

            {/* SECTION / STAGE SELECTOR */}
            {sections.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Pilih Seksi / Tahap</label>
                <div className="space-y-1.5">
                  {sections.map((sec: any, idx: number) => {
                    const unlocked = isSectionUnlocked(idx);
                    const isDone = completedSectionIndices.includes(idx);
                    const isCurrent = activeSectionIndex === idx;

                    return (
                      <button
                        key={sec.id || idx}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          if (unlocked) {
                            setActiveSectionIndex(idx);
                            setExamQuestionIdx(0);
                          }
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between gap-2 ${
                          isCurrent 
                            ? 'bg-[#1E7F4D] text-white border-[#1E7F4D] shadow-sm'
                            : unlocked
                              ? 'bg-background border-border text-foreground hover:bg-foreground/5'
                              : 'bg-background/40 border-border/50 text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      >
                        <span className="truncate">
                          {idx + 1}. {sec.title}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUESTION NUMBER GRID */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Daftar Nomor Soal</label>
              <div className="grid grid-cols-5 gap-2 content-start">
                {componentsList.map((comp: any, idx: number) => {
                  const isAnswered = !!componentResponses[comp.id]?.textValue || !!componentResponses[comp.id]?.fileUrl;
                  const isActive = examQuestionIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setExamQuestionIdx(idx)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        isActive 
                          ? 'bg-[#1E7F4D] text-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/30' 
                          : isAnswered 
                            ? 'bg-[#1E7F4D]/20 border border-[#1E7F4D]/40 text-[#1E7F4D] dark:text-emerald-400 font-extrabold' 
                            : 'bg-background border border-border text-muted-foreground hover:bg-foreground/5'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LEGEND */}
            <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded bg-[#1E7F4D]/20 border border-[#1E7F4D]/40 shrink-0" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded bg-background border border-border shrink-0" />
                <span>Belum Dijawab</span>
              </div>
            </div>

            {/* PROCTORING STATS BADGE */}
            {isProctored && (
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Log Tab Switch: <strong className="text-foreground">{tabSwitchCount}x</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN QUESTION DISPLAY & INPUT AREA */}
        <div className="w-full lg:w-3/4 xl:w-4/5 flex-1 min-w-0 space-y-6">
          {submitSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4 text-emerald-400 shadow-lg">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-bold text-sm">Solusi Berhasil Dikirim!</p>
                <p>Mengarahkan kembali ke dashboard workspace...</p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400 shadow-lg">
              <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{submitError}</p>
            </div>
          )}

          {/* INTER-STAGE BREAK BANNER — juga layar pembuka setiap tahap, karena
              jam baru berjalan setelah kandidat menekan tombolnya sendiri. */}
          {isBetweenStages || needsStageStart ? (
            <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                {activeSectionIndex > 0 ? <CheckCircle2 className="w-10 h-10" /> : <Play className="w-10 h-10" />}
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                {activeSectionIndex > 0 && (
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">Tahap {activeSectionIndex} Berhasil Diselesaikan</span>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {activeSectionIndex > 0
                    ? `Siap Melanjutkan ke ${currentSection?.title || `Tahap ${activeSectionIndex + 1}`}?`
                    : `Siap Mengerjakan ${currentSection?.title || 'Tahap 1'}?`}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activeSectionIndex > 0
                    ? 'Jawaban Anda pada tahap sebelumnya telah tersimpan dengan aman. Keamanan dan pengawasan (proctoring) sedang diistirahatkan sementara.'
                    : 'Waktu pengerjaan baru mulai dihitung setelah Anda menekan tombol di bawah.'}
                </p>
              </div>
              <div className="bg-background border border-border rounded-2xl p-4 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed flex items-center gap-3 text-left">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>Pengawasan keamanan akan diaktifkan kembali secara otomatis begitu Anda menekan tombol di bawah.</span>
              </div>

              {/* Tahap berikutnya bisa saja belum terbuka — nilai tahap
                  sebelumnya belum keluar, atau ambangnya tidak tercapai. Alasan
                  dari server ditampilkan utuh karena memuat angka yang perlu
                  dibaca kandidat. */}
              {activeStage && !activeStage.unlocked ? (
                <div className="max-w-md mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-left flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-amber-500 mb-1">Tahap Belum Terbuka</p>
                    <p className="text-sm text-foreground">
                      {activeStage.lockReason ??
                        'Tahap ini belum bisa dikerjakan untuk saat ini.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {activeStage?.timeLimit && (
                    <p className="text-xs text-muted-foreground">
                      Waktu pengerjaan {activeStage.timeLimit} menit, dihitung sejak
                      Anda menekan tombol di bawah.
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={() => void handleStartNextStage()}
                    size="lg"
                    className="bg-[#1E7F4D] hover:bg-[#196B40] text-white font-bold h-14 px-8 text-sm rounded-2xl shadow-xl hover:scale-105 transition-all"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Mulai Kerjakan {currentSection?.title || `Tahap ${activeSectionIndex + 1}`} Sekarang
                  </Button>
                </>
              )}

              {stageGate.error && (
                <p className="text-xs text-red-400 max-w-md mx-auto">{stageGate.error}</p>
              )}
            </div>
          ) : (
            /* ACTIVE QUESTION PANEL */
            <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
                <div>
                  <span className="text-xs font-bold text-[#1E7F4D] uppercase tracking-wider block mb-0.5">
                    {currentSection?.title || 'Seksi Ujian'}
                  </span>
                  <h2 className="font-bold text-xl text-foreground">Soal Nomor {examQuestionIdx + 1}</h2>
                </div>
                {currentComp?.points && (
                  <span className="text-xs bg-[#1E7F4D]/10 border border-[#1E7F4D]/30 px-3.5 py-1.5 rounded-full text-[#1E7F4D] font-bold shadow-sm">
                    {currentComp.points} Poin
                  </span>
                )}
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {currentComp ? (
                  <div className="space-y-6">
                    {/* QUESTION INSTRUCTION */}
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                        {currentComp.question}
                      </p>
                      {currentComp.description && (
                        <div className="text-sm text-muted-foreground bg-background p-4 rounded-2xl border border-border leading-relaxed">
                          {currentComp.description}
                        </div>
                      )}
                    </div>

                    {/* INPUT TYPES */}
                    <div className="pt-2">
                      {currentComp.type === 'MULTIPLE_CHOICE' && currentComp.options && (
                        <div className="space-y-3">
                          {(currentComp.options || []).map((opt: any, optIdx: number) => (
                            <label 
                              key={optIdx} 
                              className={`flex items-start gap-4 p-4 rounded-2xl border ${isSubmitted ? 'cursor-default' : 'cursor-pointer'} transition-all ${
                                componentResponses[currentComp.id]?.textValue === opt.id 
                                  ? 'bg-[#1E7F4D]/10 border-[#1E7F4D] text-foreground font-semibold shadow-sm' 
                                  : 'bg-background border-border text-muted-foreground hover:border-foreground/20'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name={`q-${examQuestionIdx}`} 
                                disabled={isSubmitted}
                                className="mt-1 w-4 h-4 text-[#1E7F4D] focus:ring-[#1E7F4D]" 
                                checked={componentResponses[currentComp.id]?.textValue === opt.id}
                                onChange={() => handleComponentChange(currentComp.id, opt.id, 'textValue')}
                              />
                              <span className="flex-1 text-sm">{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {currentComp.type === 'ESSAY' && (
                        <Textarea
                          placeholder={isSubmitted ? "Tidak ada jawaban tertulis." : "Ketik jawaban penjelasan Anda di sini..."}
                          value={componentResponses[currentComp.id]?.textValue || ''}
                          onChange={(e) => handleComponentChange(currentComp.id, e.target.value, 'textValue')}
                          readOnly={isSubmitted}
                          rows={8}
                          className="bg-background"
                        />
                      )}

                      {currentComp.type === 'URL_SUBMISSION' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Masukkan Tautan (URL)</label>
                          <input 
                            type="url" 
                            readOnly={isSubmitted}
                            value={componentResponses[currentComp.id]?.textValue || ''}
                            onChange={(e) => handleComponentChange(currentComp.id, e.target.value, 'textValue')}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[#1E7F4D]"
                            placeholder="https://github.com/username/repository"
                          />
                        </div>
                      )}

                      {currentComp.type === 'FILE_UPLOAD' && (
                        <div className="bg-background p-6 rounded-2xl border border-border space-y-4">
                          {!isSubmitted && (
                            <FileUploader
                              onUploadComplete={(url) => handleComponentChange(currentComp.id, url, 'fileUrl')}
                              maxSizeMB={25}
                            />
                          )}
                          {componentResponses[currentComp.id]?.fileUrl ? (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                              <span className="text-emerald-400 text-xs font-medium truncate pr-4">Berkas terunggah</span>
                              <a href={componentResponses[currentComp.id].fileUrl} target="_blank" rel="noreferrer" className="text-xs bg-[#1E7F4D] text-white px-3 py-1.5 rounded-lg font-bold">Lihat Berkas</a>
                            </div>
                          ) : isSubmitted ? (
                            <p className="text-xs text-muted-foreground italic">Tidak ada berkas yang diunggah.</p>
                          ) : null}
                        </div>
                      )}

                      {currentComp.type === 'LIVE_CODING' && (
                        <div className="rounded-2xl overflow-hidden border border-border shadow-xl flex flex-col">
                          <div className="bg-card px-4 py-3 border-b border-border flex flex-wrap gap-3 justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-[#1E7F4D]" />
                              <span className="text-xs font-mono text-foreground font-bold">
                                Main.{currentComp.metadata?.language || 'js'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRunCode(currentComp.id, currentComp.metadata?.language || 'javascript')}
                              disabled={isExecuting[currentComp.id]}
                              className="flex items-center gap-2 text-xs font-bold text-white bg-[#1E7F4D] hover:bg-[#196B40] disabled:opacity-50 px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> 
                              {isExecuting[currentComp.id] ? 'Running...' : 'Run Code'}
                            </button>
                          </div>
                          <div className="w-full">
                            <Editor
                              height="380px"
                              language={currentComp.metadata?.language || 'javascript'}
                              theme="vs-dark"
                              value={componentResponses[currentComp.id]?.textValue || currentComp.metadata?.starterCode || ''}
                              onChange={(value) => handleComponentChange(currentComp.id, value, 'textValue')}
                              options={{
                                readOnly: isSubmitted,
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', monospace",
                                wordWrap: "on"
                              }}
                            />
                          </div>
                          <div className="bg-[#18181b] border-t border-border flex flex-col">
                            <div className="px-4 py-2 bg-black/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Output Terminal
                            </div>
                            <div className="p-4 h-28 overflow-y-auto font-mono text-xs text-muted-foreground">
                              {executionOutput[currentComp.id] ? (
                                <pre className="whitespace-pre-wrap">{executionOutput[currentComp.id]}</pre>
                              ) : (
                                <span className="text-gray-500 italic">Tekan 'Run Code' untuk menguji program...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Soal tidak ditemukan.</p>
                )}
              </div>

              {/* PREVIOUS / NEXT / STAGE COMPLETE QUESTION FOOTER */}
              <div className="p-4 sm:p-6 border-t border-border bg-card flex items-center justify-between gap-4">
                {examQuestionIdx > 0 ? (
                  <button 
                    type="button"
                    onClick={() => setExamQuestionIdx(Math.max(0, examQuestionIdx - 1))}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-background border border-border text-foreground hover:bg-foreground/5 flex items-center gap-2 shadow-sm transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Soal Sebelumnya
                  </button>
                ) : <div />}
                
                {examQuestionIdx < componentsList.length - 1 ? (
                  <button 
                    type="button"
                    onClick={() => setExamQuestionIdx(Math.min(componentsList.length - 1, examQuestionIdx + 1))}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#1E7F4D] hover:bg-[#196B40] text-white flex items-center gap-2 shadow-sm transition-all"
                  >
                    Soal Selanjutnya <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                ) : activeSectionIndex < sections.length - 1 && !isSubmitted ? (
                  <button
                    type="button"
                    onClick={() => setShowStageConfirmModal(true)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#1E7F4D] hover:bg-[#196B40] text-white flex items-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Selesaikan {sections[activeSectionIndex]?.title || `Tahap ${activeSectionIndex + 1}`} & Lanjut
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* FINAL SUBMIT BUTTON / SUBMITTED STATUS — SHOWN ONLY ON FINAL STAGE OR SUBMITTED MODE */}
          {(isSubmitted || activeSectionIndex === sections.length - 1) && !isBetweenStages && (
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
              <h3 className="font-bold text-foreground text-lg border-b border-border pb-4">
                Pengumpulan Solusi Akhir
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">URL Repositori GitHub (Opsional)</label>
                  <input 
                    type="url"
                    readOnly={isSubmitted}
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#1E7F4D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">URL Live Demo (Opsional)</label>
                  <input 
                    type="url"
                    readOnly={isSubmitted}
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://my-demo-app.vercel.app"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#1E7F4D]"
                  />
                </div>
              </div>

              {isSubmitted ? (
                <div className="bg-[#1E7F4D]/10 border border-[#1E7F4D]/30 rounded-2xl p-6 text-center text-[#1E7F4D] dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" /> Solusi Telah Resmi Dikirim pada {new Date(latestSubmission?.createdAt || Date.now()).toLocaleDateString('id-ID')}
                </div>
              ) : (
                <Button 
                  type="submit" 
                  isLoading={isSubmitting} 
                  size="lg" 
                  className="w-full bg-[#1E7F4D] hover:bg-[#196B40] text-white font-bold h-14 text-sm rounded-2xl shadow-lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Seluruh Jawaban & Solusi ke Rekruter
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
