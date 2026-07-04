import React, { useState } from 'react';
import { SolverProps } from '../types';
import { UploadCloud, FileText } from 'lucide-react';

import { storageService } from '../../../services/storage.service';

export default function FileUploadSolver({ comp, value, onChange }: SolverProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validasi ukuran & tipe bisa ditambahkan di sini berdasarkan comp.metadata
    setIsUploading(true);
    setError(null);
    try {
      const publicUrl = await storageService.uploadFileToR2(file);
      onChange({ name: file.name, size: file.size, type: file.type, url: publicUrl });
    } catch (err) {
      console.error("Gagal mengunggah file:", err);
      setError("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const allowedExts = comp.metadata?.allowedExtensions || 'semua format';
  const maxSize = comp.metadata?.maxSizeMb ? `${comp.metadata.maxSizeMb} MB` : 'Tanpa batas';

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}

      {value ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-400">
            <FileText className="w-6 h-6" />
            <div>
              <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-sm">{value.name}</p>
              <p className="text-xs opacity-70">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            onClick={() => onChange(null)}
            className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-500/10 rounded-lg"
          >
            Hapus File
          </button>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
            dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-border bg-bg hover:bg-foreground/5 hover:border-foreground/20'
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
          <label htmlFor={`file-upload-${comp.type}`} className={`flex flex-col items-center justify-center w-full h-full ${isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}>
            <UploadCloud className={`w-10 h-10 mb-4 ${dragActive ? 'text-cyan-400' : 'text-muted'} ${isUploading ? 'animate-bounce text-cyan-400' : ''}`} />
            <p className="text-sm text-title mb-1">
              {isUploading ? <span className="text-cyan-400 font-bold">Mengunggah file...</span> : <><span className="text-cyan-400 font-bold">Klik untuk unggah</span> atau seret file ke sini</>}
            </p>
            {!isUploading && (
              <p className="text-xs text-muted mb-4">
                Format didukung: {allowedExts} (Maks. {maxSize})
              </p>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
