import React from 'react';
import { Layers, FileText, CheckCircle2, Video, Code, Link } from 'lucide-react';

interface ChallengeStagesProps {
  sections: any[];
}

export const ChallengeStages = ({ sections }: ChallengeStagesProps) => {
  if (!sections || sections.length === 0) return null;

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return <CheckCircle2 className="h-4 w-4 text-cyan-400" />;
      case 'ESSAY': return <FileText className="h-4 w-4 text-emerald-400" />;
      case 'LIVE_CODING': return <Code className="h-4 w-4 text-amber-400" />;
      case 'FILE_UPLOAD': return <FileText className="h-4 w-4 text-purple-400" />;
      case 'VIDEO_UPLOAD': return <Video className="h-4 w-4 text-rose-400" />;
      case 'URL_SUBMISSION': return <Link className="h-4 w-4 text-blue-400" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
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

  let totalDuration = 0;

  return (
    <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-xl space-y-8 mt-12">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Layers className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">
          Tahapan & Struktur Ujian
        </h3>
      </div>

      <div className="space-y-8">
        {sections.map((section, sIdx) => {
          let sectionDuration = 0;
          
          return (
            <div key={sIdx} className="relative pl-6 sm:pl-8 border-l-2 border-border">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              
              <div className="space-y-4 -mt-1.5">
                <div>
                  <h4 className="text-lg font-bold text-foreground">{section.title}</h4>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">{section.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.components?.map((comp: any, cIdx: number) => {
                    const duration = estimateDuration(comp.type);
                    sectionDuration += duration;
                    totalDuration += duration;
                    
                    return (
                      <div key={cIdx} className="bg-background border border-border rounded-xl p-4 flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                        <div className="mt-0.5 flex-shrink-0 p-2 bg-black/40 rounded-lg border border-white/5">
                          {getComponentIcon(comp.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-200">Soal {cIdx + 1}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {comp.points} Poin
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">{getComponentLabel(comp.type)} • ~{duration} Menit</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-border bg-emerald-500/5 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-8 sm:p-12 rounded-b-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-foreground font-bold text-lg mb-1">Estimasi Total Pengerjaan Aktif</h4>
            <p className="text-sm text-muted-foreground">Total akumulasi waktu dari semua tahapan studi kasus ini.</p>
          </div>
          <div className="text-3xl font-display font-extrabold text-emerald-400">
            ~{Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}j ` : ''}{totalDuration % 60}m
          </div>
        </div>
      </div>
    </div>
  );
};
