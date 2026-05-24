'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export interface LivenessCamProps {
  onCaptureComplete: (selfieUrl: string, idCardUrl: string) => void;
}

export const LivenessCam: React.FC<LivenessCamProps> = ({ onCaptureComplete }) => {
  const [step, setStep] = useState<'SELFIE' | 'ID_CARD' | 'DONE'>('SELFIE');
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (step !== 'DONE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        if (step === 'SELFIE') {
          setSelfiePhoto(dataUrl);
          setStep('ID_CARD');
        } else if (step === 'ID_CARD') {
          setIdCardPhoto(dataUrl);
          setStep('DONE');
          onCaptureComplete(selfiePhoto || dataUrl, dataUrl);
        }
      }
    }
  };

  const handleRetake = () => {
    setStep('SELFIE');
    setSelfiePhoto(null);
    setIdCardPhoto(null);
    startCamera();
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl max-w-xl mx-auto space-y-6 text-center">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">
          {step === 'SELFIE' && '1. Ambil Foto Wajah (Selfie)'}
          {step === 'ID_CARD' && '2. Ambil Foto Identitas (KTP/Paspor)'}
          {step === 'DONE' && 'Verifikasi AI Berhasil'}
        </h3>
        <p className="text-xs text-gray-400">
          {step === 'SELFIE' && 'Posisikan wajah Anda di tengah bingkai dan pastikan pencahayaan cukup.'}
          {step === 'ID_CARD' && 'Posisikan KTP/Paspor Anda dengan jelas tanpa pantulan cahaya.'}
          {step === 'DONE' && 'Data biometrik Anda telah dienkripsi dan diverifikasi oleh sistem AI.'}
        </p>
      </div>

      {step !== 'DONE' ? (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />

          {step === 'SELFIE' && (
            <div className="absolute inset-0 border-[3px] border-emerald-500/50 rounded-full w-48 h-64 mx-auto my-auto pointer-events-none shadow-[0_0_0_999px_rgba(0,0,0,0.6)]" />
          )}

          {step === 'ID_CARD' && (
            <div className="absolute inset-0 border-[3px] border-cyan-500/50 rounded-xl w-72 h-44 mx-auto my-auto pointer-events-none shadow-[0_0_0_999px_rgba(0,0,0,0.6)]" />
          )}

          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
              <p className="text-xs text-gray-400">Memuat kamera...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/50 shadow-md">
            <img src={selfiePhoto!} alt="Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
            <div className="absolute bottom-2 left-2 bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Wajah
            </div>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-cyan-500/50 shadow-md">
            <img src={idCardPhoto!} alt="ID Card" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-cyan-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> KTP
            </div>
          </div>
        </div>
      )}

      {step !== 'DONE' ? (
        <Button onClick={capturePhoto} size="lg" className="w-full shadow-xl">
          <Camera className="h-5 w-5 mr-2" />
          Ambil Foto
        </Button>
      ) : (
        <Button variant="outline" onClick={handleRetake} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Ulangi Pengambilan Foto
        </Button>
      )}
    </div>
  );
};
