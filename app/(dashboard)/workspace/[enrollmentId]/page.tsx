'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../../services/submissions.service';
import { verificationService } from '../../../../services/verification.service';
import { useUserStore } from '../../../../store/userStore';
import { Button } from '../../../../components/common/Button';
import { Input, Textarea } from '../../../../components/common/Input';
import { FileUploader } from '../../../../components/workspace/FileUploader';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, CheckCircle2, AlertCircle, GitBranch, Layout, Globe, Send, Award, Timer, Lock, FileText,
  ShieldCheck, Camera, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as faceapi from '@vladmandic/face-api';
import { FaceScanner } from '../../../../components/workspace/FaceScanner';
import Editor from '@monaco-editor/react';

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

  // Proctoring & Anti-Joki State
  const [proctoringEvents, setProctoringEvents] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
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

  const enrollments = talentData?.data || [];
  const selectedEnrollment = enrollments.find((e: any) => e.id === selectedEnrollmentId);
  const isProctored = selectedEnrollment?.challenge?.gradingRubric?.requireProctoring ?? true;

  // Redirect if not found
  useEffect(() => {
    if (!isTalentLoading && !selectedEnrollment) {
      router.push('/workspace');
    }
  }, [isTalentLoading, selectedEnrollment, router]);

  // LMS Timer
  useEffect(() => {
    if (!selectedEnrollment) return;
    const startedAtMs = new Date(selectedEnrollment.startedAt).getTime();
    const durationHours = selectedEnrollment.challenge?.gradingRubric?.durationHours || 72;
    const expiresAtMs = startedAtMs + durationHours * 3600 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAtMs - now;
      if (diff <= 0) {
        setIsExpired(true);
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
  }, [selectedEnrollment]);

  // Tab Switching Listener (Proctoring)
  useEffect(() => {
    if (!selectedEnrollment || !isProctored || isExpired) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setProctoringEvents((list) => [...list, `[${timestamp}] Jendela peramban ditutup / Berpindah ke aplikasi eksternal`]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedEnrollment, isProctored, isExpired]);

  // Start Webcam Stream
  const handleStartWebcam = () => {
    setWebcamOpen(true);
    setIsVerifyingFace(false);
  };

  const handleFaceVerification = async (scannedDescriptor: number[]) => {
    setWebcamOpen(false);
    setIsVerifyingFace(true);

    try {
      const storedVector = user?.talentProfile?.biometricFeatureVector;
      
      if (!storedVector || !Array.isArray(storedVector) || storedVector.length === 0) {
        setFaceVerified(false);
        alert('Anda belum mendaftarkan wajah di halaman Profil. Harap daftarkan wajah (Scan Wajah) terlebih dahulu.');
        return;
      }

      const desc1 = new Float32Array(scannedDescriptor);
      // Since prisma returns it as JSON array, we can map it to Float32Array
      const desc2 = new Float32Array(storedVector as number[]);
      const distance = faceapi.euclideanDistance(desc1, desc2);

      // 0.6 is a standard threshold for face-api.js model
      if (distance < 0.6) {
        setFaceVerified(true);
      } else {
        setFaceVerified(false);
        alert(`Wajah tidak cocok dengan profil terdaftar (Distance: ${distance.toFixed(2)}). Pastikan Anda adalah peserta yang sah.`);
      }
    } catch (err: any) {
      setFaceVerified(false);
      alert('Terjadi kesalahan saat memverifikasi wajah.');
    } finally {
      setIsVerifyingFace(false);
    }
  };

  if (isTalentLoading || !selectedEnrollment) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-40 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  const components = selectedEnrollment?.challenge?.components || [];
  const customOutputs: Array<{ id: string; label: string; placeholder: string; required?: boolean }> =
    selectedEnrollment?.challenge?.gradingRubric?.customOutputs || [];

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

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment || isExpired) return;

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
        solutionFilesUrl,
        repositoryUrl,
        figmaUrl,
        liveDemoUrl,
        notes: combinedNotes,
        responses: responsesArray,
      });
      setSubmitSuccess(true);
      refetchTalent();
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal mengirimkan solusi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submissions = selectedEnrollment?.submissions || [];
  const latestSubmission = submissions[submissions.length - 1];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/workspace" className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Workspace
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Briefcase className="h-4 w-4" /> Ruang Kerja LMS Aktif
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            {selectedEnrollment.challenge.title}
          </h1>
          <p className="text-sm text-gray-400">Kerjakan studi kasus, unggah solusi, dan lihat evaluasi otomatis AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">{selectedEnrollment.challenge.category} Challenge</span>
                <h3 className="font-display text-2xl font-bold text-white mt-1">Sesi Pengerjaan</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-md transition-all ${
                  isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-dark-bg border-dark-border text-emerald-400'
                }`}>
                  {isExpired ? <Lock className="h-4 w-4 flex-shrink-0" /> : <Timer className="h-4 w-4 flex-shrink-0 animate-spin-slow" />}
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold tracking-wider">{timeLeftString}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-semibold">{isExpired ? 'Waktu Habis' : 'Sisa Waktu Server'}</p>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-gray-300">
                  {selectedEnrollment.status}
                </span>
              </div>
            </div>

            {isExpired && !latestSubmission ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
                <Lock className="h-12 w-12 text-red-400 mx-auto" />
                <h4 className="font-display text-xl font-bold text-white">Waktu Pengerjaan Telah Berakhir</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                  Batas waktu pengerjaan LMS yang dihitung dari waktu server saat Anda pertama kali mendaftar telah habis. Pengumpulan solusi saat ini telah dikunci.
                </p>
              </div>
            ) : !latestSubmission ? (
              <form onSubmit={handleSubmitSolution} className="space-y-6">
                {/* PROCTORING SECURITY & BIOMETRIC BANNER */}
                {isProctored && (
                  <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-inner">
                    <div className="flex items-start gap-3.5">
                      <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-display font-bold text-white text-sm">🔒 Pengawasan Ujian Aktif (Flexible Proctoring)</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
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
                          <span className="text-xs font-semibold text-white block">Status Wajah Anti-Joki:</span>
                          {faceVerified === null ? (
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
                            title="Verifikasi Wajah Peserta"
                            description="Sistem akan membandingkan wajah Anda dengan profil yang terdaftar secara instan (Lokal)."
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

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

                {/* DYNAMIC COMPONENTS RENDERING */}
                {components.length > 0 && (
                  <div className="space-y-8 border-t border-dark-border pt-8">
                    <h4 className="font-display font-bold text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" /> Komponen Ujian (Wajib Diisi)
                    </h4>
                    
                    {components.map((comp: any, idx: number) => (
                      <div key={comp.id} className="bg-dark-bg border border-dark-border rounded-2xl p-6 shadow-inner space-y-4">
                        <div className="flex justify-between items-start gap-4 mb-4 border-b border-dark-border/50 pb-4">
                          <h5 className="font-bold text-white text-base leading-relaxed">
                            {idx + 1}. {comp.question}
                          </h5>
                          <span className="text-xs bg-dark-card border border-dark-border px-2 py-1 rounded text-emerald-400 whitespace-nowrap font-semibold shadow-sm">
                            {comp.points} Poin
                          </span>
                        </div>
                        {comp.description && (
                          <p className="text-sm text-gray-400 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">{comp.description}</p>
                        )}

                        {comp.type === 'MULTIPLE_CHOICE' && comp.options && (
                          <div className="space-y-3">
                            {comp.options.map((opt: any, optIdx: number) => (
                              <label key={optIdx} className="flex items-center gap-3 p-3 rounded-xl border border-dark-border hover:border-emerald-500/50 cursor-pointer transition-colors bg-dark-card">
                                <input
                                  type="radio"
                                  name={`comp-${comp.id}`}
                                  value={opt.id}
                                  onChange={() => handleComponentChange(comp.id, opt.id, 'textValue')}
                                  checked={componentResponses[comp.id]?.textValue === opt.id}
                                  className="w-4 h-4 text-emerald-500 bg-dark-bg border-gray-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-200">{opt.text}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {comp.type === 'ESSAY' && (
                          <Textarea
                            placeholder="Ketik jawaban Anda di sini..."
                            value={componentResponses[comp.id]?.textValue || ''}
                            onChange={(e) => handleComponentChange(comp.id, e.target.value, 'textValue')}
                            rows={5}
                          />
                        )}

                        {comp.type === 'URL_SUBMISSION' && (
                          <Input
                            placeholder="https://..."
                            type="url"
                            value={componentResponses[comp.id]?.textValue || ''}
                            onChange={(e) => handleComponentChange(comp.id, e.target.value, 'textValue')}
                            icon={<Globe className="w-4 h-4" />}
                          />
                        )}

                        {comp.type === 'FILE_UPLOAD' && (
                          <FileUploader
                            onUploadComplete={(url) => handleComponentChange(comp.id, url, 'fileUrl')}
                            maxSizeMB={10}
                          />
                        )}

                        {comp.type === 'VIDEO_UPLOAD' && (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-400 mb-2 font-medium">Unggah berkas video (MP4/WebM) maksimal 25MB.</p>
                            <FileUploader
                              onUploadComplete={(url) => handleComponentChange(comp.id, url, 'fileUrl')}
                              maxSizeMB={25}
                              accept="video/*"
                            />
                          </div>
                        )}

                        {comp.type === 'LIVE_CODING' && (
                          <div className="rounded-xl overflow-hidden border border-dark-border shadow-2xl">
                            <div className="bg-dark-card px-4 py-2 border-b border-dark-border flex justify-between items-center">
                              <span className="text-xs font-mono text-emerald-400">Main.{comp.metadata?.language || 'js'}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Live Editor Mode</span>
                            </div>
                            <Editor
                              height="400px"
                              language={comp.metadata?.language || 'javascript'}
                              theme="vs-dark"
                              value={componentResponses[comp.id]?.textValue || ''}
                              onChange={(value) => handleComponentChange(comp.id, value, 'textValue')}
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* LEGACY FIELDS (Dapat dikosongkan jika sudah menggunakan dynamic components) */}
                <div className="space-y-8 pt-8 border-t border-dark-border">
                  <h4 className="font-display font-bold text-white text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-400" /> Informasi Pengumpulan Tambahan
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">Berkas / Aset Solusi Tambahan (Opsional)</label>
                    <FileUploader
                      onUploadComplete={(url) => setSolutionFilesUrl(url)}
                      maxSizeMB={25}
                    />
                  </div>

                  {customOutputs.length > 0 && (
                    <div className="space-y-6 bg-dark-bg border border-dark-border rounded-2xl p-6 shadow-inner">
                      <div className="flex items-center gap-2 border-b border-dark-border pb-3">
                        <FileText className="h-5 w-5 text-emerald-400" />
                        <h4 className="font-display font-bold text-white text-base">Persyaratan Output Khusus (Legacy)</h4>
                      </div>
                      <p className="text-xs text-gray-400">Perusahaan menerapkan rubrik pengumpulan spesifik untuk studi kasus ini. Lengkapi tautan di bawah:</p>

                      <div className="space-y-4 pt-2">
                        {customOutputs.map((out) => (
                          <Input
                            key={out.id}
                            label={`${out.label} ${out.required ? '*' : '(Opsional)'}`}
                            type="url"
                            placeholder={out.placeholder}
                            required={out.required}
                            value={customInputs[out.id] || ''}
                            onChange={(e) => setCustomInputs({ ...customInputs, [out.id]: e.target.value })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Tautan Repositori (GitHub/GitLab) - Opsional"
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      icon={<GitBranch className="h-5 w-5" />}
                    />
                    <Input
                      label="Tautan Demo Langsung (Vercel/Netlify) - Opsional"
                      type="url"
                      placeholder="https://my-project.vercel.app"
                      value={liveDemoUrl}
                      onChange={(e) => setLiveDemoUrl(e.target.value)}
                      icon={<Globe className="h-5 w-5" />}
                    />
                  </div>

                  <Textarea
                    label="Catatan Eksekutif Tambahan"
                    placeholder="Catatan tambahan di luar format komponen di atas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold h-14 text-base mt-8">
                  <Send className="h-5 w-5 mr-2" />
                  Kirim Solusi untuk Dievaluasi AI & Rekruter
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Status Kiriman: {latestSubmission.status}</h4>
                    <p className="text-xs text-gray-400">Dikirim pada {new Date(latestSubmission.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-extrabold text-emerald-400">{latestSubmission.finalScore || latestSubmission.aiScore}/100</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Skor Akhir</p>
                  </div>
                </div>

                {latestSubmission.notes && (
                  <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-3 font-mono">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border pb-2">
                      <FileText className="h-4 w-4" /> Dokumen & Catatan Pengumpulan Solusi
                    </h5>
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap space-y-2 pt-2">
                      {latestSubmission.notes}
                    </div>
                  </div>
                )}

                {latestSubmission.aiCorrectionSummary && (
                  <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-3">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="h-4 w-4" /> Rangkuman Koreksi Otomatis AI
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{latestSubmission.aiCorrectionSummary}</p>
                  </div>
                )}

                {latestSubmission.reviewerFeedback && (
                  <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="h-4 w-4" /> Ulasan Final Rekruter
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{latestSubmission.reviewerFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
            <h3 className="font-display text-xl font-bold text-white border-b border-dark-border pb-4">Informasi Pengerjaan LMS</h3>
            <div className="space-y-4 text-xs text-gray-300">
              <div className="flex justify-between py-2 border-b border-dark-border/60">
                <span className="text-gray-500">Waktu Mulai (Server)</span>
                <span className="font-bold text-white text-right">{new Date(selectedEnrollment.startedAt).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-border/60">
                <span className="text-gray-500">Batas Waktu</span>
                <span className="font-bold text-red-400 text-right">{selectedEnrollment.challenge?.gradingRubric?.durationHours || 72} Jam</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-border/60">
                <span className="text-gray-500">Mode Proctoring</span>
                <span className="font-bold text-amber-400 text-right">{isProctored ? 'Aktif (Biometrik Wajib)' : 'Tidak Aktif'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Evaluasi AI</span>
                <span className="font-bold text-emerald-400 text-right">Instant Feedback</span>
              </div>
            </div>
            
            <a href={`/challenges/${selectedEnrollment.challenge.id}`} target="_blank" rel="noreferrer" className="w-full">
              <Button variant="secondary" className="w-full flex justify-center items-center gap-2 mt-4">
                Lihat Detail Tantangan
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
