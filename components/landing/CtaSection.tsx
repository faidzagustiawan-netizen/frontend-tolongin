'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { StaggerContainer, StaggerItem, FadeIn } from '../animations';

export function CtaSection() {
  return (
    <div className="w-full pb-20">
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeIn y={30} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-950 border border-emerald-500/30 p-6 sm:p-12 lg:p-20 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Siap Membangun Tim <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Teknologi Kelas Dunia?</span>
            </h2>
            <p className="text-base sm:text-lg text-emerald-100/80">
              Bergabung dengan 500+ perusahaan inovatif yang telah beralih dari tes algoritmik usang ke rekrutmen berbasis studi kasus nyata.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register?role=COMPANY">
                <Button size="lg" className="w-full sm:w-auto font-bold px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20">
                  Mulai Perekrutan Cerdas <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold px-8 py-4 border-white/20 text-white hover:border-white/40 hover:bg-white/10">
                  Jadwalkan Demo AI
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>

        <StaggerContainer className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <StaggerItem className="bg-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-title mb-1">50.000+</h3>
            <p className="text-xs font-semibold text-muted">Talenta Terverifikasi Biometrik</p>
          </StaggerItem>
          <StaggerItem className="bg-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 mb-1">500+</h3>
            <p className="text-xs font-semibold text-muted">Perusahaan & Startup Mitra</p>
          </StaggerItem>
          <StaggerItem className="bg-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-teal-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-title mb-1">99.4%</h3>
            <p className="text-xs font-semibold text-muted">Akurasi AI Evaluator</p>
          </StaggerItem>
          <StaggerItem className="bg-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-amber-500 mb-1">Rp 35M+</h3>
            <p className="text-xs font-semibold text-muted">Total Penawaran Kerja Terjalin</p>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </div>
  );
}
