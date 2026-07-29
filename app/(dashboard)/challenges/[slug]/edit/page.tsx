'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { challengesService, CreateChallengePayload } from '@/services/challenges.service';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManualBuilder from '../../create/components/ManualBuilder';
import { CompanyAccessGate } from '@/components/company/CompanyAccessGate';

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const { slug } = params as { slug: string };
  const { user, loadUserFromStorage, isAuthenticated } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [manualData, setManualData] = useState<CreateChallengePayload>({
    title: '',
    summary: '',
    description: '',
    category: 'FRONTEND',
    difficulty: 'INTERMEDIATE',
    sections: [{ title: 'Tahap 1', order: 0, components: [], stageType: 'ASSIGNMENT' }],
  });

  useEffect(() => {
    loadUserFromStorage();
    if (isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'TALENT') {
      router.push('/');
    }
  }, [loadUserFromStorage, isAuthenticated, user, router]);

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      challengesService.getOne(slug).then(res => {
        const found = res.data;
        if (found) {
          setManualData({
            id: found.id,
            title: found.title,
            summary: found.summary,
            description: found.description,
            category: found.category,
            difficulty: found.difficulty,
            sections: found.sections || [],
            gradingRubric: found.gradingRubric,
            // Ikut dimuat supaya penyimpanan ulang tidak menghapusnya.
            proctoringSettings: found.proctoringSettings ?? undefined,
            deadlineAt: found.deadlineAt ?? undefined,
            isPrivate: found.isPrivate ?? undefined,
            status: found.status,
          });
        }
      }).catch(err => {
        console.error("Gagal mengambil data draf", err);
        setErrorMsg("Gagal mengambil data draf atau studi kasus.");
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [slug]);

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
        router.push('/challenges/mine');
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
      if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
      
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
    <CompanyAccessGate>
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-400/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none" />
        
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M38 0 C55 5 72 18 100 32 L100 100 L0 100 L0 0 Z" className="fill-primary" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white/90 tracking-tight leading-tight">
            Edit Challenge
          </h1>
          <p className="max-w-2xl text-sm text-white/90 leading-relaxed">
            Perbarui draf atau rincian studi kasus Anda di bawah ini.
          </p>
        </div>
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
        <motion.div
          key="manual-form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Memuat studi kasus...</p>
            </div>
          ) : (
            <ManualBuilder 
              manualData={manualData} 
              setManualData={setManualData}
              handleManualSubmit={handleManualSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </CompanyAccessGate>
  );
}
