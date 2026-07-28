'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';

interface FaceScannerProps {
  onCaptureComplete: (descriptor: number[], imageDataUrl?: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function FaceScanner({ onCaptureComplete, onCancel, title = "Pemindaian Wajah", description = "Arahkan wajah Anda ke kamera dan pastikan pencahayaan cukup." }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selfieImg, setSelfieImg] = useState<string | null>(null);

  const stopVideo = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startVideo = React.useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: "user" } })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error("Gagal mengakses webcam:", err);
        setError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
      });
  }, []);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, []); // Only run once on mount

  // Cleanup on unmount separately to ensure stream is latest
  useEffect(() => {
    return () => stopVideo();
  }, [stopVideo]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setError(null);
    setSuccess(null);

    // Simulate active liveness check delay
    setTimeout(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        // Keluar tanpa melepas isCapturing akan meninggalkan tombol dalam
        // keadaan memuat selamanya, tanpa pesan apa pun ke pengguna.
        setError('Kamera tidak lagi tersedia. Coba mulai ulang pemindaian.');
        setIsCapturing(false);
        return;
      }

      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieImg(imageDataUrl);
        setSuccess("Wajah berhasil dipindai!");
        
        setTimeout(() => {
          stopVideo();
          // We pass an empty array for descriptor since we no longer use local face-api
          onCaptureComplete([], imageDataUrl);
        }, 1000);
      } else {
         setError("Gagal memindai wajah (Canvas context error).");
         setIsCapturing(false);
      }
    }, 1500); // 1.5s scanning effect
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" /> {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
      </div>

      <div className="relative mx-auto w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full overflow-hidden border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] bg-black">
        {selfieImg ? (
           <img src={selfieImg} alt="Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
           <video 
             ref={videoRef} 
             autoPlay 
             muted 
             playsInline
             className="w-full h-full object-cover transform scale-x-[-1]"
           />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* MASKING OVAL */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
           <div className="w-[60%] h-[75%] border-[3px] border-white/50 rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
        </div>

        {/* SCANNING LINE ANIMATION */}
        {isCapturing && (
          <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-400 shadow-[0_0_15px_#34d399] z-20 animate-[scan_2s_ease-in-out_infinite]" />
        )}
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}} />
      </div>

      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{success}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        {onCancel && (
          <Button variant="outline" onClick={() => { stopVideo(); onCancel(); }} className="flex-1" disabled={isCapturing || !!success}>
            Batal
          </Button>
        )}
        <Button onClick={handleCapture} isLoading={isCapturing} disabled={!!success || !!error} className="flex-1 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
          {isCapturing ? 'Memindai...' : 'Ambil Pemindaian'}
        </Button>
      </div>
    </div>
  );
}
