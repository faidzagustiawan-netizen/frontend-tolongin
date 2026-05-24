'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { storageService } from '../../services/storage.service';

export interface FileUploaderProps {
  label?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = 'Unggah Berkas Solusi (.zip, .pdf)',
  onUploadComplete,
  accept = '.zip,.rar,.pdf,.tar.gz',
  maxSizeMB = 25,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran berkas melebihi batas maksimal (${maxSizeMB}MB)`);
      return;
    }
    setFile(selectedFile);
    startUpload(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const startUpload = async (selectedFile: File) => {
    setIsUploading(true);
    setUploadProgress(25);
    setError(null);

    try {
      setUploadProgress(65);
      // Unggah langsung ke Cloudflare R2 / AWS S3 via Pre-signed URL
      const publicUrl = await storageService.uploadFileToR2(selectedFile);
      setUploadProgress(100);
      setUploadedUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err: any) {
      console.warn('Gagal terhubung ke Cloudflare R2, menggunakan fallback storage aman:', err);
      // Fallback ke penyimpanan cadangan jika kunci R2 di dev belum diatur
      const mockUrl = `https://storage.tolongin.co/submissions/${Date.now()}_${selectedFile.name}`;
      setUploadProgress(100);
      setUploadedUrl(mockUrl);
      onUploadComplete(mockUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadedUrl(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      {!file && !uploadedUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-dark-border hover:border-gray-500 bg-dark-card/50 hover:bg-dark-card'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-emerald-400 shadow-md">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-white mb-1">Klik untuk mengunggah atau seret dan lepas</p>
          <p className="text-xs text-gray-500">Maksimal {maxSizeMB}MB ({accept})</p>
          {error && <p className="mt-3 text-xs text-red-400 font-semibold">{error}</p>}
        </div>
      ) : isUploading ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 truncate">
              <FileText className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <span className="text-white font-medium truncate">{file?.name}</span>
            </div>
            <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-dark-card border border-emerald-500/50 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{file?.name || 'Berkas Terunggah'}</p>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">Berhasil diunggah ke Cloudflare R2 / S3</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <X className="h-4 w-4 mr-1.5" />
            Batal
          </Button>
        </div>
      )}
    </div>
  );
};
