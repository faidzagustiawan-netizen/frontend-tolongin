'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verificationService } from '../../services/verification.service';

interface ContinuousProctoringProps {
  biometricVector: number[] | null;
  onViolation: (message: string) => void;
  intervalMs?: number;
}

export function ContinuousProctoring({ biometricVector, onViolation, intervalMs = 30000 }: ContinuousProctoringProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const missingFaceCounter = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  const stopVideo = React.useCallback(() => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  const startVideo = React.useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: "user" }, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      })
      .catch((err) => {
        setWarningMessage("Akses kamera ditolak. Sistem tidak dapat memverifikasi kehadiran Anda.");
        onViolation("Kamera dimatikan atau akses ditolak selama pengerjaan.");
      });
  }, [onViolation]);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, [startVideo, stopVideo]);

  useEffect(() => {
    if (isReady && videoRef.current && canvasRef.current) {
      detectionInterval.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);

            // Using Backend Verification
            const result = await verificationService.verifyExecution({ livePhotoUrl: imageDataUrl });
            
            if (!result.verified) {
                // If it's 0 or very low, it might mean no face detected by backend
                if (result.matchScore < 10) {
                    missingFaceCounter.current += 1;
                    if (missingFaceCounter.current >= 2) {
                        setWarningMessage("Wajah tidak terdeteksi di kamera! Harap kembali ke depan layar.");
                        onViolation("Wajah tidak terdeteksi di kamera.");
                    }
                } else {
                    missingFaceCounter.current = 0; // Reset
                    setWarningMessage("Peringatan: Wajah yang terdeteksi tidak cocok dengan peserta terdaftar!");
                    onViolation(`Terdeteksi wajah asing (Score: ${result.matchScore}).`);
                }
            } else {
                missingFaceCounter.current = 0; // Reset
                setWarningMessage(null);
            }
          } catch (e) {
            console.error("Error during continuous face detection", e);
          }
        }
      }, intervalMs);
    }
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [isReady, intervalMs, onViolation]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-1 h-1 opacity-0 absolute pointer-events-none"
      />
      <canvas ref={canvasRef} className="hidden" />
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xl border border-red-400"
          >
            <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
              {warningMessage.includes("Wajah tidak terdeteksi") ? (
                <CameraOff className="w-6 h-6 text-foreground" />
              ) : (
                <UserX className="w-6 h-6 text-foreground" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight mb-0.5">Peringatan Keamanan</h4>
              <p className="text-sm font-medium text-red-50">{warningMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
