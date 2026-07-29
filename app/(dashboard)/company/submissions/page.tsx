'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { CandidateBrowser } from '@/components/company/CandidateBrowser';
import { ArrowLeft } from 'lucide-react';

/**
 * Seluruh kandidat perusahaan dalam satu layar, lintas studi kasus.
 *
 * Rute ini sebelumnya tidak ada — padahal pemberitahuan "Submisi Baru Masuk"
 * menunjuk tepat ke sini, sehingga setiap kabar submisi baru berujung 404.
 * Selain itu satu-satunya cara melihat kandidat adalah membuka studi kasus
 * satu per satu dari tabel dasbor.
 */
export default function AllCandidatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useUserStore();
  const isAllowed = user?.role === 'COMPANY' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isHydrated && isAuthenticated && !isAllowed) {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, isAllowed, router]);

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali ke Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Semua Kandidat
        </h1>
        <p className="text-muted-foreground">
          Seluruh talenta yang mengumpulkan pekerjaan untuk studi kasus
          perusahaan Anda. Saring berdasarkan tahap rekrutmen untuk melihat
          daftar pendek atau kandidat yang menunggu wawancara.
        </p>
      </div>

      <CandidateBrowser enabled={isAuthenticated && isAllowed} />
    </div>
  );
}
