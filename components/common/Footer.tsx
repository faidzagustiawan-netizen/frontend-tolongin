'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { API_ORIGIN } from '@/lib/apiConfig';

export const Footer = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/workspace')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-[#0e2a47] dark:border-border bg-[#061C30] dark:bg-background py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center group">
              <Image
                src="/tolongin-putih.svg"
                alt="Logo Tolongin"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          <p className="text-sm text-slate-300 dark:text-muted-foreground max-w-sm leading-relaxed">
            Platform rekrutmen masa depan berbasis pembuktian kinerja nyata (Real-Performance Hiring) yang dipadukan dengan penilaian otomatis dan verifikasi identitas AI.
          </p>
          <p className="text-xs text-slate-400 dark:text-muted-foreground">
            © {new Date().getFullYear()} Tolongin.co. Hak cipta dilindungi undang-undang.
          </p>
        </div>

        <div className="space-y-3 md:pt-2.5">
          <h4 className="text-sm font-semibold text-slate-100 dark:text-foreground tracking-wider uppercase">Eksplorasi</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/challenges" className="text-slate-300 dark:text-muted-foreground hover:text-emerald-400 transition-colors">
                Direktori Studi Kasus
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="text-slate-300 dark:text-muted-foreground hover:text-emerald-400 transition-colors">
                Papan Peringkat (XP)
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 md:pt-2.5">
          <h4 className="text-sm font-semibold text-slate-100 dark:text-foreground tracking-wider uppercase">Perusahaan & Mitra</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/register?role=COMPANY" className="text-slate-300 dark:text-muted-foreground hover:text-emerald-400 transition-colors">
                Daftar sebagai Mitra
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-slate-300 dark:text-muted-foreground hover:text-emerald-400 transition-colors">
                Dasbor Rekruter
              </Link>
            </li>
            <li>
              <a href={`${API_ORIGIN}/api/docs`} target="_blank" rel="noreferrer" className="text-slate-300 dark:text-muted-foreground hover:text-cyan-400 transition-colors">
                Dokumentasi API (Swagger)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
