'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../common/Button';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'bulanan' | 'tahunan'>('bulanan');

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Paket Fleksibel untuk Segala Skala Organisasi
        </h2>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Rancang dan sebarkan studi kasus tanpa batas, hemat 80% waktu penyaringan rekruter dengan asisten AI terdepan.
        </p>

        {/* Billing Toggle */}
        <div className="pt-6 inline-flex items-center p-1.5 bg-dark-card border border-border rounded-full shadow-lg">
          <button
            onClick={() => setBillingCycle('bulanan')}
            className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all ${
              billingCycle === 'bulanan'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tagihan Bulanan
          </button>
          <button
            onClick={() => setBillingCycle('tahunan')}
            className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 ${
              billingCycle === 'tahunan'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Tagihan Tahunan</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[10px]">HEMAT 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* TIER 1: STARTER */}
        <div className="bg-dark-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-gray-500 transition-colors">
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Starter Instansi</span>
              <h3 className="font-display text-3xl font-extrabold text-white">Gratis Selamanya</h3>
              <p className="text-xs text-gray-400 mt-2">Untuk startup dan tim kecil yang baru mulai menguji kemampuan kandidat.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Maksimal 1 studi kasus aktif</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>10 Submisi kandidat per bulan</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Evaluasi otomatis AI Dasar</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <span className="line-through">Laporan Plagiasi Mendalam</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <span className="line-through">AI Prompt-to-Challenge</span>
              </div>
            </div>
          </div>

          <Link href="/register?role=COMPANY">
            <Button variant="outline" size="lg" className="w-full font-bold py-4 rounded-2xl border-white/10 hover:border-white/20">
              Pilih Starter
            </Button>
          </Link>
        </div>

        {/* TIER 2: PROFESSIONAL (GLOWING POPULAR) */}
        <div className="bg-gradient-to-b from-dark-card via-emerald-950/20 to-dark-card border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl shadow-lg">
            Rekomendasi Utama
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">Professional</span>
              <div className="flex items-baseline gap-1">
                <h3 className="font-display text-4xl font-extrabold text-white">
                  {billingCycle === 'bulanan' ? 'Rp 2.500.000' : 'Rp 2.000.000'}
                </h3>
                <span className="text-xs font-bold text-emerald-400">/ bulan</span>
              </div>
              <p className="text-xs text-gray-300 mt-2">Untuk instansi berkembang yang membutuhkan efisiensi rekrutmen maksimal.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-emerald-500/30">
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Studi kasus aktif tak terbatas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Submisi kandidat tak terbatas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Evaluasi AI Senior (GPT-4o)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Pemeriksaan AST & Plagiasi Kode</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>AI Prompt-to-Challenge Generator</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>Ekspor Laporan PDF Lengkap</span>
              </div>
            </div>
          </div>

          <Link href="/register?role=COMPANY">
            <Button size="lg" className="w-full font-bold py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white">
              Mulai Uji Coba Gratis 14 Hari
            </Button>
          </Link>
        </div>

        {/* TIER 3: ENTERPRISE */}
        <div className="bg-dark-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-gray-500 transition-colors">
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Kustom Enterprise</span>
              <h3 className="font-display text-3xl font-extrabold text-white">Kustom</h3>
              <p className="text-xs text-gray-400 mt-2">Untuk konglomerat & perbankan dengan keamanan dan kepatuhan khusus.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Semua fitur paket Professional</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Integrasi Webhook ke ATS (Greenhouse/Lever)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Manajer Akun Khusus (SLA 99.9%)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Kustomisasi Dokumen NDA Hukum</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Penerapan Peladen Khusus Terisolasi</span>
              </div>
            </div>
          </div>

          <a href="mailto:enterprise@tolongin.co">
            <Button variant="secondary" size="lg" className="w-full font-bold py-4 rounded-2xl border-white/10 hover:border-white/20">
              Hubungi Tim Penjualan
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
