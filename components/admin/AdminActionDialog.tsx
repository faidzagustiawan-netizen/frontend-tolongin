'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export interface AdminActionDialogProps {
  open: boolean;
  title: string;
  /** Penjelasan akibat tindakan. Wajib diisi — ini alasan dialog ini ada. */
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
  destructive?: boolean;
  /**
   * Bila diisi, dialog menampilkan kotak alasan. Nilainya diteruskan ke
   * `onConfirm`. Tanpa medan ini dialog berperilaku seperti konfirmasi biasa.
   */
  reason?: {
    label: string;
    placeholder?: string;
    /** Alasan wajib diisi sebelum tombol konfirmasi hidup. */
    required?: boolean;
    /** Panjang minimum. Ditegakkan di sini, bukan baru ditolak server. */
    minLength?: number;
    /** Keterangan tambahan, mis. "dikirim ke pengguna". */
    hint?: string;
  };
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

/**
 * Pengganti `confirm()` dan `prompt()` bawaan peramban untuk keputusan admin.
 *
 * Seluruh tindakan admin yang berisiko — blokir akun, kirim peringatan, tolak
 * KYB, tolak identitas, turunkan studi kasus, tutup tiket — dulu memakai dialog
 * bawaan. Tiga masalahnya nyata, bukan soal selera:
 *
 * 1. `prompt()` tidak bisa memvalidasi apa pun. Halaman moderasi menuntut alasan
 *    "minimal 10 karakter" di teks promptnya, lalu hanya memeriksa `!reason` —
 *    alasan tiga huruf tetap dikirim, ditolak server, dan admin hanya membaca
 *    "Gagal menurunkan studi kasus" tanpa disebut aturan panjangnya.
 * 2. Dialog bawaan memblokir seluruh utas dan tidak bisa menampilkan konteks:
 *    nama akun yang terdampak, apakah tindakannya bisa dibatalkan, siapa yang
 *    menerima alasan yang diketik.
 * 3. Pembatalan `prompt()` berakhir senyap — tidak ada yang membedakan "admin
 *    berubah pikiran" dari "tombolnya rusak".
 *
 * `Modal` di baliknya sudah menangani Esc, jebakan fokus, kunci gulir, dan
 * pengembalian fokus lewat `useDialogA11y`.
 */
export function AdminActionDialog({
  open,
  title,
  children,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  isBusy = false,
  destructive = false,
  reason,
  onConfirm,
  onCancel,
}: AdminActionDialogProps) {
  const [nilai, setNilai] = useState('');
  const [tersentuh, setTersentuh] = useState(false);

  // Isian dikosongkan tiap dialog dibuka, supaya alasan penolakan akun
  // sebelumnya tidak terbawa ke akun berikutnya.
  useEffect(() => {
    if (open) {
      setNilai('');
      setTersentuh(false);
    }
  }, [open]);

  const minLength = reason?.minLength ?? 0;
  const terpangkas = nilai.trim();
  const kurangPanjang = terpangkas.length < minLength;
  const kosongPadahalWajib = !!reason?.required && terpangkas.length === 0;
  const tidakSah = !!reason && (kosongPadahalWajib || kurangPanjang);

  const pesanGalat = !tersentuh
    ? null
    : kosongPadahalWajib
      ? 'Alasan wajib diisi.'
      : kurangPanjang
        ? `Alasan minimal ${minLength} karakter — tersisa ${minLength - terpangkas.length} lagi.`
        : null;

  return (
    <Modal isOpen={open} onClose={isBusy ? () => {} : onCancel} title={title}>
      <div className="space-y-4 text-sm leading-relaxed">
        {children}

        {reason && (
          <div className="space-y-1.5">
            <label htmlFor="alasan-tindakan-admin" className="block text-xs font-bold text-foreground">
              {reason.label}
              {reason.required && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="alasan-tindakan-admin"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              onBlur={() => setTersentuh(true)}
              placeholder={reason.placeholder}
              rows={3}
              disabled={isBusy}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
            />
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">{reason.hint}</p>
              {minLength > 0 && (
                <span
                  className={`text-[11px] font-mono shrink-0 ${
                    kurangPanjang ? 'text-amber-400' : 'text-muted-foreground'
                  }`}
                >
                  {terpangkas.length}/{minLength}
                </span>
              )}
            </div>
            {pesanGalat && (
              <p role="alert" className="text-[11px] font-medium text-red-500">
                {pesanGalat}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isBusy}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? 'danger' : 'primary'}
          onClick={() => {
            if (tidakSah) {
              setTersentuh(true);
              return;
            }
            onConfirm(reason ? terpangkas : undefined);
          }}
          isLoading={isBusy}
          disabled={tidakSah}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
