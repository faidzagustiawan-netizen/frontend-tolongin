'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { subscriptionsService } from '@/services/subscriptions.service';
import { PLANS, WHATSAPP_SALES_URL, type Plan } from '@/lib/plans';
import {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_SANDBOX,
  MIDTRANS_SNAP_URL,
  isMidtransConfigured,
} from '@/lib/midtrans';
import { Button } from '@/components/common/Button';
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  Shield,
  Crown,
  CreditCard,
  Loader2,
  MessageSquare,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Script from 'next/script';

const tierIcon = {
  STARTUP: <Shield className="h-5 w-5 text-muted-foreground" />,
  KONGLOMERAT: <Zap className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />,
  CUSTOM: <Crown className="h-5 w-5 text-amber-400 fill-amber-400/20" />,
} as const;

export default function BillingPage() {
  const { user, isHydrated, loadUserFromStorage } = useUserStore();
  const router = useRouter();
  const [pendingTier, setPendingTier] = useState<string | null>(null);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (user && user.role !== 'COMPANY' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  // Tanggal berakhir langganan hanya ada di server; localStorage menyimpan
  // potret saat login saja. Tanpa ini halaman berjudul "Langganan & Tagihan"
  // tidak menampilkan satu pun informasi langganan yang sedang berjalan.
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: () => subscriptionsService.getStatus(),
    // Endpoint statusnya kini khusus pemilik. Tanpa syarat ini anggota tim
    // menembak permintaan yang pasti dijawab 403 setiap kali halaman terbuka.
    enabled: !!user && user.role === 'COMPANY' && user.isCompanyOwner === true,
  });

  const currentTier =
    statusData?.data?.subscriptionTier ||
    user?.profile?.subscriptionTier ||
    'STARTUP';
  const expiresAt = statusData?.data?.subscriptionExpiresAt;

  const statusErrorMessage =
    (statusError as any)?.message || 'Server tidak dapat dihubungi.';

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.tier === currentTier) return;

    if (!plan.selfServe) {
      window.open(WHATSAPP_SALES_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    // `POST /payments/subscribe` selalu menagih paket Pro apa pun yang dikirim
    // dari sini. Turun paket karena itu tidak boleh lewat jalur checkout —
    // sebelumnya kartu Startup tampil sebagai tombol aktif berlabel "Paket Anda
    // Saat Ini" dan menekannya menagih Rp 2.500.000 untuk paket Pro.
    //
    // Penurunan paket memang diproses manual, tetapi menyuruh "hubungi tim
    // kami" lewat toast tanpa tautan tidak memberi jalan ke mana pun. Tombolnya
    // kini membuka percakapan sales yang sama dengan kartu Custom.
    const currentRank = PLANS.findIndex((p) => p.tier === currentTier);
    const targetRank = PLANS.findIndex((p) => p.tier === plan.tier);
    if (targetRank < currentRank) {
      window.open(WHATSAPP_SALES_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!isMidtransConfigured) {
      toast.error(
        'Pembayaran mandiri sedang tidak tersedia. Hubungi tim kami untuk mengaktifkan paket Anda.',
      );
      return;
    }

    setPendingTier(plan.tier);
    try {
      const { PaymentsService } = await import('@/services/payments.service');
      const result = await PaymentsService.subscribePremium();

      if (!result.snapToken) {
        throw new Error('Payment Gateway tidak mengembalikan token pembayaran.');
      }

      if (typeof (window as any).snap?.pay !== 'function') {
        throw new Error(
          'Jendela pembayaran gagal dimuat. Periksa koneksi Anda lalu coba lagi.',
        );
      }

      (window as any).snap.pay(result.snapToken, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil. Paket Anda segera aktif.');
          window.location.reload();
        },
        onPending: () => {
          toast('Pembayaran Anda sedang menunggu penyelesaian.', { icon: '⏳' });
          setPendingTier(null);
        },
        onError: () => {
          toast.error('Pembayaran gagal diproses.');
          setPendingTier(null);
        },
        onClose: () => {
          // Menutup jendela di tengah jalan adalah pembatalan, dan sebelumnya
          // tidak meninggalkan jejak apa pun selain indikator yang berhenti
          // sendiri — tidak terbedakan dari pembayaran yang gagal diam-diam.
          toast('Pembayaran dibatalkan. Paket Anda belum berubah.', {
            icon: 'ℹ️',
          });
          setPendingTier(null);
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghubungi Payment Gateway.');
      setPendingTier(null);
    }
    // Tanpa `finally`: `snap.pay` membuka jendela pembayaran lalu langsung
    // kembali. Membersihkan keadaan memuat di sini akan menghentikan indikator
    // tepat ketika jendela pembayaran baru saja terbuka. Yang menutupnya adalah
    // callback Snap di atas.
  };

  // `isHydrated` membedakan "sesi belum selesai dibaca" dari "bukan
  // perusahaan". Tanpa itu menyegarkan halaman ini menampilkan layar putih
  // kepada akun perusahaan yang sah selama sepersekian detik pertama.
  if (!isHydrated) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <div className="h-10 bg-foreground/5 rounded-xl w-1/3 mx-auto" />
        <div className="h-24 bg-foreground/5 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-80 bg-foreground/5 rounded-3xl" />
          <div className="h-80 bg-foreground/5 rounded-3xl" />
          <div className="h-80 bg-foreground/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'COMPANY' && user.role !== 'ADMIN')) {
    return null;
  }

  // Langganan dibeli atas nama perusahaan, dan hanya pemiliknya yang boleh
  // membelanjakannya. Sebelumnya halaman ini hanya menyaring peran, sehingga
  // akun yang masuk lewat kode undangan melihat seluruh kartu paket beserta
  // tombol belinya. Menekannya bukan sekadar salah izin: webhook mengaktifkan
  // paket lewat CompanyProfile milik pembayar, dan akun undangan tidak
  // memilikinya — uangnya tertagih, paketnya tidak pernah aktif.
  if (user.role === 'COMPANY' && user.isCompanyOwner !== true) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="max-w-md text-center space-y-3 p-8 bg-card border border-border rounded-2xl">
          <Shield className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <h1 className="text-lg font-bold font-display text-foreground">
            Khusus Pemilik Akun
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Langganan dan tagihan dikelola oleh pemilik akun perusahaan.
            Sampaikan kebutuhan peningkatan paket kepada pemilik akun Anda.
          </p>
        </div>
      </div>
    );
  }

  const activePlan = PLANS.find((p) => p.tier === currentTier) ?? PLANS[0];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
          Langganan &amp; Tagihan
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Tingkatkan kuota studi kasus dan buka penilaian otomatis AI untuk
          setiap submisi kandidat.
        </p>
      </div>

      {/* Lingkungan sandbox tidak menagih apa pun. Dikatakan terang-terangan
          supaya "pembayaran berhasil" di layar tidak disangka tagihan nyata. */}
      {isMidtransConfigured && MIDTRANS_IS_SANDBOX && (
        <div
          role="status"
          className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-center"
        >
          <p className="text-xs font-semibold text-warning">
            Mode uji coba pembayaran. Transaksi di halaman ini tidak menagih
            dana sungguhan.
          </p>
        </div>
      )}

      {!isMidtransConfigured && (
        <div
          role="status"
          className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-center"
        >
          <p className="text-xs font-semibold text-warning">
            Pembayaran mandiri sedang tidak tersedia. Hubungi tim kami untuk
            mengaktifkan atau meningkatkan paket.
          </p>
        </div>
      )}

      {/* Ringkasan langganan berjalan.

          Saat status dari server gagal dimuat, yang tampil adalah kegagalannya
          — bukan tier cadangan dari localStorage beserta "Tanpa tanggal
          berakhir". Nilai bawaan itu memberi tahu pelanggan Pro bahwa
          langganannya tidak punya masa berlaku, keterangan yang salah persis
          pada saat halaman ini tidak tahu apa-apa. */}
      {isStatusError ? (
        <div
          role="alert"
          className="bg-danger/10 border border-danger/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-danger flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-danger">
                Status langganan gagal dimuat
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {statusErrorMessage} Paket berjalan dan masa berlakunya tidak
                bisa dipastikan sampai halaman ini berhasil menghubungi server.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchStatus()}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Muat ulang
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Paket berjalan
              </p>
              <p className="font-display text-xl font-bold text-foreground">
                {activePlan.name}
                <span className="text-sm font-medium text-muted-foreground ml-2">
                  {activePlan.priceLabel}
                  {activePlan.monthlyPrice ? ' / bln' : ''}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            {isStatusLoading ? (
              /* Selama permintaannya masih berjalan, tanggalnya belum diketahui
                 — bukan berarti tidak ada. */
              <span>Memuat masa berlaku...</span>
            ) : expiresAt ? (
              <span>
                Berlaku hingga{' '}
                <span className="font-semibold text-foreground">
                  {new Date(expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
            ) : activePlan.monthlyPrice ? (
              /* Paket berbayar tanpa tanggal berakhir bukan "berlaku
                 selamanya", melainkan catatan yang tidak lengkap. */
              <span>Masa berlaku belum tercatat</span>
            ) : (
              <span>Tanpa tanggal berakhir</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan, idx) => {
          const isCurrent = currentTier === plan.tier;
          const isPro = plan.tier === 'KONGLOMERAT';
          const isBusy = pendingTier === plan.tier;

          const currentRank = PLANS.findIndex((p) => p.tier === currentTier);
          const isDowngrade = idx < currentRank;

          // Penurunan paket berujung di percakapan sales, jadi labelnya
          // mengatakan begitu. "Turunkan Paket" menjanjikan perubahan yang
          // tidak terjadi sekali klik.
          const opensWhatsApp = !plan.selfServe || isDowngrade;

          const label = isCurrent
            ? 'Paket Anda Saat Ini'
            : !plan.selfServe
              ? 'Hubungi via WhatsApp'
              : isDowngrade
                ? 'Turunkan lewat WhatsApp'
                : `Tingkatkan ke ${plan.name}`;

          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-card border rounded-3xl p-8 flex flex-col ${
                isCurrent
                  ? 'border-emerald-500/60 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]'
                  : isPro
                    ? 'border-emerald-500/30'
                    : 'border-border'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Paket Aktif
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2">
                  {tierIcon[plan.tier]}
                  <h3 className="font-display font-bold text-lg text-foreground">
                    {plan.name}
                  </h3>
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {plan.priceLabel}
                  {plan.monthlyPrice ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      {' '}
                      / bln
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fitur Utama
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || isBusy}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-foreground/5 text-muted-foreground cursor-not-allowed border border-foreground/10'
                    : isPro
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                      : 'bg-foreground/10 text-foreground hover:bg-foreground/20 border border-foreground/10'
                }`}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {!isCurrent &&
                      (opensWhatsApp ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      ))}
                    {label}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Faktur per transaksi memang belum ada di sini. Yang berubah: pengguna
          diberi jalan keluar yang bisa ditempuh, bukan sekadar diberi tahu
          bahwa fiturnya tidak ada. */}
      <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Butuh faktur atau riwayat tagihan?
        </p>
        <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Bukti pembayaran otomatis dikirim ke email penanggung jawab akun oleh
          penyedia pembayaran. Untuk faktur ber-NPWP atau rekapitulasi tagihan
          keperluan finance, mintakan ke tim kami.
        </p>
        <a
          href={WHATSAPP_SALES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-success hover:opacity-80 transition-opacity"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Minta faktur ke tim kami
        </a>
      </div>

      {isMidtransConfigured && (
        <Script
          src={MIDTRANS_SNAP_URL}
          data-client-key={MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
      )}
    </div>
  );
}
