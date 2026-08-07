import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudOff,
  Eye,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ServerDraft } from './useServerDraft';

const formatRelative = (date: Date) => {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export interface DraftStatusBarProps {
  /** Draf dari ServerDraft (untuk form pembuat studi kasus / challenges/create) */
  draft?: ServerDraft;

  /** Mengaktifkan mode Navbar Pengerjaan Soal */
  isExamMode?: boolean;

  /** Judul ujian / studi kasus */
  title?: string;

  /** Subjudul / nama tahap */
  subtitle?: string;

  /** Tautan keluar dari sesi */
  exitHref?: string;

  /** Callback tombol keluar */
  onExit?: () => void;

  /** Status simpan draf di sesi pengerjaan */
  isSavingDraft?: boolean;

  /** Apakah ada draf lokal belum tersimpan */
  hasUnsavedDraft?: boolean;

  /** Waktu draf terakhir berhasil disimpan */
  lastDraftSavedAt?: Date | null;

  /** Pesan galat simpan draf */
  draftError?: string | null;

  /** Callback coba lagi simpan draf */
  onRetrySave?: () => void;

  /** Sisa waktu pengerjaan (format HH:MM:SS) */
  stageTimeLeft?: string | null;

  /** Peringatan sisa waktu hampir habis */
  isStageWarning?: boolean;

  /** Mode hanya-baca (setelah dikumpulkan) */
  isReadOnly?: boolean;

  /** Status pengawasan proctoring */
  proctored?: boolean;
}

/**
 * Komponen Penanda Status Draf & Navbar Pengerjaan Soal.
 *
 * Menampilkan status autosave pada pembuat studi kasus, atau berfungsi sebagai
 * Navbar utama yang bersih dan terproteksi saat kandidat mengerjakan soal.
 */
export default function DraftStatusBar({
  draft,
  isExamMode = false,
  title,
  subtitle,
  exitHref,
  onExit,
  isSavingDraft = false,
  hasUnsavedDraft = false,
  lastDraftSavedAt = null,
  draftError = null,
  onRetrySave,
  stageTimeLeft,
  isStageWarning = false,
  isReadOnly = false,
  proctored = false,
}: DraftStatusBarProps) {
  // --- MODE NAVBAR PENGERJAAN SOAL ---
  if (isExamMode) {
    return (
      <header className="sticky top-0 left-0 right-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-5 sm:py-6 shadow-md transition-all">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Sisi Kiri: Tombol Keluar + Judul Soal */}
          <div className="flex items-center gap-3 min-w-0">
            {exitHref ? (
              <Link href={exitHref}>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs h-9 px-3 shrink-0">
                  <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Keluar Sesi</span>
                </Button>
              </Link>
            ) : onExit ? (
              <Button variant="outline" size="sm" onClick={onExit} className="rounded-xl gap-1.5 text-xs h-9 px-3 shrink-0">
                <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Keluar Sesi</span>
              </Button>
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate max-w-sm sm:max-w-xl">
                {title || 'Sesi Pengerjaan Soal'}
              </h1>
            </div>
          </div>

          {/* Sisi Kanan: Status Auto-Save Draf + Timer + Read-Only Badge */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
            {proctored && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> AI Proctoring Active
              </div>
            )}

            {/* Draf Status Badge */}
            {draftError ? (
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Gagal menyimpan</span>
                {onRetrySave && (
                  <button
                    onClick={onRetrySave}
                    className="underline font-semibold hover:text-red-300 ml-1"
                  >
                    Coba lagi
                  </button>
                )}
              </div>
            ) : isSavingDraft ? (
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-background border border-border rounded-xl text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Menyimpan draf...</span>
              </div>
            ) : hasUnsavedDraft ? (
              <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                <Timer className="w-3.5 h-3.5" />
                <span>Draf Belum Tersimpan</span>
              </div>
            ) : lastDraftSavedAt ? (
              <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Draf Tersimpan ({lastDraftSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-background border border-border text-muted-foreground rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Draf Tersinkron</span>
              </div>
            )}

            {/* Timer Pengerjaan */}
            {stageTimeLeft && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shadow-sm ${
                  isStageWarning
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                    : 'bg-background border-border text-foreground'
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-emerald-500" />
                <span>{stageTimeLeft}</span>
              </div>
            )}

            {/* Read Only Badge */}
            {isReadOnly && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs">
                <Eye className="w-3.5 h-3.5" /> Mode Lihat Jawaban
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // --- MODE STATUS BAR DRAF PEMBUATAN SOAL (CHALLENGES/CREATE) ---
  if (!draft) return null;

  if (draft.state === 'IDLE' && !draft.savedAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Draf tersimpan otomatis ke server begitu Informasi Dasar lengkap.
      </div>
    );
  }

  if (draft.state === 'ERROR') {
    return (
      <div
        role="alert"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3"
      >
        <div className="flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {draft.error} Pekerjaan Anda masih tersimpan di peramban ini, tetapi
            belum aman bila Anda berganti perangkat.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void draft.saveNow()}
          className="flex-shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Coba simpan lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs" aria-live="polite">
      {draft.state === 'SAVING' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Menyimpan draf...</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          <span className="text-muted-foreground">
            Draf tersimpan di server{draft.savedAt ? ` ${formatRelative(draft.savedAt)}` : ''}.
          </span>
        </>
      )}
    </div>
  );
}

