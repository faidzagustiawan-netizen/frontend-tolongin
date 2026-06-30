'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import {
  ArrowRight, Code2, ShieldCheck, Trophy, Sparkles, Building2, Users,
  CheckCircle2, Zap, Briefcase, Award, ChevronRight, Star, Laptop, Flame, Lock
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { TestimonialMarquee } from '../components/common/TestimonialMarquee';

export default function Home() {
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();
  const [billingCycle, setBillingCycle] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const [ripple1, setRipple1] = useState({ x: 0, y: 0, active: false });
  const [ripple2, setRipple2] = useState({ x: 0, y: 0, active: false });

  const handleMouseEnter1 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple1({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeave1 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple1({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: false });
  };

  const handleMouseEnter2 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple2({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeave2 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple2({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: false });
  };

  const heroWords = ['kesempatan nyata', 'pengalaman industri', 'proyek profesional', 'karier terbaik'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Jika Pengguna Sudah Masuk (Logged In), Tampilkan Dasbor Ringkas Personal
  if (isAuthenticated && user) {
    const isCompany = user.role === 'COMPANY';
    const isAdmin = user.role === 'ADMIN';

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

  // ==========================================
  // JIKA BELUM MASUK (LOGGED OUT), TAMPILKAN HERO & PRICING PREMIUM
  // ==========================================
  return (
    <div className="w-full flex flex-col items-center selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* HERO SECTION */}
      <section
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center overflow-hidden hero-no-cursor"
      >
        {isHoveringHero && (
          <motion.div
            style={{
              position: 'fixed',
              left: mouseX,
              top: mouseY,
              pointerEvents: 'none',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-start',
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              style={{ display: 'block', flexShrink: 0 }}
            >
              <path
                d="M2,2 L18,6 Q9,9 6,18 Z"
                fill="black"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="miter"
              />
            </svg>
            <div
              style={{
                backgroundColor: '#000000',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                marginTop: '9px',
                marginLeft: '-7px',
              }}
              className="text-[11.5px] font-bold px-2.5 py-1.5 rounded-full border shadow-lg text-white-keep"
            >
              You
            </div>
          </motion.div>
        )}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none -z-10" />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-medium text-white tracking-tight max-w-5xl mx-auto leading-tight"
        >
          Setiap talenta layak mendapat <br className="hidden sm:block" />
          <div className="relative inline-block h-[1.2em] overflow-visible w-full mt-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={currentWordIndex}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute left-0 right-0 text-transparent bg-clip-text bg-gradient-to-r from-[#1e7f4d] to-[#2aa565]"
              >
                {heroWords[currentWordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/login">
            <Button
              size="lg"
              onMouseEnter={handleMouseEnter1}
              onMouseLeave={handleMouseLeave1}
              className="text-base font-bold px-8 py-4 shadow-2xl relative overflow-hidden bg-[var(--btn-primary-bg-default)] text-white border-transparent hover:border-transparent transition-none"
            >
              <span className="relative z-10 flex items-center justify-center pointer-events-none">
                Mulai Eksplorasi Sekarang
                <ArrowRight className="ml-2 h-5 w-5 pointer-events-none" />
              </span>
              <span
                style={{
                  position: 'absolute',
                  left: ripple1.x,
                  top: ripple1.y,
                  transform: `translate(-50%, -50%) scale(${ripple1.active ? 150 : 0})`,
                  transition: `transform ${ripple1.active ? '0.5s' : '0.2s'} ease-out`,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--btn-primary-bg-hover)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            </Button>
          </Link>
          <Link href="/register?role=COMPANY">
            <Button
              variant="outline"
              size="lg"
              onMouseEnter={handleMouseEnter2}
              onMouseLeave={handleMouseLeave2}
              className="text-base font-bold px-8 py-4 relative overflow-hidden bg-[var(--btn-secondary-bg-default)] border border-[var(--btn-secondary-border-default)] hover:border-[var(--btn-secondary-border-hover)] transition-none"
            >
              <span className="relative z-10 flex items-center justify-center pointer-events-none transition-none" style={{ color: ripple2.active ? 'var(--btn-secondary-text-hover)' : 'var(--btn-secondary-text-default)' }}>
                Bergabung Sebagai Mitra Perusahaan
              </span>
              <span
                style={{
                  position: 'absolute',
                  left: ripple2.x,
                  top: ripple2.y,
                  transform: `translate(-50%, -50%) scale(${ripple2.active ? 150 : 0})`,
                  transition: `transform ${ripple2.active ? '0.5s' : '0.2s'} ease-out`,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--btn-secondary-bg-hover)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* CORE VALUE PILLARS */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Menghilangkan Friksi, Bias, & Kecurangan
          </h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto">
            Kami mengkombinasikan teknologi kecerdasan buatan mutakhir dan gamifikasi untuk memberikan standar asesmen tertinggi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white transition-colors duration-300 group-hover:text-emerald-500">Biometrik Wajah & KTP</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Fitur verifikasi identitas berlapis membandingkan keaslian wajah kandidat saat mengerjakan studi kasus dengan kartu identitas legal, menjamin integritas penuh.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/biometrik.svg"
                  alt="Biometrik"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="group bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white transition-colors duration-300 group-hover:text-emerald-500">Mesin Koreksi Otomatis AI</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Penilaian canggih menganalisis pohon sintaksis kode (AST), kompleksitas Big-O, celah keamanan OWASP, dan indeks plagiasi dalam hitungan detik.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/koreksi.svg"
                  alt="Koreksi Otomatis"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="group bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 ">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-white transition-colors duration-300 group-hover:text-emerald-500">Gamifikasi Papan Peringkat</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Setiap penyelesaian studi kasus dikonversi menjadi lencana portofolio terverifikasi dan akumulasi XP untuk menduduki puncak podium talenta global.
              </p>
              <div className="h-30 w-30 rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/gamifikasi.svg"
                  alt="Gamifikasi"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL MARQUEE SECTION */}
      <TestimonialMarquee />

      {/* ======================================================= */}
      {/* PROFESSIONAL COMPANY PRICING & SUBSCRIPTION PLANS       */}
      {/* ======================================================= */}
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

      {/* FOOTER BANNER CTA */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)] pointer-events-none" />

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight mb-6">
            Siap Membangun Tim Teknologi Kelas Dunia?
          </h2>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Bergabunglah dengan ribuan talenta dan ratusan instansi terdepan di ekosistem Tolongin.co sekarang.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 z-10 relative">
            <Link href="/register">
              <Button size="lg" className="bg-dark-bg text-white hover:bg-dark-card border border-white/10 shadow-2xl font-bold px-8 py-4 rounded-2xl">
                Daftar Sebagai Kandidat
              </Button>
            </Link>
            <Link href="/register?role=COMPANY">
              <Button size="lg" className="bg-white text-emerald-950 hover:bg-white/90 shadow-2xl font-bold px-8 py-4 rounded-2xl">
                Daftar Sebagai Perusahaan
              </Button>
            </Link>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          <div className="bg-dark-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-1">50.000+</h3>
            <p className="text-xs font-semibold text-gray-400">Talenta Terverifikasi Biometrik</p>
          </div>
          <div className="bg-dark-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-1">500+</h3>
            <p className="text-xs font-semibold text-gray-400">Perusahaan & Startup Mitra</p>
          </div>
          <div className="bg-dark-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-1">99.4%</h3>
            <p className="text-xs font-semibold text-gray-400">Akurasi AI Evaluator</p>
          </div>
          <div className="bg-dark-card/60 border border-border rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-amber-400 mb-1">Rp 35M+</h3>
            <p className="text-xs font-semibold text-gray-400">Total Penawaran Kerja Terjalin</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
