'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { challengesService } from '../../../services/challenges.service';
import { submissionsService } from '../../../services/submissions.service';
import { useUserStore } from '../../../store/userStore';
import { Button } from '../../../components/common/Button';
import { RubricTable } from '../../../components/challenge/RubricTable';
import { DiscussionThread } from '../../../components/challenge/DiscussionThread';
import { ChallengeDetailHeader } from '../../../components/challenge/ChallengeDetailHeader';
import { ChallengeStages } from '../../../components/challenge/ChallengeStages';
import { EnrollChallengeModal } from '../../../components/challenge/EnrollChallengeModal';
import Image from 'next/image';
import { AlertCircle, FileText, Clock } from 'lucide-react';

interface Props {
  slug: string;
  initialChallenge: any;
}

export default function ChallengeClient({ slug, initialChallenge }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  const { data: challengeData, isLoading, isError } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: () => challengesService.getOne(slug),
    initialData: initialChallenge ? { data: initialChallenge } : undefined,
  });

  const { data: discussionsData, refetch: refetchDiscussions } = useQuery({
    queryKey: ['discussions', challengeData?.data?.id],
    queryFn: () => challengesService.getDiscussions(challengeData?.data?.id),
    enabled: !!challengeData?.data?.id,
  });

  const queryClient = useQueryClient();
  const challenge = challengeData?.data;
  const discussions = discussionsData?.data || [];

  const handleEnroll = async () => {
    if (!ndaAccepted) return;
    setIsEnrolling(true);
    setEnrollmentError(null);
    try {
      await submissionsService.enroll({ challengeId: challenge.id });
      setNdaModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      router.push('/');
    } catch (err: any) {
      setEnrollmentError(err.message || 'Gagal mendaftar ke studi kasus ini.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleNewComment = async (message: string, parentId?: string) => {
    await challengesService.createDiscussion(challenge.id, { message, parentId });
    refetchDiscussions();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-12 bg-foreground/5 rounded-xl w-1/3" />
        <div className="h-8 bg-foreground/5 rounded-xl w-2/3" />
        <div className="h-40 bg-foreground/5 rounded-xl w-full" />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="text-center py-32 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Studi Kasus Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground">Studi kasus yang Anda cari tidak ada atau telah ditarik oleh perusahaan.</p>
        <Button onClick={() => router.push('/challenges')} size="sm">Kembali ke Direktori</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 font-[var(--font-plus-jakarta)]">
      {/* 1. HERO SECTION (Paling Atas di Mobile & Desktop) */}
      <ChallengeDetailHeader
        challenge={challenge}
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
        onEnrollClick={() => setNdaModalOpen(true)}
        onLoginClick={() => router.push(`/login?redirect=/challenges/${slug}`)}
      />

      {/* 2. FLEX CONTAINER: Kriteria (setelah Hero di mobile) -> Challenge Tahapan & Specs */}
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
        
        {/* Kolom Kiri: Sidebar Kriteria (Persentase Fluid: w-full lg:w-1/3 xl:w-1/4 shrink-0) */}
        <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0 space-y-6 lg:sticky lg:top-24 self-start">
          {challenge.gradingRubric && (
            <div className="rounded-3xl shadow-xl overflow-hidden bg-card border border-border">
              <RubricTable rubric={challenge.gradingRubric} />
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Informasi & Bantuan</h4>
            <div className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
              <Clock className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p>Waktu pengerjaan disarankan adalah 3-7 hari setelah Anda menyetujui Digital NDA.</p>
            </div>
            <div className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
              <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>Pastikan Anda mencantumkan tautan repositori GitHub dan demo langsung yang dapat diakses publik.</p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Challenge Tahapan & Specs (w-full lg:w-2/3 xl:w-3/4 flex-1) */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex-1 min-w-0 space-y-8">
          <ChallengeStages sections={challenge.sections} />

          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl">
            <h3 className="font-display text-2xl font-bold text-foreground border-b border-border pb-4">
              Spesifikasi & Kebutuhan Proyek
            </h3>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-6 leading-relaxed">
              {challenge.description.split('\n\n').map((paragraph: string, i: number) => {
              if (paragraph.startsWith('### ')) {
                return <h4 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{paragraph.replace('### ', '')}</h4>;
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-1 my-2 text-muted-foreground">
                    {paragraph.split('\n').map((item, j) => (
                      <li key={j}>{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </div>
          
          {challenge.briefAttachments && challenge.briefAttachments.length > 0 && (
            <div className="mt-12 space-y-4">
              <h4 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Lampiran Brief & Aset Visual</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {challenge.briefAttachments.map((att: any, idx: number) => {
                  if (att.type === 'image') {
                    return (
                      <div key={idx} className="relative h-48 bg-background rounded-xl overflow-hidden border border-border group shadow-lg">
                        <Image src={att.url} alt={att.caption || 'Lampiran Gambar'} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        {att.caption && <div className="absolute bottom-0 inset-x-0 z-10 bg-black/80 backdrop-blur-sm p-3 text-xs text-foreground font-medium border-t border-foreground/10">{att.caption}</div>}
                      </div>
                    );
                  }
                  if (att.type === 'video') {
                    return (
                      <div key={idx} className="bg-background rounded-xl overflow-hidden border border-border shadow-lg">
                         <iframe src={att.url} className="w-full h-48" allowFullScreen title={att.title || 'Video Brief'} />
                      </div>
                    );
                  }
                  if (att.type === 'link' || att.type === 'document') {
                    return (
                      <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-background border border-border p-4 rounded-xl hover:bg-foreground/5 transition-colors shadow-lg">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                          <FileText className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-foreground truncate">{att.label || 'Dokumen / Tautan Eksternal'}</p>
                          <p className="text-xs text-muted-foreground truncate">{att.url}</p>
                        </div>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
          </div>

          {/* Diskusi */}
          <div className="border-t border-border pt-12">
            <DiscussionThread challengeId={challenge.id} discussions={discussions} onNewComment={handleNewComment} />
          </div>
        </div>
      </div>

      <EnrollChallengeModal
        isOpen={ndaModalOpen}
        onClose={() => setNdaModalOpen(false)}
        companyName={challenge.company?.companyName}
        enrollmentError={enrollmentError}
        ndaAccepted={ndaAccepted}
        setNdaAccepted={setNdaAccepted}
        onEnroll={handleEnroll}
        isEnrolling={isEnrolling}
      />
    </div>
  );
}

