'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
        startVideo();
      } catch (err) {
        console.error("Gagal memuat model face-api:", err);
        setError("Gagal memuat model pendeteksi wajah. Pastikan folder /models tersedia.");
      }
    };
    loadModels();

    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Gagal mengakses webcam:", err);
        setError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
      });
  };

  useEffect(() => {
    if (modelsLoaded && videoRef.current) {
      detectionInterval.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const detection = await faceapi.detectSingleFace(videoRef.current);
            setIsFaceDetected(!!detection);
          } catch (e) {
            setIsFaceDetected(false);
          }
        }
      }, 500);
    }
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [modelsLoaded]);

  const stopVideo = () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsCapturing(true);
    setError(null);
    setSuccess(null);

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError("Wajah tidak terdeteksi. Harap pastikan wajah Anda terlihat jelas oleh kamera.");
      } else {
        const descriptorArray = Array.from(detection.descriptor);
        
        // Capture frame as Data URL
        let imageDataUrl = undefined;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Because video is mirrored in UI, we mirror it in canvas
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch (e) {
          console.error('Failed to capture image frame', e);
        }

        setSuccess("Wajah berhasil dipindai!");
        setTimeout(() => {
          stopVideo();
          onCaptureComplete(descriptorArray, imageDataUrl);
        }, 1000);
      }
    } catch (err) {
      console.error("Error saat memindai wajah:", err);
      setError("Terjadi kesalahan saat memindai wajah.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" /> {title}
        </h3>
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{description}</p>
      </div>

      <div className="relative mx-auto w-full max-w-sm rounded-2xl overflow-hidden border-2 border-dark-border bg-black aspect-square flex items-center justify-center">
        {!modelsLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-dark-bg/80 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm text-emerald-400 font-medium animate-pulse">Memuat model AI...</p>
          </div>
        )}

        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${modelsLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Framing Overlay */}
        <div className={`absolute inset-0 border-[6px] rounded-2xl pointer-events-none z-10 m-8 transition-colors duration-300 ${
          isFaceDetected ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
        }`}></div>
        
        {isCapturing && (
          <div className="absolute inset-0 bg-emerald-500/20 z-20 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          </div>
        )}
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

      <div className="mt-8 flex gap-4">
        {onCancel && (
          <Button variant="outline" onClick={() => { stopVideo(); onCancel(); }} className="flex-1" disabled={isCapturing}>
            Batal
          </Button>
        )}
        <Button onClick={handleCapture} isLoading={isCapturing} disabled={!modelsLoaded || !!success || !isFaceDetected} className="flex-1 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
          Pindai Wajah Sekarang
        </Button>
      </div>
    </div>
  );
}
