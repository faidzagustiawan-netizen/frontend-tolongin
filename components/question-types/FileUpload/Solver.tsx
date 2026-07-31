import React, { useState } from 'react';
import { SolverProps } from '../types';
import { UploadCloud, FileText } from 'lucide-react';

import { storageService } from '../../../services/storage.service';

/** Nama berkas dibaca kembali dari URL-nya. */
const fileNameFromUrl = (url: string) => {
  try {
    const path = new URL(url, 'http://x').pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() || 'Berkas terunggah');
  } catch {
    return 'Berkas terunggah';
  }
};

/**
 * Jawaban berupa satu berkas.
 *
 * Nilainya berupa URL, bukan objek `{name, size, url}`. Kolom penyimpanannya
 * memang satu string (`ComponentResponse.fileUrl`), jadi bentuk lain akan hilang
 * begitu jawaban dimuat ulang — nama dan ukurannya tidak punya tempat menetap.
 */
export default function FileUploadSolver({ comp, value, onChange, readOnly }: SolverProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeMb = Number(comp.metadata?.maxSizeMb) || null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (readOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      void handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Batas ukuran sudah lama bisa diisi di Builder tetapi tidak pernah
    // ditegakkan di mana pun; berkas kelewat besar baru ditolak server dengan
    // galat yang tidak menyebut ukurannya.
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setError(
        `Berkas ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${maxSizeMb} MB.`,
      );
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      onChange(await storageService.uploadFileToR2(file));
    } catch (err) {
      console.error('Gagal mengunggah file:', err);
      setError('Gagal mengunggah file. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const allowedExts = comp.metadata?.allowedExtensions || 'semua format';
  const maxSizeLabel = maxSizeMb ? `${maxSizeMb} MB` : 'Tanpa batas';

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          {error}
        </div>
      )}

      {value ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-emerald-400 min-w-0">
            <FileText className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-bold truncate">{fileNameFromUrl(value)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"
            >
              Lihat
            </a>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-500/10 rounded-lg"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      ) : readOnly ? (
        <p className="text-xs text-muted italic">Tidak ada berkas yang diunggah.</p>
      ) : (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
            dragActive
              ? 'border-cyan-500 bg-cyan-500/5'
              : 'border-border bg-bg hover:bg-foreground/5 hover:border-foreground/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={`file-upload-${comp.type}`}
            className="hidden"
            onChange={handleChange}
            disabled={isUploading}
          />
          <label
            htmlFor={`file-upload-${comp.type}`}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer'
            }`}
          >
            <UploadCloud
              className={`w-10 h-10 mb-4 ${dragActive ? 'text-cyan-400' : 'text-muted'} ${
                isUploading ? 'animate-bounce text-cyan-400' : ''
              }`}
              aria-hidden="true"
            />
            <p className="text-sm text-title mb-1">
              {isUploading ? (
                <span className="text-cyan-400 font-bold">Mengunggah file...</span>
              ) : (
                <>
                  <span className="text-cyan-400 font-bold">Klik untuk unggah</span> atau
                  seret file ke sini
                </>
              )}
            </p>
            {!isUploading && (
              <p className="text-xs text-muted mb-4">
                Format didukung: {allowedExts} (Maks. {maxSizeLabel})
              </p>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
