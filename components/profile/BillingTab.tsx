import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface BillingTabProps {
  companyProfile: any;
  myChallenges: any[];
  subscriptionPlans: any[];
  isUpgradingTier: boolean;
  selectedTier: 'STARTUP' | 'KONGLOMERAT' | 'CUSTOM' | null;
}

export const BillingTab = ({
  companyProfile,
  myChallenges,
  subscriptionPlans,
  isUpgradingTier,
  selectedTier,
}: BillingTabProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        <Crown className="h-4 w-4" /> Manajemen Berlangganan
      </div>
      <h3 className="font-display text-2xl font-bold text-white">Ringkasan Penggunaan Layanan</h3>
      <div className="bg-dark-bg border border-dark-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Studi Kasus Digunakan</h4>
            <p className="text-xs text-gray-400">Total studi kasus (Draf & Aktif) yang Anda miliki saat ini.</p>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
            myChallenges.length >= (companyProfile.subscriptionTier === 'STARTUP' ? 1 : companyProfile.subscriptionTier === 'KONGLOMERAT' ? 5 : 999) 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {myChallenges.length} / {companyProfile.subscriptionTier === 'STARTUP' ? 1 : companyProfile.subscriptionTier === 'KONGLOMERAT' ? 5 : 'Tak Terbatas'}
          </span>
        </div>
        {myChallenges.length > 0 && (
          <div className="pt-3 border-t border-dark-border text-xs text-gray-400">
            <p>Status: {myChallenges.filter((c:any) => c.status === 'PUBLISHED').length} Aktif, {myChallenges.filter((c:any) => c.status === 'DRAFT').length} Draf.</p>
          </div>
        )}
      </div>
      
      <h3 className="font-display text-2xl font-bold text-white mt-8">Tingkatkan Paket Perusahaan Anda</h3>
      <p className="text-sm text-gray-400">
        Pilih paket langganan yang paling sesuai untuk memaksimalkan efisiensi rekrutmen dan asesmen otomatis AI.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {subscriptionPlans.map((plan) => {
          const isCurrentPlan = companyProfile?.subscriptionTier === plan.tier;
          const isSelectedLoading = isUpgradingTier && selectedTier === plan.tier;

          return (
            <div
              key={plan.tier}
              className={`relative bg-dark-card border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                plan.popular ? 'border-emerald-500/50 shadow-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.05] to-transparent' : 'border-dark-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Rekomendasi
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="font-display text-lg font-bold text-white">{plan.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
                </div>

                <div className="pt-2">
                  <span className="font-display text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-xs text-gray-400 font-medium ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-dark-border/80 text-xs text-gray-300">
                  {plan.features.map((feat: string) => (
                    <li key={feat} className="flex items-center gap-2 font-medium">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {isCurrentPlan ? (
                  <Button className="w-full bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default shadow-none font-semibold" disabled>
                    Paket Saat Ini Aktif
                  </Button>
                ) : (
                  <Link href="/company/billing" className="w-full">
                    <Button
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="w-full font-semibold shadow-xl"
                    >
                      Pilih Paket Ini
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
