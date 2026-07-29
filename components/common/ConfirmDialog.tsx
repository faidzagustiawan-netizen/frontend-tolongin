'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true saat aksi sedang berjalan; kedua tombol dikunci. */
  isBusy?: boolean;
  /** Memberi tombol konfirmasi warna merusak, untuk aksi yang menghapus. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Jeda satu langkah sebelum aksi yang tidak bisa dibatalkan.
 *
 * Dipakai untuk penilaian submisi — aksi yang memberi XP dan token lalu
 * mengunci dirinya sendiri, tetapi sebelumnya berangkat dari satu klik tanpa
 * peringatan apa pun.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  isBusy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={open} onClose={isBusy ? () => {} : onCancel} title={title}>
      <div className="space-y-4 text-sm leading-relaxed">{children}</div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isBusy}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isBusy}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
