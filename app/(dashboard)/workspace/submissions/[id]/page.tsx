'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../../../services/submissions.service';
import { useUserStore } from '../../../../../store/userStore';
import { Button } from '../../../../../components/common/Button';
import { Input, Textarea } from '../../../../../components/common/Input';
import { ArrowLeft, ExternalLink, Code2, FileText, CheckCircle, Clock, XCircle, Brain, Target, ShieldAlert, FileCode2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useUserStore();
  const submissionId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    finalScore: '',
    reviewerFeedback: '',
    status: 'PASSED',
    hiringStatus: 'NONE'
  });

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'ADMIN') {
      router.push('/workspace');
    }
  }, [isAuthenticated, user, router]);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['company-submissions'],
    queryFn: () => submissionsService.getCompanySubmissions(),
    enabled: isAuthenticated && !!user,
  });

  const submission = response?.data?.find((s: any) => s.id === submissionId);

  // Parse AI Score if exists
  const aiScore = submission?.aiScore;
  const isPremium = (user as any)?.subscriptionTier !== 'STARTUP';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-gray-400">Memuat detail submisi...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Submisi Tidak Ditemukan</h2>
        <Button onClick={() => router.push('/workspace')} variant="secondary">Kembali</Button>
      </div>
    );
  }

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await submissionsService.gradeSubmission(submissionId, {
        finalScore: Number(formData.finalScore),
        reviewerFeedback: formData.reviewerFeedback,
        status: formData.status as any,
        hiringStatus: formData.hiringStatus as any,
      });
      alert('Penilaian berhasil disimpan!');
      refetch();
      router.push(`/workspace/submissions/challenge/${submission.challengeId}`);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan penilaian');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button 
        onClick={() => router.push(`/workspace/submissions/challenge/${submission.challengeId}`)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kandidat
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold overflow-hidden text-xl">
                {submission.talent.avatarUrl ? (
                  <img src={submission.talent.avatarUrl} alt={submission.talent.fullName} className="w-full h-full object-cover" />
                ) : (
                  submission.talent.fullName[0].toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">{submission.talent.fullName}</h1>
                <p className="text-emerald-400 font-medium">{submission.challenge.title}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>Terkumpul: {new Date(submission.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>Kategori: {submission.challenge.category}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Hasil Pekerjaan Kandidat</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {submission.repositoryUrl && (
                  <a href={submission.repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-dark-border transition-colors">
                    <Code2 className="w-6 h-6 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-white">Repository Kode</p>
                      <p className="text-xs text-emerald-400">Buka Tautan <ExternalLink className="inline w-3 h-3" /></p>
                    </div>
                  </a>
                )}
                {submission.liveDemoUrl && (
                  <a href={submission.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-dark-border transition-colors">
                    <Play className="w-6 h-6 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-white">Live Demo / Preview</p>
                      <p className="text-xs text-emerald-400">Buka Tautan <ExternalLink className="inline w-3 h-3" /></p>
                    </div>
                  </a>
                )}
                {submission.figmaUrl && (
                  <a href={submission.figmaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-dark-border transition-colors">
                    <FileCode2 className="w-6 h-6 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-white">Desain Figma</p>
                      <p className="text-xs text-emerald-400">Buka Tautan <ExternalLink className="inline w-3 h-3" /></p>
                    </div>
                  </a>
                )}
                {submission.solutionFilesUrl && (
                  <a href={submission.solutionFilesUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-dark-border transition-colors">
                    <FileText className="w-6 h-6 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-white">Dokumen Terlampir</p>
                      <p className="text-xs text-emerald-400">Unduh <ExternalLink className="inline w-3 h-3" /></p>
                    </div>
                  </a>
                )}
              </div>
            </div>
            {submission.componentResponses && submission.componentResponses.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Komponen Asesmen Dinamis</h3>
                <div className="space-y-4">
                  {submission.componentResponses.map((res: any, idx: number) => (
                    <div key={idx} className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs font-bold text-emerald-400">{res.component?.question || 'Tugas / Pertanyaan'}</p>
                      {res.component?.type === 'LIVE_CODING' ? (
                        <pre className="text-xs text-gray-300 bg-black/50 p-3 rounded-lg overflow-x-auto font-mono border border-white/10">
                          {res.textValue}
                        </pre>
                      ) : res.component?.type === 'MULTIPLE_CHOICE' ? (
                        <p className="text-sm text-gray-300">
                          Pilihan Kandidat: <span className="font-semibold text-white">{
                            res.component?.options?.find((o: any) => o.id === res.textValue)?.text || res.textValue
                          }</span>
                        </p>
                      ) : res.fileUrl ? (
                        <a href={res.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Lihat Berkas Lampiran
                        </a>
                      ) : (
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">{res.textValue || 'Tidak ada teks/jawaban diberikan.'}</div>
                      )}
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{res.component?.type?.replace('_', ' ')} • {res.score || 0}{' / '}{res.component?.points || 0} Pts</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.notes && (
              <div className="mt-6 pt-6 border-t border-dark-border">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Catatan Kandidat</h3>
                <div className="bg-black/30 p-4 rounded-xl text-sm text-gray-400 whitespace-pre-wrap">
                  {submission.notes}
                </div>
              </div>
            )}
          </div>

          {/* AI Assessment (If Premium / Available) */}
          {submission.aiScore !== null ? (
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">AI Assessment Summary</h2>
                <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PREMIUM TIER</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-bg/50 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Skor AI</p>
                  <p className="text-3xl font-bold text-white">{submission.aiScore}<span className="text-lg text-gray-500">/100</span></p>
                </div>
                <div className="bg-dark-bg/50 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Plagiarisme</p>
                  <p className={`text-3xl font-bold ${submission.aiPlagiarismScore > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {submission.aiPlagiarismScore}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Catatan Evaluasi Otomatis</h3>
                <div className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                  {submission.aiCorrectionSummary || "Tidak ada catatan spesifik dari AI."}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-card border border-dark-border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <Brain className="w-12 h-12 text-gray-600 mb-3" />
              <h3 className="text-white font-medium mb-1">AI Assessment Tidak Tersedia</h3>
              <p className="text-sm text-gray-400 max-w-sm mb-4">Fitur penilaian otomatis dan deteksi plagiarisme hanya tersedia untuk perusahaan dengan paket Premium (Konglomerat / Custom).</p>
              <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>Upgrade Sekarang</Button>
            </div>
          )}
        </div>

        {/* Right Column: Grading Form */}
        <div className="lg:col-span-1">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-6">Penilaian Manual</h2>
            <form onSubmit={handleGrade} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nilai Akhir (0-100) <span className="text-red-500">*</span></label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  required 
                  placeholder="Misal: 85"
                  value={formData.finalScore}
                  onChange={(e) => setFormData({...formData, finalScore: e.target.value})}
                  className="bg-dark-bg text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Keputusan Akhir <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'PASSED'})}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.status === 'PASSED' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Lolos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'FAILED'})}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      formData.status === 'FAILED' 
                        ? 'bg-red-500/10 border-red-500 text-red-400' 
                        : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Gagal</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status Rekrutmen</label>
                <select 
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={formData.hiringStatus}
                  onChange={(e) => setFormData({...formData, hiringStatus: e.target.value})}
                >
                  <option value="NONE">Belum Ditentukan</option>
                  <option value="SHORTLISTED">Simpan ke Daftar Kandidat (Shortlisted)</option>
                  <option value="INTERVIEW_INVITED">Undang Wawancara</option>
                  <option value="HIRED">Diterima Kerja (Hired)</option>
                  <option value="REJECTED">Ditolak (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Umpan Balik (Feedback)</label>
                <Textarea 
                  placeholder="Tuliskan ulasan kualitatif untuk kandidat ini..."
                  rows={4}
                  value={formData.reviewerFeedback}
                  onChange={(e) => setFormData({...formData, reviewerFeedback: e.target.value})}
                  className="bg-dark-bg text-sm resize-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">Umpan balik ini akan dikirimkan kepada kandidat untuk membantu mereka berkembang.</p>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isSubmitting || !formData.finalScore}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penilaian & Kirim Hasil'}
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
