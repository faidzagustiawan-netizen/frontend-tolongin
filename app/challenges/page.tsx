'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { challengesService, CreateChallengePayload } from '../../services/challenges.service';
import { useUserStore } from '../../store/userStore';
import { ChallengeCard } from '../../components/challenge/ChallengeCard';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Search, RefreshCw, Briefcase, Sparkles, Plus, Wand2, FileText,
  CheckCircle2, AlertCircle, Clock, DollarSign, Layers, Zap, ShieldCheck, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChallengesDirectoryPage() {
  const { user, loadUserFromStorage } = useUserStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Manual Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT'>('FRONTEND');
  const [difficulty, setDifficulty] = useState<'JUNIOR' | 'MEDIOR' | 'SENIOR'>('MEDIOR');
  const [durationHours, setDurationHours] = useState<number>(48);
  const [rewardDescription, setRewardDescription] = useState('Rp 5.000.000 + Kesempatan Perekrutan Penuh Waktu');
  const [customReqs, setCustomReqs] = useState<string>('Tautan Repositori GitHub, Berkas Zip Solusi');
  const [requireProctoring, setRequireProctoring] = useState<boolean>(true);

  // AI Generator Form State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT'>('FRONTEND');
  const [aiDifficulty, setAiDifficulty] = useState<'JUNIOR' | 'MEDIOR' | 'SENIOR'>('SENIOR');

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['challenges', debouncedSearch, selectedCategory, selectedDifficulty],
    queryFn: () =>
      challengesService.getAll({
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
      }),
  });

  const categories = [
    { id: '', name: 'Semua Kategori' },
    { id: 'UI_UX', name: 'UI/UX Design' },
    { id: 'FRONTEND', name: 'Frontend Engineering' },
    { id: 'BACKEND', name: 'Backend & API' },
    { id: 'DATA_SCIENCE', name: 'Data Science & AI' },
    { id: 'MARKETING', name: 'Digital Marketing & SEO' },
    { id: 'PRODUCT', name: 'Product Management' },
  ];

  const difficulties = [
    { id: '', name: 'Semua Level' },
    { id: 'JUNIOR', name: 'Junior (1-2 Thn)' },
    { id: 'MEDIOR', name: 'Medior (3-5 Thn)' },
    { id: 'SENIOR', name: 'Senior (5+ Thn)' },
  ];

  const challenges = data?.data || [];
  const isCompanyOrAdmin = user && (user.role === 'COMPANY' || user.role === 'ADMIN');
  const userProfile = useUserStore((state) => state.user?.profile);
  const isStartupTier = userProfile?.subscriptionTier === 'STARTUP';

  const submitChallenge = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !summary || !description) {
      setSubmitError('Harap lengkapi judul, ringkasan, dan deskripsi studi kasus.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const gradingRubric = {
      code_architecture: 35,
      problem_solving: 40,
      scalability: 25,
      durationHours: Number(durationHours),
      requireProctoring: requireProctoring,
      customOutputs: customReqs.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      await challengesService.create({
        title,
        summary,
        description,
        category,
        difficulty,
        rewardDescription,
        gradingRubric,
        status,
      });

      setSubmitSuccess(status === 'DRAFT' ? 'Draf berhasil disimpan! Anda bisa mengeditnya di Profil.' : 'Studi Kasus berhasil diterbitkan!');
      refetch();
      setTimeout(() => {
        setCreateModalOpen(false);
        setSubmitSuccess(null);
        setTitle('');
        setSummary('');
        setDescription('');
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Gagal menyimpan studi kasus. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitChallenge('PUBLISHED');
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) {
      setSubmitError('Harap jelaskan kebutuhan rekrutmen atau masalah bisnis Anda di kolom prompt AI.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await challengesService.generateAi({
        prompt: aiPrompt,
        category: aiCategory,
        difficulty: aiDifficulty,
      });

      setSubmitSuccess('AI berhasil merancang dan merumuskan draf studi kasus! Kasus baru telah ditambahkan sebagai Draf.');
      refetch();
      setTimeout(() => {
        setCreateModalOpen(false);
        setSubmitSuccess(null);
        setAiPrompt('');
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Gagal menghasilkan studi kasus via AI. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4 relative">
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Pilih Tantangan & Buktikan Kinerja Anda
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Selesaikan studi kasus langsung dari perusahaan mitra terkemuka. Setiap pengumpulan akan dievaluasi seketika oleh AI dan diteruskan ke tim rekruter.
        </p>

        {/* Company Action Button */}
        {isCompanyOrAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-6"
          >
            <button
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(null);
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-display font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all group"
            >
              <Plus className="h-5 w-5 flex-shrink-0 group-hover:rotate-90 transition-transform" />
              <span>Rilis Studi Kasus Baru (Manual / AI Generator)</span>
              <Sparkles className="h-4 w-4 text-amber-300 ml-1 flex-shrink-0 animate-pulse" />
            </button>
          </motion.div>
        )}
      </div>

      <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:flex-1">
            <Input
              type="text"
              placeholder="Cari judul, nama perusahaan mitra, atau teknologi spesifik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-5 w-5" />}
            />
          </div>

          <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
            >
              {difficulties.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {(search || selectedCategory || selectedDifficulty) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedDifficulty('');
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 flex-shrink-0"
                title="Reset Filter"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-dark-card border border-dark-border rounded-3xl h-80 animate-pulse p-6" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-3xl space-y-4">
          <p className="text-base text-red-400 font-medium">Gagal memuat daftar studi kasus.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
          </Button>
        </div>
      ) : challenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {challenges.map((challenge: any) => (
            <ChallengeCard
              key={challenge.id}
              id={challenge.id}
              slug={challenge.slug}
              title={challenge.title}
              summary={challenge.summary}
              category={challenge.category}
              difficulty={challenge.difficulty}
              type={challenge.type}
              companyName={challenge.type === 'PUBLIC' ? 'Public Challenge' : challenge.company?.companyName || 'Perusahaan Mitra'}
              logoUrl={challenge.company?.logoUrl}
              rewardDescription={challenge.type === 'PUBLIC' ? 'Reward: +50 Tokens & +150 XP' : challenge.rewardDescription}
              deadlineAt={challenge.deadlineAt}
              trustScore={challenge.company?.trustScore}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-3xl space-y-3 max-w-lg mx-auto">
          <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-base text-gray-300 font-semibold">Tidak ada studi kasus yang cocok dengan pencarian Anda.</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Coba gunakan kata kunci lain atau reset filter pencarian di atas untuk melihat seluruh direktori.
          </p>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL RILIS STUDI KASUS (COMPANY/ADMIN) */}
      {/* ======================================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Rilis Studi Kasus Rekrutmen"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-dark-bg border border-dark-border rounded-2xl">
            <button
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(null);
                setCreateTab('MANUAL');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-xs transition-all ${
                createTab === 'MANUAL'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" /> Rilis Manual
            </button>
            <button
              onClick={() => {
                if (isStartupTier) return;
                setSubmitError(null);
                setSubmitSuccess(null);
                setCreateTab('AI');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-xs transition-all ${
                isStartupTier ? 'opacity-50 cursor-not-allowed bg-dark-bg text-gray-500' :
                createTab === 'AI'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isStartupTier ? <Lock className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
              AI Prompt Generator {isStartupTier && '(Pro)'}
            </button>
          </div>

          {submitSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-3 text-red-400 text-xs font-semibold">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* TAB MANUAL */}
          {createTab === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Judul Studi Kasus"
                  placeholder="Misal: Arsitektur Micro-Frontend e-Commerce"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Input
                  label="Rangkuman Singkat"
                  placeholder="Tantangan merancang federasi modul..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Kategori Bidang</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="FRONTEND">Frontend Engineering</option>
                    <option value="BACKEND">Backend & API</option>
                    <option value="UI_UX">UI/UX Design</option>
                    <option value="DATA_SCIENCE">Data Science & AI</option>
                    <option value="MARKETING">Digital Marketing & SEO</option>
                    <option value="PRODUCT">Product Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Tingkat Kesulitan</label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="JUNIOR">Junior (1-2 Thn)</option>
                    <option value="MEDIOR">Medior (3-5 Thn)</option>
                    <option value="SENIOR">Senior (5+ Thn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Durasi Pengerjaan (Jam)</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Deskripsi Lengkap / Masalah Bisnis (Markdown didukung)</label>
                <textarea
                  rows={4}
                  placeholder="### Latar Belakang Bisnis&#10;Perusahaan kami membutuhkan...&#10;&#10;### Objektif Studi Kasus&#10;Peserta diharapkan mampu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 text-xs text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Penghargaan / Insentif Rekrutmen"
                  placeholder="Rp 5.000.000 + Undangan Wawancara Final"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                />
                <Input
                  label="Persyaratan Deliverables Kustom (Pisahkan koma)"
                  placeholder="Tautan GitHub, Slide Pitch Deck PDF, Media Plan Sheet"
                  value={customReqs}
                  onChange={(e) => setCustomReqs(e.target.value)}
                />
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer" onClick={() => setRequireProctoring(!requireProctoring)}>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Wajibkan Pengawasan Ujian (Browser Proctoring & Tab Switch Log)
                  </label>
                  <p className="text-[11px] text-gray-400">Jika aktif, sistem merekam log perpindahan jendela dan mewajibkan verifikasi wajah anti-joki sebelum submisi.</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireProctoring}
                  onChange={(e) => setRequireProctoring(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-dark-bg cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Batal</Button>
                <Button type="button" variant="secondary" onClick={() => submitChallenge('DRAFT')} isLoading={isSubmitting}>Simpan Draf</Button>
                <Button type="submit" isLoading={isSubmitting} className="shadow-xl">Terbitkan Studi Kasus</Button>
              </div>
            </form>
          )}

          {/* TAB AI GENERATOR */}
          {createTab === 'AI' && (
            <form onSubmit={handleAiSubmit} className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-3.5 text-amber-300 text-xs leading-relaxed">
                <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Prompt-to-Challenge (Generative AI)</strong>
                  Jelaskan masalah spesifik atau posisi yang ingin Anda rekrut. AI akan merumuskan judul, latar belakang bisnis, rubrik penilaian, dan batasan arsitektural secara otomatis.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Prompt Kebutuhan / Masalah Bisnis</label>
                <textarea
                  rows={5}
                  placeholder="Misal: Perusahaan logistik kami mengalami keterlambatan sinkronisasi data pelacakan armada secara real-time. Kami butuh backend engineer senior yang bisa merancang arsitektur event-driven menggunakan Kafka dan Redis di ekosistem Go/NestJS."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-2xl p-4 text-xs text-white leading-relaxed focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Kategori Keahlian</label>
                  <select
                    value={aiCategory}
                    onChange={(e: any) => setAiCategory(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="BACKEND">Backend & API</option>
                    <option value="FRONTEND">Frontend Engineering</option>
                    <option value="UI_UX">UI/UX Design</option>
                    <option value="DATA_SCIENCE">Data Science & AI</option>
                    <option value="MARKETING">Digital Marketing & SEO</option>
                    <option value="PRODUCT">Product Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Tingkat Kesulitan Target</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e: any) => setAiDifficulty(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SENIOR">Senior (5+ Thn)</option>
                    <option value="MEDIOR">Medior (3-5 Thn)</option>
                    <option value="JUNIOR">Junior (1-2 Thn)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Batal</Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/20 font-bold"
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Rancang dengan AI
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
