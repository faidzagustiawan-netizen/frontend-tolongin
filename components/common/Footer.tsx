import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-dark-border bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-display font-bold text-lg text-white">T</span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              Tolongin<span className="text-emerald-500">.co</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            Platform rekrutmen masa depan berbasis pembuktian kinerja nyata (*Real-Performance Hiring*) yang dipadukan dengan penilaian otomatis dan verifikasi identitas AI.
          </p>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Tolongin.co. Hak cipta dilindungi undang-undang.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Eksplorasi</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/challenges" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Challenge Directory
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Papan Peringkat (XP)
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Perusahaan & Mitra</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/register?role=COMPANY" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Daftar sebagai Mitra
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-gray-400 hover:text-emerald-400 transition-colors">
                Dasbor Rekruter
              </Link>
            </li>
            <li>
              <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Dokumentasi API (Swagger)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
