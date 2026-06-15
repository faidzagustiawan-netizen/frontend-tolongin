'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../../../store/userStore';
import { challengesService, CreateChallengePayload } from '../../../../services/challenges.service';
import { Button } from '../../../../components/common/Button';
import { Input, Textarea } from '../../../../components/common/Input';
import { Sparkles, Briefcase, PlusCircle, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateChallengePage() {
  const router = useRouter();
  const { user, loadUserFromStorage, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'AI'>('AI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUserFromStorage();
    if (isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'TALENT') {
      router.push('/workspace');
    }
  }, [loadUserFromStorage, isAuthenticated, user, router]);

  // States for AI Form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT'>('FRONTEND');
  const [aiDifficulty, setAiDifficulty] = useState<'JUNIOR' | 'MEDIOR' | 'SENIOR'>('MEDIOR');

  // States for Manual Form
  const [manualData, setManualData] = useState<CreateChallengePayload>({
    title: '',
    summary: '',
    description: '',
    category: 'FRONTEND',
    difficulty: 'MEDIOR',
  });

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await challengesService.generateAi({
        prompt: aiPrompt,
        category: aiCategory,
        difficulty: aiDifficulty,
      });
      setSuccessMsg('Studi kasus berhasil dirumuskan oleh AI dan diterbitkan ke direktori!');
      setTimeout(() => {
        router.push('/workspace');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI generator. Pastikan API key backend telah terkonfigurasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.title || !manualData.summary || !manualData.description) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await challengesService.create({
        ...manualData,
        gradingRubric: {
          completeness: 30,
          quality: 40,
          efficiency: 30,
        }
      });
      setSuccessMsg('Studi kasus berhasil dibuat dan dipublikasikan!');
      setTimeout(() => {
        router.push('/workspace');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan studi kasus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.role !== 'COMPANY' && user.role !== 'TALENT')) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="bg-dark-card border border-dark-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/10 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <PlusCircle className="h-4 w-4" /> Publikasi Tantangan Baru
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Rancang Studi Kasus Rekrutmen
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            Buat tantangan teknis atau bisnis untuk talenta. Anda dapat mendesain secara manual atau membiarkan AI generatif kami merancang spesifikasi dan rubrik secara otomatis berdasarkan kebutuhan perusahaan Anda.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-dark-bg p-2 rounded-2xl border border-dark-border w-fit">
        <button
          onClick={() => setActiveTab('AI')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'AI' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" /> AI Auto-Generate
        </button>
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'MANUAL' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Pembuatan Manual
        </button>
      </div>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4 text-emerald-400 shadow-lg">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{successMsg}</p>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4 text-red-400 shadow-lg">
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'AI' ? (
          <motion.div
            key="ai-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl"
          >
            <form onSubmit={handleAiGenerate} className="space-y-6">
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex gap-4 text-sm text-cyan-200">
                <Info className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <p>
                  Ceritakan masalah atau fitur yang sedang perusahaan Anda butuhkan. AI akan memproses permintaan Anda dan membuatkan rancangan instruksi, batasan, serta rubrik penilaian otomatis untuk kandidat.
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategori Pekerjaan</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as any)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tingkat Kesulitan</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="JUNIOR">Junior (1-2 Tahun)</option>
                    <option value="MEDIOR">Medior (3-5 Tahun)</option>
                    <option value="SENIOR">Senior (5+ Tahun)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-dark-border">
                <Button 
                  type="submit" 
                  isLoading={isSubmitting} 
                  disabled={!aiPrompt}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold text-base shadow-xl"
                >
                  <Sparkles className="h-5 w-5 mr-2" /> Generate & Publish dengan AI
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="manual-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl"
          >
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <Input
                label="Judul Studi Kasus"
                placeholder="Contoh: Implementasi Payment Gateway Berbasis Microservices"
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategori Pekerjaan</label>
                  <select
                    value={manualData.category}
                    onChange={(e) => setManualData({ ...manualData, category: e.target.value as any })}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tingkat Kesulitan</label>
                  <select
                    value={manualData.difficulty}
                    onChange={(e) => setManualData({ ...manualData, difficulty: e.target.value as any })}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="JUNIOR">Junior (1-2 Tahun)</option>
                    <option value="MEDIOR">Medior (3-5 Tahun)</option>
                    <option value="SENIOR">Senior (5+ Tahun)</option>
                  </select>
                </div>
              </div>

              <Textarea
                label="Ringkasan Pendek (Summary)"
                placeholder="Deskripsi singkat yang akan muncul di card direktori..."
                value={manualData.summary}
                onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
                rows={2}
              />

              <Textarea
                label="Deskripsi Lengkap & Instruksi"
                placeholder="Gunakan Markdown untuk membuat poin-poin latar belakang, objektif, dan persyaratan teknis..."
                value={manualData.description}
                onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                rows={8}
              />

              <div className="pt-6 border-t border-dark-border flex justify-end">
                <Button 
                  type="submit" 
                  isLoading={isSubmitting} 
                  disabled={!manualData.title || !manualData.summary || !manualData.description}
                  className="px-8 py-3 font-bold"
                >
                  <PlusCircle className="h-5 w-5 mr-2" /> Publikasikan Tantangan
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
