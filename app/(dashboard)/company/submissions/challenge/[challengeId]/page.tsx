'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '@/services/submissions.service';
import { useUserStore } from '@/store/userStore';
import { CandidateBrowser } from '@/components/company/CandidateBrowser';
import { StageApprovalPanel } from '@/components/company/StageApprovalPanel';
import { StageGateEditor } from '@/components/company/StageGateEditor';
import { ArrowLeft } from 'lucide-react';

export default function ChallengeSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useUserStore();

  const challengeId = params.challengeId as string;
  const isAllowed = user?.role === 'COMPANY' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isHydrated && isAuthenticated && !isAllowed) {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, isAllowed, router]);

  // Judul studi kasus sekarang datang dari server sebagai bidang tersendiri.
  // Sebelumnya diambil dari `submissions[0].challenge`, sehingga judulnya
  // hilang persis saat paling dibutuhkan: ketika belum ada satu pun kandidat.
  const { data: header } = useQuery({
    queryKey: ['company-submissions-header', challengeId],
    queryFn: () =>
      submissionsService.getCompanySubmissions(challengeId, { limit: 1 }),
    enabled: isAuthenticated && !!challengeId && isAllowed,
    select: (result) => result.challenge,
  });

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
          Kandidat{header?.title ? `: ${header.title}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Daftar talenta yang telah mengumpulkan pekerjaan untuk studi kasus ini.
        </p>
      </div>

      {/* Diletakkan di atas daftar kandidat: yang menunggu keputusan tidak bisa
          melanjutkan sampai ditindaklanjuti, sementara daftar di bawah hanya
          menunggu dinilai. */}
      <StageApprovalPanel
        challengeId={challengeId}
        enabled={isAuthenticated && !!challengeId && isAllowed}
      />

      <StageGateEditor
        challengeId={challengeId}
        enabled={isAuthenticated && !!challengeId && isAllowed}
      />

      <CandidateBrowser
        challengeId={challengeId}
        enabled={isAuthenticated && !!challengeId && isAllowed}
      />
    </div>
  );
}
