import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Briefcase, ChevronRight, Laptop, Trophy, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

export function DashboardPreview({ user }: { user: any }) {
  const isCompany = user.role === 'COMPANY';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-card via-emerald-950/30 to-cyan-950/30 border border-border p-8 sm:p-12 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="h-4 w-4 flex-shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Sesi Aktif: {user.role}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Selamat Datang Kembali, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{user.email}</span>!
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl">
              {isCompany
                ? 'Pantau kiriman tugas dari para kandidat, rancang studi kasus rekrutmen dengan AI, atau tingkatkan paket langganan instansi Anda.'
                : 'Pilih studi kasus dari direktori, selesaikan dalam batasan waktu profesional, dan kumpulkan poin XP untuk bersaing di puncak papan peringkat.'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {isCompany ? (
              <Link href="/workspace">
                <Button size="lg" className="shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold">
                  Buka Dasbor Rekruter <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/challenges">
                <Button size="lg" className="shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold">
                  Eksplorasi Tantangan <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/challenges" className="group p-6 rounded-3xl bg-dark-card border border-border hover:border-emerald-500/50 hover:bg-dark-card/80 transition-all duration-300 shadow-xl flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Direktori Studi Kasus</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Daftar studi kasus riil dari perusahaan global yang siap Anda kerjakan.</p>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Akses Direktori</span> <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link href="/workspace" className="group p-6 rounded-3xl bg-dark-card border border-border hover:border-cyan-500/50 hover:bg-dark-card/80 transition-all duration-300 shadow-xl flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Laptop className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Workspace & Submisi</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Ruang kerja berwaktu untuk mengumpulkan solusi atau menilai hasil kandidat.</p>
          </div>
          <div className="flex items-center text-xs font-bold text-cyan-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Buka Workspace</span> <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link href="/profile" className="group p-6 rounded-3xl bg-dark-card border border-border hover:border-amber-500/50 hover:bg-dark-card/80 transition-all duration-300 shadow-xl flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Portofolio & Podium</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Etalase karya terverifikasi dan klasemen XP talenta terbaik global.</p>
          </div>
          <div className="flex items-center text-xs font-bold text-amber-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Lihat Peringkat</span> <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link href="/profile" className="group p-6 rounded-3xl bg-dark-card border border-border hover:border-indigo-500/50 hover:bg-dark-card/80 transition-all duration-300 shadow-xl flex flex-col justify-between h-56">
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">KYC & Pengaturan</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Verifikasi biometrik wajah, validasi legalitas instansi, dan manajemen akun.</p>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Atur Profil</span> <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
