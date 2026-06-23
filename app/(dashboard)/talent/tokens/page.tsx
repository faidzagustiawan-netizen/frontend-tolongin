'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Coins, ArrowRight, Loader2 } from 'lucide-react';
import { PaymentsService } from '../../../../services/payments.service';

export default function TokenTopUpPage() {
  const [loading, setLoading] = useState<number | null>(null);

  const handleTopup = async (tokenAmount: number) => {
    setLoading(tokenAmount);
    try {
      const result = await PaymentsService.topupToken(tokenAmount);
      if (result.snapToken) {
        // Panggil Midtrans Snap Pop-up
        (window as any).snap.pay(result.snapToken, {
          onSuccess: function(result: any) {
            alert('Pembayaran sukses! Token Anda telah ditambahkan.');
          },
          onPending: function(result: any) {
            alert('Menunggu pembayaran Anda...');
          },
          onError: function(result: any) {
            alert('Pembayaran gagal.');
          },
          onClose: function() {
            // User menutup pop-up tanpa membayar
          }
        });
      }
    } catch (error) {
      console.error('Failed to initiate topup', error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Toko <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Token Energi</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Dapatkan lebih banyak token untuk mengumpulkan solusi studi kasus. Selesaikan lebih banyak tantangan dan panjat papan peringkat global!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        {/* Paket 1 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors"
        >
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl">
            Starter
          </div>
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-white">100 Token</h3>
            <p className="text-3xl font-extrabold text-white">
              Rp 30.000 <span className="text-sm font-normal text-gray-400">/ sekali bayar</span>
            </p>
            <ul className="space-y-2 text-sm text-gray-300 pt-4 border-t border-dark-border">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400"/> Berlaku selamanya (tidak hangus)</li>
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400"/> Cukup untuk 10 kali upload solusi</li>
            </ul>
          </div>
          <button
            onClick={() => handleTopup(100)}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-colors flex justify-center items-center gap-2"
          >
            {loading === 100 ? <Loader2 className="animate-spin h-5 w-5" /> : 'Beli 100 Token'}
          </button>
        </motion.div>

        {/* Paket 2 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-b from-dark-card via-amber-950/20 to-dark-card border-2 border-amber-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden shadow-amber-500/20"
        >
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl shadow-lg">
            Terpopuler (Hemat 17%)
          </div>
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Zap className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-white">500 Token</h3>
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Rp 100.000 <span className="text-sm font-normal text-gray-400">/ sekali bayar</span>
            </p>
            <ul className="space-y-2 text-sm text-gray-300 pt-4 border-t border-amber-500/30">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400"/> Berlaku selamanya (tidak hangus)</li>
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400"/> Cukup untuk 50 kali upload solusi</li>
            </ul>
          </div>
          <button
            onClick={() => handleTopup(500)}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] text-white transition-transform shadow-lg flex justify-center items-center gap-2"
          >
            {loading === 500 ? <Loader2 className="animate-spin h-5 w-5" /> : <>Beli 500 Token <ArrowRight className="h-4 w-4" /></>}
          </button>
        </motion.div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-8">
        Pembayaran diamankan oleh Midtrans. Menerima QRIS, GoPay, OVO, ShopeePay, dan Virtual Account.
      </div>
    </div>
  );
}
