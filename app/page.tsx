'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { HeroSection } from '../components/landing/HeroSection';
import { DashboardPreview } from '../components/landing/DashboardPreview';
import { CoreValuesSection } from '../components/landing/CoreValuesSection';
import { PricingSection } from '../components/landing/PricingSection';
import { CtaSection } from '../components/landing/CtaSection';
import { TestimonialMarquee } from '../components/common/TestimonialMarquee';

export default function Home() {
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  if (isAuthenticated && user) {
    return <DashboardPreview user={user} />;
  }

  return (
    <div className="w-full flex flex-col items-center selection:bg-emerald-500/30 selection:text-emerald-200">
      <HeroSection />
      <CoreValuesSection />
      <TestimonialMarquee />
      <PricingSection />
      <CtaSection />
    </div>
  );
}
