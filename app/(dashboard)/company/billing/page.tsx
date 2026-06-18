'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../../../store/userStore';
import { subscriptionsService } from '../../../../services/subscriptions.service';
import { CheckCircle2, Zap, Shield, Crown, CreditCard, ArrowRight, Loader2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    tier: 'STARTUP',
    name: 'Startup',
    price: 'Rp 0',
    description: 'Bagus untuk mencoba platform kami dan merekrut posisi sederhana.',
    features: [
      'Maksimal 1 Tantangan Aktif',
      'Pembuatan Tantangan Manual',
      'Maksimal 50 Kandidat/Tantangan',
      'Evaluasi Standar',
    ],
    buttonText: 'Paket Anda Saat Ini',
  },
  {
    tier: 'KONGLOMERAT',
    name: 'Pro',
    price: 'Rp 990.000 / bln',
    description: 'Fitur lengkap dengan kecerdasan buatan untuk rekrutmen masif.',
    features: [
      'Maksimal 5 Tantangan Aktif',
      'AI Generate Tantangan',
      'Evaluasi Otomatis AI Lanjutan',
      'Proctoring Biometrik Penuh',
      'Maksimal 500 Kandidat/Tantangan',
    ],
    buttonText: 'Upgrade ke Pro',
  },
  {
    tier: 'CUSTOM',
    name: 'Custom',
    price: 'Hubungi Sales',
    description: 'Solusi tak terbatas untuk korporat dengan kebutuhan unik.',
    features: [
      'Tantangan Tanpa Batas',
      'Semua Fitur Pro',
      'Kustomisasi Branding Penuh',
      'Dukungan SLA 24/7',
      'Kandidat Tanpa Batas',
    ],
    buttonText: 'Hubungi via WhatsApp',
  },
];

export default function BillingPage() {
  const { user, loadUserFromStorage, updateUserProfile } = useUserStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const currentTier = user?.profile?.subscriptionTier || 'STARTUP';

  const handleUpgrade = async (plan: any) => {
    if (plan.tier === currentTier) return;

    if (plan.tier === 'CUSTOM') {
      window.open('https://wa.me/0895397133738?text=Halo%20Tolongin,%20saya%20tertarik%20dengan%20paket%20Custom%20untuk%20perusahaan%20saya.', '_blank');
      return;
    }

    setIsLoading(true);
    try {
      await subscriptionsService.upgrade({ tier: plan.tier });
      // Update local profile to reflect the change immediately
      updateUserProfile({
        ...user?.profile,
        subscriptionTier: plan.tier,
      });
      alert('Berhasil mengupgrade paket langganan Anda!');
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan upgrade.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'COMPANY') {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">Langganan & Tagihan</h1>
        <p className="text-gray-400 text-sm max-w-2xl mx-auto">
          Tingkatkan kapabilitas rekrutmen Anda. Akses AI Generative, buka kuota tantangan yang lebih banyak, dan pastikan proses rekrutmen berjalan lancar tanpa hambatan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => {
          const isCurrent = currentTier === plan.tier;
          const isPro = plan.tier === 'KONGLOMERAT';
          
          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-dark-card border rounded-3xl p-8 flex flex-col ${
                isPro ? 'border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]' : 'border-dark-border'
              }`}
            >
              {isPro && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Paling Populer
                </div>
              )}
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2">
                  {plan.tier === 'STARTUP' && <Shield className="h-5 w-5 text-gray-400" />}
                  {plan.tier === 'KONGLOMERAT' && <Zap className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />}
                  {plan.tier === 'CUSTOM' && <Crown className="h-5 w-5 text-amber-400 fill-amber-400/20" />}
                  <h3 className="font-display font-bold text-lg text-white">{plan.name}</h3>
                </div>
                <div className="text-3xl font-extrabold text-white">{plan.price}</div>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Fitur Utama</p>
                <ul className="space-y-3 text-sm text-gray-400">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || (isLoading && plan.tier !== 'CUSTOM')}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                    : isPro
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : plan.tier === 'CUSTOM'
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {isLoading && !isCurrent && plan.tier !== 'CUSTOM' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  plan.buttonText
                ) : plan.tier === 'CUSTOM' ? (
                  <>
                    <MessageSquare className="h-4 w-4" /> {plan.buttonText}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" /> {plan.buttonText}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
