import React, { useState } from 'react';
import { FileText, CheckCircle2, Video, Code, Link, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChallengeStagesProps {
  sections: any[];
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case 'MULTIPLE_CHOICE': return <CheckCircle2 className="h-4 w-4 text-[#1E7F4D]" />;
    case 'ESSAY': return <FileText className="h-4 w-4 text-[#1E7F4D]" />;
    case 'LIVE_CODING': return <Code className="h-4 w-4 text-[#1E7F4D]" />;
    case 'FILE_UPLOAD': return <FileText className="h-4 w-4 text-[#1E7F4D]" />;
    case 'VIDEO_UPLOAD': return <Video className="h-4 w-4 text-[#1E7F4D]" />;
    case 'URL_SUBMISSION': return <Link className="h-4 w-4 text-[#1E7F4D]" />;
    default: return <FileText className="h-4 w-4 text-[#1E7F4D]" />;
  }
};

const getComponentLabel = (type: string) => {
  switch (type) {
    case 'MULTIPLE_CHOICE': return 'Pilihan Ganda';
    case 'ESSAY': return 'Uraian (Essay)';
    case 'LIVE_CODING': return 'Live Coding / Praktik';
    case 'FILE_UPLOAD': return 'Unggah Berkas';
    case 'VIDEO_UPLOAD': return 'Rekaman Video';
    case 'URL_SUBMISSION': return 'Tautan Eksternal';
    default: return 'Tugas Umum';
  }
};



/** Syarat masuk tahap, dalam kalimat yang bisa dibaca calon peserta. */
const describeGate = (section: any, sections: any[], idx: number): string | null => {
  if (idx === 0) return null;

  const sourceName = () => {
    if (section.scoreBasis === 'CUMULATIVE') return 'rata-rata tahap sebelumnya';
    if (section.scoreBasis === 'SPECIFIC_STAGES') {
      const picked = (section.gateSourceIds ?? [])
        .map((id: string) => sections.find((s) => s.id === id)?.title)
        .filter(Boolean);
      return picked.length > 0 ? `nilai ${picked.join(' dan ')}` : 'nilai tahap sebelumnya';
    }
    return `nilai ${sections[idx - 1]?.title ?? 'tahap sebelumnya'}`;
  };

  switch (section.gateMode) {
    case 'MIN_SCORE':
      return `Butuh ${sourceName()} minimal ${section.minScore}.`;
    case 'TOP_N':
      return `Hanya ${section.maxAdvancing} kandidat teratas berdasarkan ${sourceName()}.`;
    case 'MANUAL_APPROVAL':
      return 'Perusahaan memilih siapa yang lanjut ke tahap ini.';
    default:
      return null;
  }
};

export const ChallengeStages = ({ sections }: ChallengeStagesProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  if (!sections || sections.length === 0) return null;

  const totalStages = sections.length;
  const currentSection = sections[currentStageIndex] || sections[0];

  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <img src="/tahapan-ujian.svg" alt="Tahapan Ujian Icon" className="h-12 w-12 object-contain shrink-0" />
        <h3 className="font-display text-2xl font-bold text-foreground">
          Tahapan &amp; Struktur Ujian
        </h3>
      </div>

      {/* Active Stage Content */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-border">
        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        
        <div className="space-y-4 -mt-1.5">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h4 className="text-lg font-bold text-foreground">{currentSection.title}</h4>
            </div>
            {currentSection.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                {currentSection.description}
              </p>
            )}
            {/* Syarat masuk ditampilkan di halaman publik: kandidat berhak tahu
                aturannya sebelum memutuskan mendaftar. */}
            {describeGate(currentSection, sections, currentStageIndex) && (
              <p className="text-sm text-amber-500 mt-2 font-semibold flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {describeGate(currentSection, sections, currentStageIndex)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.components?.map((comp: any, cIdx: number) => {
              return (
                <div 
                  key={cIdx} 
                  className="bg-white dark:bg-card border-2 border-[#1E7F4D] text-foreground rounded-2xl p-4 flex items-start gap-4 hover:border-[#1E7F4D]/80 transition-colors shadow-sm"
                >
                  <div className="mt-1 flex-shrink-0 p-2.5 bg-[#1E7F4D]/10 dark:bg-[#1E7F4D]/20 rounded-full border border-[#1E7F4D]/30 flex items-center justify-center">
                    {getComponentIcon(comp.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E7F4D]/10 text-[#1E7F4D] dark:bg-[#1E7F4D]/20 border border-[#1E7F4D]/30 inline-block mb-1">
                      {comp.points} Poin
                    </span>
                    <h5 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                      Soal {cIdx + 1}
                    </h5>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {getComponentLabel(comp.type)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Pagination Controls (Center Bottom with Fixed Layout) */}
      {totalStages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/60">
          <button
            type="button"
            onClick={() => setCurrentStageIndex((prev) => prev - 1)}
            className={`p-2 rounded-full border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors shadow-sm ${
              currentStageIndex > 0 ? 'visible' : 'invisible pointer-events-none'
            }`}
            title="Tahap Sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-foreground bg-card border border-border px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
            Tahap {currentStageIndex + 1} dari {totalStages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentStageIndex((prev) => prev + 1)}
            className={`p-2 rounded-full border border-border bg-card text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors shadow-sm ${
              currentStageIndex < totalStages - 1 ? 'visible' : 'invisible pointer-events-none'
            }`}
            title="Tahap Berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center pt-6 border-t border-border/60">
          <span className="text-xs sm:text-sm font-bold text-foreground bg-card border border-border px-4 py-1.5 rounded-full shadow-sm">
            Tahap 1 dari 1
          </span>
        </div>
      )}
    </div>
  );
};


