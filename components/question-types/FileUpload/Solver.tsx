import React, { useState } from 'react';
import { SolverProps } from '../types';
import { UploadCloud, FileText } from 'lucide-react';

export default function FileUploadSolver({ comp, value, onChange }: SolverProps) {
  const [dragActive, setDragActive] = useState(false);

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

  const handleFile = (file: File) => {
    // In a real implementation, you'd upload this file to a server/storage
    // and store the URL. Here we just store the file name for the mock UI.
    onChange({ name: file.name, size: file.size, type: file.type });
  };

  const allowedExts = comp.metadata?.allowedExtensions || 'semua format';
  const maxSize = comp.metadata?.maxSizeMb ? `${comp.metadata.maxSizeMb} MB` : 'Tanpa batas';

  return (
    <div className="space-y-4">
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
            dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-border bg-bg hover:bg-white/5 hover:border-white/20'
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
          />
          <label htmlFor={`file-upload-${comp.type}`} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
            <UploadCloud className={`w-10 h-10 mb-4 ${dragActive ? 'text-cyan-400' : 'text-muted'}`} />
            <p className="text-sm text-title mb-1">
              <span className="text-cyan-400 font-bold">Klik untuk unggah</span> atau seret file ke sini
            </p>
            <p className="text-xs text-muted mb-4">
              Format didukung: {allowedExts} (Maks. {maxSize})
            </p>
          </label>
        </div>
      )}
    </div>
  );
}
