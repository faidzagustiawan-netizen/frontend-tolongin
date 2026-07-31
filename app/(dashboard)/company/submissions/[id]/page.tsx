'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  submissionsService,
  type HiringStatus,
} from '@/services/submissions.service';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { HIRING_STAGES, getHiringStage } from '@/lib/hiringStatus';
import Image from 'next/image';
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  FileText,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  ShieldAlert,
  FileCode2,
  Play,
  UserCheck,
  Mail,
  Link2,
  Lock,
  Loader2,
  Compass,
} from 'lucide-react';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useUserStore();
  const submissionId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMovingStage, setIsMovingStage] = useState(false);
  const [pendingStage, setPendingStage] = useState<HiringStatus | null>(null);
  const [formData, setFormData] = useState({
    finalScore: '',
    reviewerFeedback: '',
    status: 'PASSED' as 'PASSED' | 'FAILED',
    hiringStatus: 'NONE' as HiringStatus,
  });

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, user, router]);

  // Diambil satu per satu. Sebelumnya seluruh daftar submisi perusahaan
  // ditarik lalu dicari id-nya di sisi klien — cara yang berhenti bekerja
  // begitu daftarnya berpaginasi, dan boros sejak awal.
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['company-submission', submissionId],
    queryFn: () => submissionsService.getCompanySubmission(submissionId),
    enabled: isAuthenticated && !!user && !!submissionId,
  });

  const submission = response?.data;

  const isAlreadyGraded = !!submission?.evaluatedAt;

  const hasProctoringViolations =
    submission?.notes?.includes('Pelanggaran Fatal') ||
    submission?.notes?.includes('Jendela peramban ditutup') ||
    submission?.notes?.includes('Wajah tidak terdeteksi') ||
    submission?.notes?.includes('wajah asing');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-success mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">Memuat detail submisi...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Submisi Tidak Ditemukan</h1>
        <Button onClick={() => router.push('/')} variant="secondary">Kembali ke Dashboard</Button>
      </div>
    );
  }

  const currentStage = getHiringStage(submission.hiringStatus);
  const talentSlug = submission.talent?.slug;
  const talentEmail = submission.talent?.email;

  const scoreValue = Number(formData.finalScore);
  const isScoreValid =
    formData.finalScore !== '' &&
    Number.isFinite(scoreValue) &&
    scoreValue >= 0 &&
    scoreValue <= 100;
  const scoreError =
    formData.finalScore !== '' && !isScoreValid
      ? 'Nilai akhir harus berupa angka 0 sampai 100.'
      : undefined;

  const submitGrade = async () => {
    setIsConfirmOpen(false);
    try {
      setIsSubmitting(true);
      await submissionsService.gradeSubmission(submissionId, {
        finalScore: scoreValue,
        reviewerFeedback: formData.reviewerFeedback,
        status: formData.status,
        hiringStatus: formData.hiringStatus,
      });
      toast.success('Penilaian tersimpan dan hasilnya dikirim ke kandidat.');
      refetch();
      router.push(`/company/submissions/challenge/${submission.challengeId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Gagal menyimpan penilaian.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tahap rekrutmen bisa berpindah kapan saja, termasuk setelah penilaian
  // terkunci. Inilah yang dulu tidak mungkin: `hiringStatus` hanya bisa diisi
  // sekali di dalam formulir penilaian.
  const moveStage = async (stage: HiringStatus) => {
    setPendingStage(null);
    try {
      setIsMovingStage(true);
      await submissionsService.updateHiringStatus(submissionId, stage);
      await refetch();
      toast.success(`Kandidat dipindahkan ke tahap "${getHiringStage(stage).label}".`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengubah tahap rekrutmen.',
      );
    } finally {
      setIsMovingStage(false);
    }
  };

  const requestStageChange = (stage: HiringStatus) => {
    if (stage === submission.hiringStatus) return;
    // Hanya tahap yang mengirim kabar ke kandidat yang butuh konfirmasi.
    // Menandai daftar pendek adalah pembukuan internal dan tidak perlu ditahan.
    if (getHiringStage(stage).notifiesTalent) {
      setPendingStage(stage);
      return;
    }
    void moveStage(stage);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/company/submissions/challenge/${submission.challengeId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali ke Daftar Kandidat
        </Link>
        <Button onClick={() => window.print()} variant="secondary" size="sm" className="gap-2">
          <FileText className="w-4 h-4" aria-hidden="true" /> Cetak / Simpan PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {hasProctoringViolations && (
            <div
              role="alert"
              className="bg-danger/10 border border-danger/50 p-4 rounded-xl flex items-start gap-4 text-danger print:block"
            >
              <ShieldAlert className="w-6 h-6 mt-1 flex-shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-lg mb-1">Peringatan: Potensi Kecurangan (Anti-Joki)</h2>
                <p className="text-sm opacity-90 leading-relaxed">Sistem mendeteksi adanya pelanggaran pengawasan yang krusial selama ujian berlangsung (berpindah tab berulang kali atau wajah asing). Skor AI di bawah ini mungkin tidak valid. Silakan periksa &quot;Catatan Kandidat&quot; di bawah untuk log selengkapnya.</p>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
              <div className="relative h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-success font-bold overflow-hidden text-xl flex-shrink-0">
                {submission.talent.avatarUrl ? (
                  <Image src={submission.talent.avatarUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="relative z-10" aria-hidden="true">{submission.talent.fullName[0].toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-display font-bold text-foreground">{submission.talent.fullName}</h1>
                {submission.talent.headline && (
                  <p className="text-sm text-muted-foreground mt-0.5">{submission.talent.headline}</p>
                )}
                <p className="text-success font-medium mt-1">{submission.challenge.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span>Terkumpul: {new Date(submission.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>
                    Bidang: {submission.challenge.category || 'Lintas bidang'}
                  </span>
                </div>

                {/* Profil lengkap kandidat sebelumnya hanya bisa dicapai dari
                    leaderboard, sehingga rekruter menilai tanpa pernah melihat
                    portofolio, lencana, atau riwayat studi kasus lainnya. */}
                {talentSlug && (
                  <Link
                    href={`/talents/${talentSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-success hover:opacity-80 transition-opacity print:hidden"
                  >
                    Lihat profil lengkap kandidat
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            {/* Kontak kandidat */}
            <div className="rounded-xl border border-border bg-foreground/5 p-4 mb-6 print:hidden">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Kontak Kandidat
              </h2>
              {talentEmail ? (
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href={`mailto:${talentEmail}?subject=${encodeURIComponent(
                      `Tindak lanjut studi kasus: ${submission.challenge.title}`,
                    )}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-success hover:opacity-80 transition-opacity"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    {talentEmail}
                  </a>
                  {submission.talent.linkedinUrl && (
                    <a
                      href={submission.talent.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Link2 className="w-4 h-4" aria-hidden="true" /> LinkedIn
                    </a>
                  )}
                  {submission.talent.githubUrl && (
                    <a
                      href={submission.talent.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Code2 className="w-4 h-4" aria-hidden="true" /> GitHub
                    </a>
                  )}
                </div>
              ) : (
                /* Email dibuka setelah kandidat masuk daftar pendek. Aturan yang
                   sama ditegakkan di backend, bukan hanya disembunyikan di sini. */
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="leading-relaxed">
                    Email kandidat terbuka setelah Anda memasukkannya ke daftar
                    pendek atau tahap setelahnya.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hasil Pekerjaan Kandidat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {submission.repositoryUrl && (
                  <a href={submission.repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors">
                    <Code2 className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Repository Kode</p>
                      <p className="text-xs text-success">Buka Tautan <ExternalLink className="inline w-3 h-3" aria-hidden="true" /></p>
                    </div>
                  </a>
                )}
                {submission.liveDemoUrl && (
                  <a href={submission.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors">
                    <Play className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Live Demo / Preview</p>
                      <p className="text-xs text-success">Buka Tautan <ExternalLink className="inline w-3 h-3" aria-hidden="true" /></p>
                    </div>
                  </a>
                )}
                {submission.figmaUrl && (
                  <a href={submission.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors">
                    <FileCode2 className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Desain Figma</p>
                      <p className="text-xs text-success">Buka Tautan <ExternalLink className="inline w-3 h-3" aria-hidden="true" /></p>
                    </div>
                  </a>
                )}
                {submission.solutionFilesUrl && (
                  <a href={submission.solutionFilesUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors">
                    <FileText className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Dokumen Terlampir</p>
                      <p className="text-xs text-success">Unduh <ExternalLink className="inline w-3 h-3" aria-hidden="true" /></p>
                    </div>
                  </a>
                )}
              </div>
            </div>
            {submission.componentResponses && submission.componentResponses.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Komponen Asesmen Dinamis</h2>
                <div className="space-y-4">
                  {submission.componentResponses.map((res: any, idx: number) => (
                    <div key={idx} className="bg-foreground/5 p-4 rounded-xl border border-border space-y-2">
                      <p className="text-xs font-bold text-success">{res.component?.question || 'Tugas / Pertanyaan'}</p>
                      {res.component?.type === 'LIVE_CODING' ? (
                        <pre className="text-xs text-muted-foreground bg-background p-3 rounded-lg overflow-x-auto font-mono border border-border">
                          {res.textValue}
                        </pre>
                      ) : res.component?.type === 'MULTIPLE_CHOICE' ? (
                        <p className="text-sm text-muted-foreground">
                          Pilihan Kandidat: <span className="font-semibold text-foreground">{
                            res.component?.options?.find((o: any) => o.id === res.textValue)?.text || res.textValue
                          }</span>
                        </p>
                      ) : res.fileUrl ? (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-info hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" aria-hidden="true" /> Lihat Berkas Lampiran
                        </a>
                      ) : (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{res.textValue || 'Tidak ada teks/jawaban diberikan.'}</div>
                      )}
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{res.component?.type?.replace('_', ' ')} • {res.score || 0}{' / '}{res.component?.points || 0} Pts</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">Catatan Kandidat</h2>
                <div className="bg-foreground/5 border border-border p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap">
                  {submission.notes}
                </div>
              </div>
            )}
          </div>

          {/* Profil psikotes berdiri sendiri, di luar panel AI.
              Skornya bukan "seberapa benar" melainkan kecenderungan, dan tidak
              ikut menyusun nilai akhir — menaruhnya bersama skor AI akan
              membuatnya terbaca sebagai nilai yang bisa lulus atau gagal. */}
          {submission.psychometricProfile?.dimensions?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-fuchsia-400" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">Profil Psikotes</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Kecenderungan kandidat pada tiap dimensi, bukan nilai benar-salah.
                Tidak dihitung ke dalam nilai akhir.
              </p>

              <div className="space-y-4">
                {submission.psychometricProfile.dimensions.map((dimension: any) => (
                  <div key={dimension.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {dimension.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dimension.score}/100 · {dimension.itemCount} soal
                      </span>
                    </div>
                    <div
                      className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden"
                      role="img"
                      aria-label={`${dimension.name}: ${dimension.score} dari 100`}
                    >
                      <div
                        className="h-full rounded-full bg-fuchsia-400"
                        style={{ width: `${dimension.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Assessment (If Premium / Available) */}
          {submission.aiScore !== null ? (
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-info" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">AI Assessment Summary</h2>
                <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold bg-info/10 text-info border border-info/30">PREMIUM TIER</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-foreground/5 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="w-3 h-3" aria-hidden="true" /> Hard Skill (AI)</p>
                  <p className="text-3xl font-bold text-foreground">{submission.aiScore || 0}<span className="text-lg text-muted-foreground">/100</span></p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><UserCheck className="w-3 h-3 text-info" aria-hidden="true" /> Soft Skill (AI)</p>
                  <p className="text-3xl font-bold text-info">{submission.softSkillScore || '-'}<span className="text-lg text-muted-foreground">/100</span></p>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" aria-hidden="true" /> Plagiarisme</p>
                  <p className={`text-3xl font-bold ${submission.aiPlagiarismScore > 30 ? 'text-danger' : 'text-success'}`}>
                    {submission.aiPlagiarismScore || 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evaluasi Teknis (Hard Skills)</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed bg-foreground/5 p-4 rounded-xl border border-border whitespace-pre-wrap">
                    {submission.aiCorrectionSummary || 'Tidak ada catatan spesifik dari AI.'}
                  </div>
                </div>
                {submission.softSkillFeedback && (
                  <div>
                    <h3 className="text-xs font-semibold text-info uppercase tracking-wider mb-2">Analisis Kepribadian &amp; Soft Skills</h3>
                    <div className="text-sm text-muted-foreground leading-relaxed bg-info/5 p-4 rounded-xl border border-info/20 whitespace-pre-wrap">
                      {submission.softSkillFeedback}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center print:hidden">
              <Brain className="w-12 h-12 text-muted-foreground mb-3" aria-hidden="true" />
              <h2 className="text-foreground font-medium mb-1">AI Assessment Tidak Tersedia</h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">Penilaian otomatis, analisis soft skill, dan deteksi plagiarisme aktif mulai paket Pro.</p>
              <Button variant="outline" size="sm" onClick={() => router.push('/company/billing')}>Lihat Paket</Button>
            </div>
          )}
        </div>

        {/* Right Column: Grading + pipeline */}
        <div className="lg:col-span-1 print:hidden space-y-6">
          {/* Tahap rekrutmen berdiri sendiri di luar formulir penilaian, jadi
              tetap bisa dipakai setelah penilaian terkunci. */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Tahap Rekrutmen</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Bisa diubah kapan saja, termasuk setelah penilaian tersimpan.
            </p>

            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Tahap saat ini
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-4 ${currentStage.className}`}
            >
              {currentStage.label}
            </span>

            <fieldset disabled={isMovingStage} className="space-y-2">
              <legend className="sr-only">Pindahkan kandidat ke tahap rekrutmen</legend>
              {HIRING_STAGES.map((stage) => {
                const isCurrent = stage.value === submission.hiringStatus;
                return (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => requestStageChange(stage.value)}
                    aria-pressed={isCurrent}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors disabled:opacity-60 ${
                      isCurrent
                        ? 'border-success bg-success/10 text-foreground font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    <span className="block">{stage.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {stage.hint}
                    </span>
                  </button>
                );
              })}
            </fieldset>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-foreground mb-6">Penilaian Manual</h2>

            {isAlreadyGraded ? (
              /* Penilaian memberi XP dan token ke talenta, jadi hanya boleh
                 sekali. Backend juga menolak penilaian ulang; formulirnya
                 disembunyikan agar penolakan itu tidak muncul sebagai galat
                 setelah rekruter terlanjur mengetik ulang semuanya. */
              <div className="space-y-4">
                <div className="bg-success/10 border border-success/30 rounded-xl p-4">
                  <p className="text-sm text-success font-medium leading-relaxed">
                    Submisi ini sudah dinilai pada{' '}
                    {new Date(submission.evaluatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    . Hasilnya sudah dikirim ke kandidat beserta XP dan token-nya,
                    jadi penilaian tidak dapat diulang.
                  </p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nilai akhir</dt>
                    <dd className="font-bold text-foreground">{submission.finalScore ?? '-'}/100</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-bold text-foreground">{submission.status}</dd>
                  </div>
                </dl>
                {submission.reviewerFeedback && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Catatan reviewer</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {submission.reviewerFeedback}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Perlu koreksi nilai? Hubungi admin. Tahap rekrutmen tetap bisa
                  Anda ubah di atas.
                </p>
              </div>
            ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isScoreValid) return;
                setIsConfirmOpen(true);
              }}
              className="space-y-5"
            >
              <Input
                label="Nilai Akhir (0-100)"
                type="number"
                min={0}
                max={100}
                step={1}
                required
                placeholder="Misal: 85"
                value={formData.finalScore}
                error={scoreError}
                onChange={(e) => setFormData({ ...formData, finalScore: e.target.value })}
                className="bg-background text-lg font-bold"
              />

              <fieldset>
                <legend className="block text-sm font-medium text-muted-foreground mb-1">
                  Keputusan Akhir
                  <span className="text-danger ml-1" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'PASSED' })}
                    aria-pressed={formData.status === 'PASSED'}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.status === 'PASSED'
                        ? 'bg-success/10 border-success text-success'
                        : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm font-medium">Lolos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'FAILED' })}
                    aria-pressed={formData.status === 'FAILED'}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.status === 'FAILED'
                        ? 'bg-danger/10 border-danger text-danger'
                        : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    <XCircle className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm font-medium">Gagal</span>
                  </button>
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="hiring-status-initial"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Tahap Rekrutmen Awal
                </label>
                <select
                  id="hiring-status-initial"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  value={formData.hiringStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, hiringStatus: e.target.value as HiringStatus })
                  }
                >
                  {HIRING_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Bisa diubah lagi kapan saja setelah penilaian tersimpan.
                </p>
              </div>

              <Textarea
                label="Umpan Balik (Feedback)"
                placeholder="Tuliskan ulasan kualitatif untuk kandidat ini..."
                rows={4}
                value={formData.reviewerFeedback}
                onChange={(e) => setFormData({ ...formData, reviewerFeedback: e.target.value })}
                className="bg-background text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground -mt-3">Umpan balik ini akan dikirimkan kepada kandidat untuk membantu mereka berkembang.</p>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isSubmitting || !isScoreValid}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penilaian & Kirim Hasil'}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>

      </div>

      {/* Penilaian memberi XP dan token lalu terkunci selamanya. Aksi sekali
          jalan seperti ini tidak boleh berangkat dari satu klik tanpa jeda. */}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Kirim penilaian ini?"
        confirmLabel="Ya, simpan dan kirim"
        cancelLabel="Periksa lagi"
        isBusy={isSubmitting}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={submitGrade}
      >
        <p>
          Nilai <strong className="text-foreground">{formData.finalScore}/100</strong> dengan
          keputusan{' '}
          <strong className="text-foreground">
            {formData.status === 'PASSED' ? 'Lolos' : 'Gagal'}
          </strong>{' '}
          akan dikirimkan ke {submission.talent.fullName}.
        </p>
        <p>
          Penilaian memberi XP dan token kepada kandidat, sehingga hanya bisa
          dilakukan satu kali dan tidak dapat dibatalkan sendiri.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!pendingStage}
        title={`Pindahkan ke tahap "${getHiringStage(pendingStage).label}"?`}
        confirmLabel="Ya, pindahkan"
        cancelLabel="Batal"
        isBusy={isMovingStage}
        onCancel={() => setPendingStage(null)}
        onConfirm={() => pendingStage && moveStage(pendingStage)}
      >
        <p>
          {submission.talent.fullName} akan menerima pemberitahuan tentang
          perubahan ini.
        </p>
      </ConfirmDialog>
    </div>
  );
}
