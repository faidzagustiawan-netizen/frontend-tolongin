'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { challengesService } from '../../../services/challenges.service';
import { submissionsService } from '../../../services/submissions.service';
import { useUserStore } from '../../../store/userStore';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { RubricTable } from '../../../components/challenge/RubricTable';
import { DiscussionThread } from '../../../components/challenge/DiscussionThread';
import { Building2, Calendar, Award, CheckCircle2, AlertCircle, FileText, ArrowRight, Clock, ShieldCheck } from 'lucide-react';

export default function ChallengeDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  const { data: challengeData, isLoading, isError, refetch } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => challengesService.getOne(slug),
  });

  const { data: discussionsData, refetch: refetchDiscussions } = useQuery({
    queryKey: ['discussions', challengeData?.data?.id],
    queryFn: () => challengesService.getDiscussions(challengeData?.data?.id),
    enabled: !!challengeData?.data?.id,
  });

  const challenge = challengeData?.data;
  const discussions = discussionsData?.data || [];

  const handleEnroll = async () => {
    if (!ndaAccepted) return;
    setIsEnrolling(true);
    setEnrollmentError(null);
    try {
      const res = await submissionsService.enroll({ challengeId: challenge.id });
      setNdaModalOpen(false);
      router.push('/workspace');
    } catch (err: any) {
      setEnrollmentError(err.message || 'Gagal mendaftar ke studi kasus ini.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleNewComment = async (message: string, parentId?: string) => {
    await challengesService.createDiscussion(challenge.id, { message, parentId });
    refetchDiscussions();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-8 bg-white/5 rounded-xl w-2/3" />
        <div className="h-40 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="text-center py-32 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Studi Kasus Tidak Ditemukan</h2>
        <p className="text-sm text-gray-400">Studi kasus yang Anda cari tidak ada atau telah ditarik oleh perusahaan.</p>
        <Button onClick={() => router.push('/challenges')} size="sm">Kembali ke Direktori</Button>
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'JUNIOR': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'MEDIOR': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'SENIOR': return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                {challenge.company?.logoUrl ? (
                  <img src={challenge.company.logoUrl} alt={challenge.company.companyName} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-200">{challenge.company?.companyName || 'Perusahaan Mitra'}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    {challenge.category.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {challenge.title}
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              {challenge.summary}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-dark-border/80 text-sm text-gray-400">
              {challenge.rewardDescription && (
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Award className="h-5 w-5 flex-shrink-0" />
                  <span>{challenge.rewardDescription}</span>
                </div>
              )}
              {challenge.deadlineAt && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>Batas Waktu: {new Date(challenge.deadlineAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 shadow-xl flex flex-col justify-between w-full md:w-80 flex-shrink-0 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Dilindungi Digital NDA
              </div>
              <h3 className="text-lg font-bold text-white">Mulai Mengerjakan</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Dengan mendaftar, Anda akan mendapatkan akses penuh ke dataset, mock API, dan panduan merek perusahaan.
              </p>
            </div>

            {isAuthenticated ? (
              user?.role === 'TALENT' ? (
                <Button onClick={() => setNdaModalOpen(true)} size="lg" className="w-full shadow-xl">
                  <span>Ambil Tantangan Ini</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400">Hanya akun Talenta yang dapat mengambil tantangan studi kasus.</p>
                </div>
              )
            ) : (
              <Button onClick={() => router.push(`/login?redirect=/challenges/${slug}`)} size="lg" className="w-full">
                Masuk untuk Mendaftar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8 bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 shadow-xl">
          <h3 className="font-display text-2xl font-bold text-white border-b border-dark-border pb-4">
            Spesifikasi & Kebutuhan Proyek
          </h3>
          <div className="prose prose-invert max-w-none text-gray-300 space-y-6 leading-relaxed">
            {challenge.description.split('\n\n').map((paragraph: string, i: number) => {
              if (paragraph.startsWith('### ')) {
                return <h4 key={i} className="text-lg font-bold text-white mt-6 mb-2">{paragraph.replace('### ', '')}</h4>;
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-1 my-2 text-gray-300">
                    {paragraph.split('\n').map((item, j) => (
                      <li key={j}>{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </div>
          
          {challenge.briefAttachments && challenge.briefAttachments.length > 0 && (
            <div className="mt-12 space-y-4">
              <h4 className="text-lg font-bold text-white mb-4 border-b border-dark-border pb-2">Lampiran Brief & Aset Visual</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {challenge.briefAttachments.map((att: any, idx: number) => {
                  if (att.type === 'image') {
                    return (
                      <div key={idx} className="bg-dark-bg rounded-xl overflow-hidden border border-dark-border group relative shadow-lg">
                        <img src={att.url} alt={att.caption || 'Lampiran Gambar'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                        {att.caption && <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-3 text-xs text-white font-medium border-t border-white/10">{att.caption}</div>}
                      </div>
                    );
                  }
                  if (att.type === 'video') {
                    return (
                      <div key={idx} className="bg-dark-bg rounded-xl overflow-hidden border border-dark-border shadow-lg">
                         <iframe src={att.url} className="w-full h-48" allowFullScreen title={att.title || 'Video Brief'} />
                      </div>
                    );
                  }
                  if (att.type === 'link' || att.type === 'document') {
                    return (
                      <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-dark-bg border border-dark-border p-4 rounded-xl hover:bg-white/5 transition-colors shadow-lg">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                          <FileText className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">{att.label || 'Dokumen / Tautan Eksternal'}</p>
                          <p className="text-xs text-gray-400 truncate">{att.url}</p>
                        </div>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {challenge.gradingRubric && (
            <RubricTable rubric={challenge.gradingRubric} />
          )}

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-white mb-2">Informasi & Bantuan</h4>
            <div className="flex items-start gap-3 text-xs text-gray-400 leading-relaxed">
              <Clock className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p>Waktu pengerjaan disarankan adalah 3-7 hari setelah Anda menyetujui Digital NDA.</p>
            </div>
            <div className="flex items-start gap-3 text-xs text-gray-400 leading-relaxed">
              <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>Pastikan Anda mencantumkan tautan repositori GitHub dan demo langsung yang dapat diakses publik.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-dark-border pt-12">
        <DiscussionThread challengeId={challenge.id} discussions={discussions} onNewComment={handleNewComment} />
      </div>

      <Modal isOpen={ndaModalOpen} onClose={() => setNdaModalOpen(false)} title="Persetujuan Digital NDA">
        <div className="space-y-6">
          <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-4 max-h-60 overflow-y-auto text-xs text-gray-300 leading-relaxed">
            <h4 className="font-bold text-white text-sm">PERJANJIAN KERAHASIAAN INFORMASI (NON-DISCLOSURE AGREEMENT)</h4>
            <p>Dengan menekan tombol setuju di bawah ini, Anda menyatakan sepakat untuk mematuhi ketentuan kerahasiaan berikut:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Seluruh data sampel, arsitektur sistem, dan API internal yang disediakan oleh <strong>{challenge.company?.companyName}</strong> bersifat rahasia.</li>
              <li>Anda dilarang mendistribusikan, menjual, atau mempublikasikan dataset ini untuk kepentingan komersial di luar platform Tolongin.co.</li>
              <li>Solusi kode yang Anda buat tetap menjadi hak milik Anda dan dapat digunakan sebagai portofolio publik di Tolongin.co.</li>
            </ol>
          </div>

          {enrollmentError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{enrollmentError}</p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={ndaAccepted}
              onChange={(e) => setNdaAccepted(e.target.checked)}
              className="mt-0.5 rounded bg-dark-bg border-dark-border text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-200 font-medium leading-relaxed">
              Saya telah membaca, memahami, dan menyetujui seluruh ketentuan Digital NDA di atas.
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setNdaModalOpen(false)}>Batal</Button>
            <Button onClick={handleEnroll} isLoading={isEnrolling} disabled={!ndaAccepted}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Setuju & Mulai Mengerjakan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
