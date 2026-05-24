'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../services/submissions.service';
import { useUserStore } from '../../../store/userStore';
import { Button } from '../../../components/common/Button';
import { Input, Textarea } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import Link from 'next/link';
import {
  Briefcase, CheckCircle2, AlertCircle, RefreshCw, GitBranch, Layout, Globe, Send, Award, Clock, Timer, Lock, FileText,
  Users, Sparkles, Search, Filter, ExternalLink, ChevronRight, User as UserIcon, Building2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspacePage() {
  const { user, loadUserFromStorage } = useUserStore();
  const isCompany = user?.role === 'COMPANY';

  // State untuk Perusahaan (Recruiter Dashboard)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedSubmissionForGrade, setSelectedSubmissionForGrade] = useState<any | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  // Grading Form State
  const [finalScore, setFinalScore] = useState<number>(85);
  const [reviewerFeedback, setReviewerFeedback] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<'PASSED' | 'FAILED' | 'UNDER_REVIEW'>('PASSED');
  const [hiringStatus, setHiringStatus] = useState<'NONE' | 'SHORTLISTED' | 'INTERVIEW_INVITED' | 'HIRED' | 'REJECTED'>('SHORTLISTED');
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState<string | null>(null);

  // Top 10 AI Filter State
  const [isTop10Filter, setIsTop10Filter] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Query untuk Talenta
  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: !!user && !isCompany,
  });

  // Query untuk Perusahaan
  const { data: companyData, isLoading: isCompLoading, refetch: refetchComp } = useQuery({
    queryKey: ['company-submissions'],
    queryFn: () => submissionsService.getCompanySubmissions(),
    enabled: !!user && isCompany,
  });

  const enrollments = talentData?.data || [];
  const companySubmissions = companyData?.data || [];

  const handleOpenGradeModal = (sub: any) => {
    setSelectedSubmissionForGrade(sub);
    setFinalScore(sub.finalScore ? sub.finalScore : Math.round(sub.aiScore || 85));
    setReviewerFeedback(sub.reviewerFeedback || 'Solusi menunjukkan pemahaman mendalam terhadap rumusan masalah. Implementasi berjalan stabil dan memenuhi kriteria utama studi kasus.');
    setReviewStatus(sub.status !== 'PENDING_AI' ? sub.status : 'PASSED');
    setHiringStatus(sub.hiringStatus !== 'NONE' ? sub.hiringStatus : 'SHORTLISTED');
    setGradeError(null);
    setGradeSuccessMsg(null);
    setGradeModalOpen(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionForGrade) return;
    setIsGrading(true);
    setGradeError(null);
    setGradeSuccessMsg(null);

    try {
      await submissionsService.gradeSubmission(selectedSubmissionForGrade.id, {
        finalScore: Number(finalScore),
        reviewerFeedback,
        status: reviewStatus,
        hiringStatus,
      });
      setGradeSuccessMsg('Penilaian dan ulasan berhasil disimpan! Portofolio terverifikasi telah diterbitkan dan XP kandidat bertambah.');
      refetchComp();
      setTimeout(() => {
        setGradeModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setGradeError(err.message || 'Gagal menyimpan penilaian. Silakan coba lagi.');
    } finally {
      setIsGrading(false);
    }
  };

  let filteredCompanySubmissions = companySubmissions.filter((sub: any) => {
    const matchStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const searchLower = searchFilter.toLowerCase();
    const matchSearch =
      sub.talent?.fullName?.toLowerCase().includes(searchLower) ||
      sub.challenge?.title?.toLowerCase().includes(searchLower) ||
      sub.talent?.skills?.some((sk: string) => sk.toLowerCase().includes(searchLower));
    return matchStatus && matchSearch;
  });

  if (isTop10Filter) {
    filteredCompanySubmissions = filteredCompanySubmissions
      .sort((a: any, b: any) => {
        const scoreA = a.finalScore || a.aiScore || 0;
        const scoreB = b.finalScore || b.aiScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PASSED': return <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full font-bold">PASSED</span>;
      case 'UNDER_REVIEW': return <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-full font-bold">UNDER REVIEW</span>;
      case 'PENDING_AI': return <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-full font-bold">PENDING AI</span>;
      case 'FAILED': return <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-full font-bold">FAILED</span>;
      default: return <span className="px-3 py-1 bg-gray-500/10 border border-gray-500/30 text-gray-400 text-xs rounded-full">{st}</span>;
    }
  };

  const getHiringBadge = (hs: string) => {
    if (!hs || hs === 'NONE') return null;
    const label = hs.replace('_', ' ');
    switch (hs) {
      case 'HIRED': return <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">{label}</span>;
      case 'INTERVIEW_INVITED': return <span className="px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-[10px] rounded-full font-semibold uppercase">{label}</span>;
      case 'SHORTLISTED': return <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] rounded-full font-semibold uppercase">{label}</span>;
      default: return <span className="px-2.5 py-0.5 bg-gray-500/20 text-gray-300 text-[10px] rounded-full uppercase">{label}</span>;
    }
  };

  if (isTalentLoading || isCompLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-40 bg-white/5 rounded-xl w-full" />
      </div>
    );
  }

  // ==========================================
  // TAMPILAN DASHBOARD PERUSAHAAN (RECRUITER)
  // ==========================================
  if (isCompany) {
    const totalSubs = companySubmissions.length;
    const needReviewSubs = companySubmissions.filter((s: any) => s.status === 'UNDER_REVIEW' || s.status === 'PENDING_AI').length;
    const passedSubs = companySubmissions.filter((s: any) => s.status === 'PASSED').length;
    const avgScore = totalSubs > 0
      ? (companySubmissions.reduce((acc: number, curr: any) => acc + (curr.finalScore || curr.aiScore || 0), 0) / totalSubs).toFixed(1)
      : '0.0';

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Building2 className="h-4 w-4" /> Manajemen Asesmen & Submisi Kandidat
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Dasbor Penilaian Rekruter & Asesmen AI
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Tinjau solusi kode, prototipe, dan dokumen yang dikirim oleh talenta. Manfaatkan ulasan otomatis AI (Top 10 Kandidat) untuk mempercepat keputusan penyeleksian kandidat secara aman dan terproteksi.
            </p>
          </div>

          <div className="flex flex-col items-end gap-4 relative z-10 flex-shrink-0">
            <Button onClick={() => refetchComp()} variant="secondary" size="sm" className="flex items-center gap-2 shadow-xl">
              <RefreshCw className="h-4 w-4" /> Muat Ulang
            </Button>
            <Button
              onClick={() => setIsTop10Filter(!isTop10Filter)}
              size="sm"
              className={`${isTop10Filter ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'} flex items-center gap-2 shadow-xl`}
            >
              <Sparkles className="h-4 w-4" /> {isTop10Filter ? 'Tampilkan Semua' : 'Filter Top 10 AI'}
            </Button>
          </div>
        </div>

        {/* Recruiter Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Submisi</p>
              <h3 className="font-display text-3xl font-extrabold text-white mt-1">{totalSubs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 uppercase font-semibold">Perlu Ditinjau</p>
              <h3 className="font-display text-3xl font-extrabold text-amber-400 mt-1">{needReviewSubs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 uppercase font-semibold">Telah Lulus (PASSED)</p>
              <h3 className="font-display text-3xl font-extrabold text-emerald-400 mt-1">{passedSubs}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-cyan-400 uppercase font-semibold">Rata-Rata Skor AI</p>
              <h3 className="font-display text-3xl font-extrabold text-cyan-400 mt-1">{avgScore}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filtering bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-card border border-dark-border rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari nama kandidat, keahlian, atau judul studi kasus..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold flex-shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {['ALL', 'UNDER_REVIEW', 'PASSED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                  statusFilter === st
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCompanySubmissions.length > 0 ? (
            filteredCompanySubmissions.map((sub: any) => {
              const aiScoreNum = sub.aiScore || 0;
              const scoreColor = aiScoreNum >= 90 ? 'text-emerald-400 border-emerald-500/30' : aiScoreNum >= 80 ? 'text-cyan-400 border-cyan-500/30' : 'text-amber-400 border-amber-500/30';
              const hasProctoringWarning = sub.notes && sub.notes.includes('TIDAK TERVERIFIKASI');

              return (
                <div key={sub.id} className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                  {hasProctoringWarning && (
                    <div className="absolute top-0 left-0 w-full bg-red-500/20 text-red-300 py-1 px-4 text-[10px] font-bold flex items-center justify-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Peringatan Anomali Biometrik / Proctoring
                    </div>
                  )}

                  <div className={`space-y-4 ${hasProctoringWarning ? 'pt-3' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 shadow-md">
                          {sub.talent?.avatarUrl ? (
                            <img src={sub.talent.avatarUrl} alt={sub.talent.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-6 w-6 m-3 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-base group-hover:text-emerald-400 transition-colors">{sub.talent?.fullName || 'Talenta Tolongin'}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Diserahkan {new Date(sub.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(sub.status)}
                        {getHiringBadge(sub.hiringStatus)}
                      </div>
                    </div>

                    <div className="bg-dark-bg border border-dark-border rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-semibold">{sub.challenge?.title}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{sub.challenge?.category}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-2 border-t border-dark-border/80">
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-gray-300 font-medium">Asesmen AI</span>
                        </div>
                        <span className={`font-display text-xl font-extrabold ${scoreColor}`}>
                          {sub.finalScore ? `${sub.finalScore}/100` : `${aiScoreNum}/100`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Indeks Anti-Plagiasi AI</span>
                        <span className="font-mono font-bold text-emerald-400">{sub.aiPlagiarismScore || '0.0'}% (Orisinal)</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {sub.talent?.skills?.slice(0, 4).map((sk: string) => (
                        <span key={sk} className="bg-white/5 border border-white/10 text-[10px] text-gray-300 px-2.5 py-1 rounded-lg font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenGradeModal(sub)}
                    className="w-full flex items-center justify-center gap-2 shadow-xl group-hover:shadow-emerald-500/10 font-semibold"
                  >
                    <span>Tinjau & Evaluasi Kandidat</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <Users className="h-12 w-12 text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-400">Belum ada submisi kandidat yang sesuai dengan filter pencarian.</p>
            </div>
          )}
        </div>

        {/* Modal Grading & Review Kandidat */}
        <Modal
          isOpen={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          title="Tinjau Solusi & Asesmen Rekruter"
          className="max-w-3xl"
        >
          {selectedSubmissionForGrade && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-dark-border pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                    <img src={selectedSubmissionForGrade.talent?.avatarUrl || '/placeholder.png'} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-lg">{selectedSubmissionForGrade.talent?.fullName}</h4>
                    <p className="text-xs text-gray-400">{selectedSubmissionForGrade.challenge?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-cyan-400">
                    Skor AI: {selectedSubmissionForGrade.aiScore}/100
                  </span>
                </div>
              </div>

              {/* Tautan Deliverables & Dokumen dengan Proteksi HAKI */}
              <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent blur-2xl rounded-full" />
                <h5 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-emerald-400" /> Perlindungan Hak Kekayaan Intelektual (HAKI)
                </h5>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-xl">
                  Berdasarkan Terms of Service (ToS), seluruh solusi yang diunggah adalah Hak Milik Talenta.
                  Tautan repositori, dokumen, dan prototipe telah dikunci (*watermarked*) dari akses pengunduhan publik. Untuk menggunakan atau mengakses sumber asli secara komersial, silakan pilih salah satu jalur kerja sama di bawah ini.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button variant="secondary" className="flex items-center justify-center gap-2 w-full text-xs">
                    <UserIcon className="h-4 w-4" /> Rekrut Kandidat
                  </Button>
                  <Button variant="secondary" className="flex items-center justify-center gap-2 w-full text-xs">
                    <Award className="h-4 w-4" /> Buyout (Beli Solusi)
                  </Button>
                  <Button variant="secondary" className="flex items-center justify-center gap-2 w-full text-xs">
                    <Briefcase className="h-4 w-4" /> Tawarkan Kemitraan
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 blur-[1px] pointer-events-none select-none">
                  {selectedSubmissionForGrade.solutionFilesUrl && (
                    <div className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-xl">
                      <span className="flex items-center gap-2 font-semibold text-gray-400 text-xs"><FileText className="h-4 w-4" /> Berkas Solusi Utama [LOCKED]</span>
                    </div>
                  )}
                  {selectedSubmissionForGrade.repositoryUrl && (
                    <div className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-xl">
                      <span className="flex items-center gap-2 font-semibold text-gray-400 text-xs"><GitBranch className="h-4 w-4" /> Tautan Repositori [LOCKED]</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Catatan & Custom Deliverables */}
              {selectedSubmissionForGrade.notes && (
                <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-dark-border pb-2">
                    <FileText className="h-4 w-4 text-emerald-400" /> Catatan Implementasi & Persyaratan Output Khusus
                  </h5>
                  <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap space-y-3 pt-2 font-mono">
                    {selectedSubmissionForGrade.notes}
                  </div>
                </div>
              )}

              {/* AI Assessment Report */}
              {selectedSubmissionForGrade.aiCorrectionSummary && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Laporan Analisis Otomatis AI (Anti-Joki & Plagiasi)
                    </h5>
                    <span className="text-[10px] font-mono bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-0.5 rounded-full text-emerald-300">
                      Plagiasi: {selectedSubmissionForGrade.aiPlagiarismScore || '0.0'}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedSubmissionForGrade.aiCorrectionSummary}</p>
                </div>
              )}

              {/* Formulir Penilaian Rekruter */}
              <form onSubmit={handleGradeSubmit} className="space-y-6 pt-6 border-t border-dark-border">
                <h4 className="font-display font-bold text-white text-base">Formulir Evaluasi & Keputusan Rekrutmen</h4>

                {gradeSuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 text-xs">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <p>{gradeSuccessMsg}</p>
                  </div>
                )}

                {gradeError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{gradeError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Nilai Akhir (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={finalScore}
                      onChange={(e) => setFinalScore(Number(e.target.value))}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Keputusan Kelulusan</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as any)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="PASSED">PASSED (Lulus Portofolio)</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW (Ditinjau)</option>
                      <option value="FAILED">FAILED (Gagal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Status Perekrutan</label>
                    <select
                      value={hiringStatus}
                      onChange={(e) => setHiringStatus(e.target.value as any)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="SHORTLISTED">Shortlisted (Kandidat Unggulan)</option>
                      <option value="INTERVIEW_INVITED">Interview Invited (Undang Wawancara)</option>
                      <option value="HIRED">Hired (Direkrut)</option>
                      <option value="REJECTED">Rejected (Ditolak)</option>
                      <option value="NONE">None (Hanya Portofolio)</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Ulasan Kualitatif Rekruter (Akan Ditampilkan di Profil & Portofolio Kandidat)"
                  placeholder="Berikan umpan balik konstruktif mengenai kualitas solusi, arsitektur, atau presentasi kandidat..."
                  value={reviewerFeedback}
                  onChange={(e) => setReviewerFeedback(e.target.value)}
                  rows={4}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setGradeModalOpen(false)}>Batal</Button>
                  <Button type="submit" isLoading={isGrading} size="lg" className="shadow-xl">
                    <CheckCircle2 className="h-5 w-5 mr-2" /> Simpan Asesmen Final
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN WORKSPACE TALENTA (DAFTAR KARTU)
  // ==========================================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Briefcase className="h-4 w-4" /> Manajemen Studi Kasus
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Workspace Talenta
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Semua tantangan dan studi kasus yang sedang Anda kerjakan atau telah selesai dievaluasi akan muncul di sini. Pilih salah satu untuk melanjutkan pengerjaan.
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-dark-bg border border-dark-border rounded-3xl p-12 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400 shadow-inner">
            <Briefcase className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-display text-xl font-bold text-white tracking-tight">Belum Ada Tantangan yang Diambil</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Anda belum berpartisipasi dalam studi kasus mana pun. Eksplorasi tantangan perusahaan sekarang untuk membangun portofolio!
            </p>
          </div>
          <Link href="/challenges">
            <Button size="lg" className="mt-4">
              Cari Tantangan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments.map((enrollment: any) => {
            const isCompleted = enrollment.status === 'COMPLETED' || enrollment.status === 'PASSED';
            const isExpired = enrollment.status === 'EXPIRED';
            const statusColor = isCompleted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                              isExpired ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                              'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

            return (
              <Link key={enrollment.id} href={`/workspace/${enrollment.id}`} className="group">
                <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full hover:border-emerald-500/50 transition-all relative overflow-hidden space-y-6">
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider border ${statusColor}`}>
                        {enrollment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {enrollment.challenge?.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 font-mono">Diambil pada: {new Date(enrollment.startedAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-dark-border relative z-10">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                      <Timer className="h-4 w-4" /> Masuk ke LMS
                    </span>
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
