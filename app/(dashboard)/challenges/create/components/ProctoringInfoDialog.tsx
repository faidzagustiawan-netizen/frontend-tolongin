import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Eye, Info, VideoOff, X } from 'lucide-react';
import { ProctoringSetting } from './proctoringCatalog';

interface ProctoringInfoDialogProps {
  setting: ProctoringSetting | null;
  onClose: () => void;
}

/**
 * Penjelasan satu pengaturan anti-kecurangan.
 *
 * Sengaja dialog, bukan tooltip sorot. Isinya terlalu panjang untuk gelembung
 * kecil, dan tooltip hover tidak pernah muncul di layar sentuh maupun bagi
 * pengguna papan ketik — persis kelompok yang paling butuh penjelasannya.
 */
export default function ProctoringInfoDialog({
  setting,
  onClose,
}: ProctoringInfoDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!setting) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [setting, onClose]);

  if (!setting || !mounted) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proctoring-info-title"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 p-5 border-b border-border bg-card">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div>
              <h2 id="proctoring-info-title" className="text-lg font-bold text-foreground">
                {setting.label}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{setting.summary}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup penjelasan"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Video peraga bersifat opsional. Selama belum ada, tempatnya diisi
              keterangan jujur alih-alih pemutar kosong yang menggantung. */}
          {setting.demoVideoUrl ? (
            <video
              src={setting.demoVideoUrl}
              controls
              className="w-full rounded-2xl bg-black aspect-video"
            />
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-border bg-foreground/5 aspect-video flex flex-col items-center justify-center text-center px-6">
              <VideoOff className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Video peraga belum tersedia
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Penjelasan tertulis di bawah sudah memuat seluruh perilakunya.
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" aria-hidden="true" /> Cara kerjanya
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{setting.detail}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Yang dialami kandidat
            </h3>
            <ul className="space-y-2">
              {setting.candidateExperience.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-foreground">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle
              className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-bold text-warning mb-1">
                Pertimbangkan sebelum menyalakan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {setting.tradeOff}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
