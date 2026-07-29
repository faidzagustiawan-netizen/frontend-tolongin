import React, { useState, useMemo } from 'react';
import { Layers, FileText, CheckCircle2, Video, Code, Link, ChevronLeft, ChevronRight } from 'lucide-react';

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

const estimateDuration = (type: string) => {
  switch (type) {
    case 'MULTIPLE_CHOICE': return 3;
    case 'ESSAY': return 10;
    case 'LIVE_CODING': return 30;
    case 'FILE_UPLOAD': return 45;
    case 'VIDEO_UPLOAD': return 15;
    case 'URL_SUBMISSION': return 5;
    default: return 5;
  }
};

export const ChallengeStages = ({ sections }: ChallengeStagesProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  if (!sections || sections.length === 0) return null;

  const totalStages = sections.length;
  const currentSection = sections[currentStageIndex] || sections[0];

  const totalDuration = useMemo(() => {
    return sections.reduce((acc, section) => {
      const sectionDur = (section.components || []).reduce((sAcc: number, comp: any) => {
        return sAcc + estimateDuration(comp.type);
      }, 0);
      return acc + sectionDur;
    }, 0);
  }, [sections]);

  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Layers className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">
          Tahapan & Struktur Ujian
        </h3>
      </div>

      {/* Active Stage Content */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-border">
        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        
        <div className="space-y-4 -mt-1.5">
          <div>
            <h4 className="text-lg font-bold text-foreground">{currentSection.title}</h4>
            {currentSection.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                {currentSection.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.components?.map((comp: any, cIdx: number) => {
              const duration = estimateDuration(comp.type);
              
              return (
                <div 
                  key={cIdx} 
                  className="bg-[#1E7F4D] text-white border border-[#1E7F4D]/40 rounded-xl p-4 flex items-start gap-4 hover:bg-[#196B40] transition-colors shadow-md"
                >
                  <div className="mt-0.5 flex-shrink-0 p-2.5 bg-white rounded-lg shadow-sm">
                    {getComponentIcon(comp.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-white truncate">Soal {cIdx + 1}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 shrink-0">
                        {comp.points} Poin
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-medium">
                      {getComponentLabel(comp.type)} • ~{duration} Menit
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


