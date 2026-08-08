'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Coins, ArrowRight, Loader2 } from 'lucide-react';
import Script from 'next/script';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentsService } from '@/services/payments.service';
import { tokenService } from '@/services/tokenService';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { TOKEN_PACKS, tokenPackSavingsPercent } from '@/lib/plans';
import {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_SANDBOX,
  MIDTRANS_SNAP_URL,
  isMidtransConfigured,
} from '@/lib/midtrans';

export default function TokenTopUpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.role !== 'TALENT' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  // Halaman ini menjual token tanpa pernah menyebut berapa yang sudah dimiliki,
  // jadi tidak ada dasar untuk memutuskan perlu membeli atau tidak. Saldonya
  // hanya ada di server; kunci kueri disamakan dengan Navbar supaya keduanya
  // ikut tersegarkan sekali jalan.
  const { data: tokenData } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: !!user && user.role === 'TALENT',
  });
  const tokenBalance = tokenData?.tokenBalance;

  const handleTopup = async (tokenAmount: number) => {
    // Tanpa client key, jendela Snap tidak akan pernah terbuka. Dikatakan di
    // muka, bukan dibiarkan gagal setelah pesanan telanjur dibuat di backend.
    if (!isMidtransConfigured) {
      toast.error(
        'Pembelian token sedang tidak tersedia. Silakan coba lagi nanti.',
      );
      return;
    }

    setLoading(tokenAmount);
    try {
      const result = await PaymentsService.topupToken(tokenAmount);

      // Tanpa cabang ini, kegagalan di sisi Payment Gateway berakhir sebagai
      // spinner yang mati tanpa satu pun kata di layar.
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
          toast.success('Pembayaran berhasil. Token Anda akan segera bertambah.');
          // Saldo disegarkan alih-alih memuat ulang halaman: token baru masuk
          // lewat webhook, jadi pemuatan ulang pun belum tentu menampilkannya —
          // dan pesan di atas ikut terbuang bersamanya.
          void queryClient.invalidateQueries({ queryKey: ['tokens', user?.id] });
          setLoading(null);
        },
        onPending: () => {
          toast('Pembayaran Anda sedang menunggu penyelesaian.', { icon: '⏳' });
          setLoading(null);
        },
        onError: () => {
          toast.error('Pembayaran gagal diproses.');
          setLoading(null);
        },
        onClose: () => {
          // Menutup jendela Snap adalah pembatalan, dan sebelumnya tidak
          // meninggalkan jejak apa pun selain spinner yang berhenti sendiri.
          toast('Pembayaran dibatalkan. Saldo token Anda tidak berubah.', {
            icon: 'ℹ️',
          });
          setLoading(null);
        },
      });
    } catch (error: any) {
      console.error('Failed to initiate topup', error);
      toast.error(error?.message || 'Gagal menghubungi Payment Gateway.');
      setLoading(null);
    }
    // Tanpa `finally`: `snap.pay` membuka jendela pembayaran lalu langsung
    // kembali. Membersihkan keadaan memuat di sini akan menghentikan indikator
    // tepat ketika jendela pembayaran baru saja terbuka.
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
          Toko <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Token Energi</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Dapatkan lebih banyak token untuk mengumpulkan solusi studi kasus. Selesaikan lebih banyak tantangan dan panjat papan peringkat global!
        </p>
      </div>

      {tokenBalance !== undefined && (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center gap-3">
          <Coins className="h-5 w-5 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Saldo token Anda saat ini:{' '}
            <span className="font-bold text-foreground">
              {tokenBalance.toLocaleString('id-ID')} token
            </span>
          </p>
        </div>
      )}

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
            Pembelian token sedang tidak tersedia. Silakan coba lagi nanti.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        {/* Harga dan jumlah token berasal dari `lib/plans.ts`, bukan ditulis
            ulang di markup — yang dulu membuat angka di layar tidak bisa diadu
            dengan tarif yang benar-benar ditagih backend. */}
        {TOKEN_PACKS.map((pack) => {
          const savings = tokenPackSavingsPercent(pack);
          const badge =
            pack.highlighted && savings > 0
              ? `${pack.badge} (Hemat ${savings}%)`
              : pack.badge;

          return (
            <motion.div
              key={pack.tokens}
              whileHover={{ scale: 1.02 }}
              className={
                pack.highlighted
                  ? 'bg-gradient-to-b from-dark-card via-amber-950/20 to-dark-card border-2 border-amber-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden shadow-amber-500/20'
                  : 'bg-card border border-border rounded-3xl p-8 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors'
              }
            >
              <div
                className={
                  pack.highlighted
                    ? 'absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl shadow-lg'
                    : 'absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl'
                }
              >
                {badge}
              </div>
              <div className="space-y-4">
                <div
                  className={
                    pack.highlighted
                      ? 'h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20'
                      : 'h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400'
                  }
                >
                  {pack.highlighted ? (
                    <Zap className="h-7 w-7" aria-hidden="true" />
                  ) : (
                    <Coins className="h-7 w-7" aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {pack.tokens} Token
                </h3>
                <p
                  className={
                    pack.highlighted
                      ? 'text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'text-3xl font-extrabold text-foreground'
                  }
                >
                  {pack.priceLabel}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / sekali bayar
                  </span>
                </p>
                <ul
                  className={`space-y-2 text-sm text-muted-foreground pt-4 border-t ${
                    pack.highlighted ? 'border-amber-500/30' : 'border-border'
                  }`}
                >
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />{' '}
                    Berlaku selamanya (tidak hangus)
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" aria-hidden="true" />{' '}
                    {pack.usageHint}
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleTopup(pack.tokens)}
                disabled={loading !== null}
                className={
                  pack.highlighted
                    ? 'w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] text-white transition-transform shadow-lg flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
                    : 'w-full py-3 rounded-xl font-bold bg-foreground/10 hover:bg-white/20 text-foreground transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
                }
              >
                {loading === pack.tokens ? (
                  <Loader2 className="animate-spin h-5 w-5" aria-hidden="true" />
                ) : (
                  <>
                    Beli {pack.tokens} Token
                    {pack.highlighted && (
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground mt-8">
        Pembayaran diamankan oleh Midtrans. Menerima QRIS, GoPay, OVO, ShopeePay, dan Virtual Account.
      </div>

      {/* Skrip Snap sebelumnya hanya dimuat di halaman tagihan perusahaan,
          sehingga setiap tombol beli di sini melempar TypeError pada
          `window.snap`. */}
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
