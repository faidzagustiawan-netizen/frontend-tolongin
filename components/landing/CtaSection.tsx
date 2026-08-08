'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { FadeIn } from '../animations';
import { WHATSAPP_SALES_URL } from '@/lib/plans';

export function CtaSection() {
  return (
    <div className="w-full pb-20">
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeIn y={30} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-950 border border-emerald-500/30 p-6 sm:p-12 lg:p-20 text-center shadow-2xl">
          {/* Lapisan tekstur noise dibuang: berkas gambarnya tidak pernah ada
              di public/ maupun di riwayat repo, jadi lapisan itu selalu 404
              dan tidak pernah menggambar apa pun — hanya satu permintaan gagal
              setiap kali halaman depan dibuka. */}
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
              {/* Dulu menuju `/contact`, rute yang tidak pernah ada di `app/`.
                  Ajakan bertindak paling menonjol di halaman depan berujung 404. */}
              <a href={WHATSAPP_SALES_URL} target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold px-8 py-4 border-white/20 text-white hover:border-white/40 hover:bg-white/10">
                  Jadwalkan Demo AI
                </Button>
              </a>
            </div>
          </div>
        </FadeIn>
        
      </section>
    </div>
  );
}
