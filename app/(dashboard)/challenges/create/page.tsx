'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { challengesService, CreateChallengePayload } from '@/services/challenges.service';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { Sparkles, Briefcase, PlusCircle, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManualBuilder from './components/ManualBuilder';
export default function CreateChallengePage() {
  const router = useRouter();
  const { user, loadUserFromStorage, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'MANUAL' | 'AI'>('TEMPLATES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    // Fetch templates
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates`)
      .then(res => res.json())
      .then(data => {
        setTemplates(Array.isArray(data) ? data : []);
        setIsLoadingTemplates(false);
      })
      .catch(err => {
        console.error('Failed to load templates:', err);
        setIsLoadingTemplates(false);
      });
  }, []);

  const handleCloneTemplate = async (templateId: string) => {
    if (!isAuthenticated) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/templates/${templateId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Gagal menduplikasi template (${res.status})`);
      }
      const data = await res.json();
      
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
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUserFromStorage();
    if (isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'TALENT') {
      router.push('/');
    }
  }, [loadUserFromStorage, isAuthenticated, user, router]);

  // States for AI Form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<'UI_UX' | 'FRONTEND' | 'BACKEND' | 'DATA_SCIENCE' | 'MARKETING' | 'PRODUCT'>('FRONTEND');
  const [aiDifficulty, setAiDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [aiBlueprint, setAiBlueprint] = useState<any>(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');

  // States for Manual Form
  const [manualData, setManualData] = useState<CreateChallengePayload>({
    title: '',
    summary: '',
    description: '',
    category: 'FRONTEND',
    difficulty: 'INTERMEDIATE',
    sections: [{ title: 'Tahap 1', order: 0, components: [], stageType: 'ASSIGNMENT' }],
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('draftChallenge');
      if (savedData) {
        try {
          setManualData(JSON.parse(savedData));
        } catch (e) {
          console.error("Failed to parse saved draft", e);
        }
      }

      const savedAiState = localStorage.getItem('aiDraftState');
      if (savedAiState) {
        try {
          const parsed = JSON.parse(savedAiState);
          if (parsed.aiPrompt) setAiPrompt(parsed.aiPrompt);
          if (parsed.aiCategory) setAiCategory(parsed.aiCategory);
          if (parsed.aiDifficulty) setAiDifficulty(parsed.aiDifficulty);
          if (parsed.aiBlueprint) setAiBlueprint(parsed.aiBlueprint);
        } catch (e) {
          console.error("Failed to parse saved AI draft", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('draftChallenge', JSON.stringify(manualData));
    }
  }, [manualData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiDraftState', JSON.stringify({
        aiPrompt,
        aiCategory,
        aiDifficulty,
        aiBlueprint,
      }));
    }
  }, [aiPrompt, aiCategory, aiDifficulty, aiBlueprint]);

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

  const handleAiGenerate = async () => {
    if (!aiPrompt || !aiBlueprint) return;
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
      setSuccessMsg('Proses generasi soal dan rubrik sedang berjalan di latar belakang! Silakan cek notifikasi atau Dashboard Anda beberapa saat lagi.');
      
      // Bersihkan cache dan redirect langsung ke dashboard
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aiDraftState');
      }
      setTimeout(() => {
        router.push(`/`);
      }, 3000); // Beri waktu 3 detik agar user bisa membaca pesan sukses
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
      
      setSuccessMsg(status === 'DRAFT' ? 'Draf berhasil disimpan!' : 'Studi kasus berhasil dipublikasikan!');
      setTimeout(() => {
        localStorage.removeItem('draftChallenge');
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan studi kasus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGlobalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (target.tagName === 'BUTTON') return;
      
      // Don't intercept if they are inside a modal or portal that isn't child of currentTarget
      if (!e.currentTarget.contains(target)) return;

      e.preventDefault();
      const focusableElements = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';
      const elements = Array.from(e.currentTarget.querySelectorAll(focusableElements)) as HTMLElement[];
      const index = elements.indexOf(target);
      
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  if (!user || (user.role !== 'COMPANY' && user.role !== 'TALENT')) {
    return null;
  }

  return (
    <div 
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
      onKeyDown={handleGlobalKeyDown}
    >
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
        <div className="relative group w-full sm:w-auto">
          <button
            onClick={() => {
              if (user?.profile?.subscriptionTier !== 'STARTUP') {
                setActiveTab('AI');
              }
            }}
            disabled={user?.profile?.subscriptionTier === 'STARTUP'}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
              activeTab === 'AI' ? 'bg-primary text-white shadow-lg border border-primary' : 'text-muted-foreground hover:text-foreground'
            } ${user?.profile?.subscriptionTier === 'STARTUP' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Sparkles className="h-4 w-4" /> AI Auto-Generate
          </button>
          {user?.profile?.subscriptionTier === 'STARTUP' && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-border text-xs text-foreground font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Tingkatkan ke Pro untuk Akses AI
            </div>
          )}
        </div>
        <button
            onClick={() => setActiveTab('MANUAL')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all w-full sm:w-auto ${
              activeTab === 'MANUAL'
            ? 'bg-primary text-white shadow-lg border border-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Pembuatan Manual</span>
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
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Memuat Role-Based Templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
                <Briefcase className="h-12 w-12 mb-4 opacity-50" />
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
                    
                    <Button 
                      onClick={() => handleCloneTemplate(tpl.id)}
                      disabled={isSubmitting}
                      className="w-full font-bold"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gunakan Template Ini"}
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
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
                          <span className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> AI Reasoning
                          </span>
                          <p className="text-foreground text-sm mt-2 italic">{aiBlueprint.reasoning}</p>
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
                        <span className="text-xs font-bold text-muted-foreground uppercase">Tahapan & Silabus Ujian</span>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {aiBlueprint.sections_outline?.map((sec: any, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{sec.title}</span> - {sec.competencies?.join(', ')}
                            </li>
                          ))}
                        </ul>
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
                      onClick={handleAiGenerate}
                      isLoading={isSubmitting} 
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold shadow-xl"
                    >
                      <Sparkles className="h-5 w-5 mr-2" /> Konfirmasi & Buat Detail Soal
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
            <ManualBuilder 
              manualData={manualData} 
              setManualData={setManualData}
              handleManualSubmit={handleManualSubmit}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

