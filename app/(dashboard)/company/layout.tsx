'use client';

import React from 'react';
import { CompanyAccessGate } from '@/components/company/CompanyAccessGate';

/**
 * Kerangka bersama untuk seluruh rute `/company/*`.
 *
 * Sebelumnya tiap halaman mengatur containernya sendiri dan hasilnya tidak
 * pernah sama: billing `max-w-6xl`, daftar kandidat `max-w-7xl py-10`, detail
 * submisi `max-w-5xl py-10`, dan `team` sama sekali tanpa padding horizontal
 * sehingga isinya menempel tepi layar di mobile. Lebar serta padding kini
 * ditetapkan satu kali di sini; halaman di dalamnya hanya mengurus isinya.
 */
export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyAccessGate>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {children}
      </div>
    </CompanyAccessGate>
  );
}
