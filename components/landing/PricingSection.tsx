'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../common/Button';
import { getPlan } from '../../lib/plans';

/**
 * Harga dan kuota diambil dari `lib/plans.ts` supaya halaman pemasaran tidak
 * bisa lagi menjanjikan sesuatu yang berbeda dari yang ditagih di checkout.
 *
 * Yang dihapus dari versi sebelumnya karena tidak ada di produk: pilihan
 * tagihan tahunan "HEMAT 20%" (backend mengalikan harga bulanan dengan jumlah
 * bulan, tanpa potongan apa pun), "studi kasus/submisi tak terbatas" pada
 * paket Professional yang sebenarnya dibatasi 5 studi kasus aktif, serta ajakan
 * "Uji Coba Gratis 14 Hari" yang tidak punya implementasi trial sama sekali.
 */
export function PricingSection() {
  const starter = getPlan('STARTUP');
  const professional = getPlan('KONGLOMERAT');

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-title tracking-tight leading-tight">
          Paket Fleksibel untuk Segala Skala Organisasi
        </h2>
        <p className="text-muted text-base max-w-2xl mx-auto">
          Rancang studi kasus, biarkan AI menilai submisi kandidat, dan pangkas
          waktu penyaringan rekruter Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* TIER 1: STARTER */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-gray-500 transition-colors">
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-gray-500/10 border border-gray-500/20 text-xs font-bold text-muted uppercase tracking-wider mb-3">Starter Instansi</span>
              <h3 className="font-display text-3xl font-extrabold text-title">Gratis Selamanya</h3>
              <p className="text-xs text-muted mt-2">Untuk startup dan tim kecil yang baru mulai menguji kemampuan kandidat.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              {starter.features.map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-body">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 text-sm text-muted">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="line-through">Evaluasi otomatis AI</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="line-through">AI Prompt-to-Challenge</span>
              </div>
            </div>
          </div>

          <Link href="/register?role=COMPANY">
            <Button variant="outline" size="lg" className="w-full font-bold py-4 rounded-2xl border-gray-500/30 hover:border-gray-500/60">
              Pilih Starter
            </Button>
          </Link>
        </div>

        {/* TIER 2: PROFESSIONAL (GLOWING POPULAR) */}
        <div className="bg-gradient-to-b from-card via-emerald-950/20 to-card border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl shadow-lg">
            Rekomendasi Utama
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">Professional</span>
              <div className="flex items-baseline gap-1">
                <h3 className="font-display text-4xl font-extrabold text-title">
                  {professional.priceLabel}
                </h3>
                <span className="text-xs font-bold text-emerald-500">/ bulan</span>
              </div>
              <p className="text-xs text-muted mt-2">Untuk instansi berkembang yang membutuhkan efisiensi rekrutmen maksimal.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-emerald-500/30">
              {professional.features.map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-title font-medium">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/register?role=COMPANY">
            <Button size="lg" className="w-full font-bold py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/20 text-white">
              Mulai dari Paket Gratis
            </Button>
          </Link>
        </div>

        {/* TIER 3: ENTERPRISE */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-8 relative overflow-hidden group hover:border-gray-500 transition-colors">
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Kustom Enterprise</span>
              <h3 className="font-display text-3xl font-extrabold text-foreground">Kustom</h3>
              <p className="text-xs text-muted-foreground mt-2">Untuk konglomerat & perbankan dengan keamanan dan kepatuhan khusus.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Semua fitur paket Professional</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Integrasi Webhook ke ATS (Greenhouse/Lever)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Manajer Akun Khusus (SLA 99.9%)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Kustomisasi Dokumen NDA Hukum</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span>Penerapan Peladen Khusus Terisolasi</span>
              </div>
            </div>
          </div>

          <a href="mailto:enterprise@tolongin.co">
            <Button variant="secondary" size="lg" className="w-full font-bold py-4 rounded-2xl border-foreground/10 hover:border-foreground/20">
              Hubungi Tim Penjualan
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
