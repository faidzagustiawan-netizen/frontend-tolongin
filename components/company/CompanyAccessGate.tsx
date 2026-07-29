'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

/**
 * Gerbang akses untuk perusahaan yang belum diverifikasi admin.
 *
 * Backend sudah menutup rapat lewat `VerifiedCompanyGuard` — challenge-stats,
 * pembuatan challenge, dan seluruh controller submissions menolak dengan 403
 * selama `isVerified === false`. Yang hilang adalah padanannya di layar:
 * sebelumnya penjelasan "Menunggu Persetujuan Admin" dipasang di
 * `(dashboard)/workspace/layout.tsx`, rute workspace milik talenta yang tidak
 * pernah dibuka perusahaan. Akibatnya perusahaan baru melihat dasbor kosong
 * tanpa sebab, lalu mengisi seluruh formulir challenge sebelum ditolak 403.
 *
 * Komponen ini tidak menggantikan gerbang backend, hanya menjelaskannya lebih
 * awal. Untuk peran selain COMPANY isinya diteruskan apa adanya.
 */
/**
 * Keadaan KYB yang sebenarnya, bukan satu kalimat tetap.
 *
 * Sebelumnya gerbang ini selalu menulis "Menunggu tinjauan" — termasuk kepada
 * perusahaan yang belum mengirim satu pun dokumen. Perusahaan itu menunggu
 * kabar yang tidak akan pernah datang, karena tidak ada yang sedang ditinjau.
 */
const KYB_STATE = {
  UNVERIFIED: {
    label: 'Dokumen belum dikirim',
    tone: 'text-warning',
    dot: 'bg-amber-500',
    explanation:
      'Kami belum menerima dokumen legalitas usaha Anda. Peninjauan baru dimulai setelah dokumennya dikirim.',
    ctaLabel: 'Kirim Dokumen Legalitas (KYB)',
    isWaitingOnUser: true,
  },
  PENDING: {
    label: 'Menunggu tinjauan',
    tone: 'text-warning',
    dot: 'bg-amber-500',
    explanation:
      'Dokumen legalitas usaha (KYB) Anda sudah kami terima dan sedang ditinjau tim admin — biasanya selesai dalam 1x24 jam kerja.',
    ctaLabel: 'Periksa Dokumen yang Dikirim',
    isWaitingOnUser: false,
  },
  REJECTED: {
    label: 'Dokumen ditolak',
    tone: 'text-danger',
    dot: 'bg-red-500',
    explanation:
      'Dokumen legalitas yang Anda kirim belum bisa kami terima. Silakan periksa kembali dan kirim ulang dokumen yang sesuai.',
    ctaLabel: 'Kirim Ulang Dokumen',
    isWaitingOnUser: true,
  },
  VERIFIED: {
    label: 'Terverifikasi',
    tone: 'text-success',
    dot: 'bg-emerald-500',
    explanation:
      'Legalitas usaha Anda sudah terverifikasi. Aktivasi akun sedang diselesaikan admin.',
    ctaLabel: 'Buka Profil Perusahaan',
    isWaitingOnUser: false,
  },
} as const;

export function CompanyAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();

  const isPendingApproval =
    user?.role === 'COMPANY' && user?.isVerified === false;

  if (!isPendingApproval) {
    return <>{children}</>;
  }

  const kybStatus = (user?.profile as { kybStatus?: string } | undefined)
    ?.kybStatus;
  const state =
    KYB_STATE[(kybStatus as keyof typeof KYB_STATE) ?? 'UNVERIFIED'] ??
    KYB_STATE.UNVERIFIED;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center space-y-6 max-w-lg p-8 bg-card border border-border rounded-2xl shadow-xl">
        <div className="mx-auto w-20 h-20 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-full">
          <Clock className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-foreground">
            {state.isWaitingOnUser
              ? 'Satu Langkah Lagi Sebelum Akun Aktif'
              : 'Menunggu Persetujuan Admin'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {state.explanation}
          </p>
        </div>

        <div className="bg-foreground/5 p-4 rounded-xl text-left border border-border">
          <p className="text-xs font-semibold text-foreground mb-2">
            Status verifikasi legalitas (KYB)
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {!state.isWaitingOnUser && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${state.dot} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${state.dot}`} />
            </span>
            <span className={`text-sm font-medium ${state.tone}`}>
              {state.label}
            </span>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-left space-y-2">
          <div className="flex items-center gap-2 text-success">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs font-semibold">
              {state.isWaitingOnUser ? 'Yang perlu Anda lakukan' : 'Sambil menunggu'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {state.isWaitingOnUser
              ? 'Kirim Nomor Induk Berusaha (NIB) atau NPWP perusahaan beserta tautan dokumennya di halaman profil.'
              : 'Lengkapi profil perusahaan Anda supaya peninjauan tidak tertahan.'}
          </p>
          <Link
            href="/settings"
            className="inline-block text-xs font-bold text-success hover:opacity-80 transition-opacity"
          >
            {state.ctaLabel}
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Kami kirim email begitu akun Anda disetujui.
        </p>
      </div>
    </div>
  );
}
