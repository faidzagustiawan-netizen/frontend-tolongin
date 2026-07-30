import React from 'react';
import { AlertCircle, Check, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ServerDraft } from './useServerDraft';

const formatRelative = (date: Date) => {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Penanda bahwa pekerjaan sudah aman — atau belum.
 *
 * Autosave yang tidak terlihat sama saja dengan tidak ada: pengguna tetap
 * tidak berani menutup tab. Yang penting justru keadaan gagalnya, karena di
 * situlah pekerjaan benar-benar terancam dan pengguna harus tahu sebelum
 * menutup halaman.
 */
export default function DraftStatusBar({ draft }: { draft: ServerDraft }) {
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
