'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { CameraOff, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContinuousProctoringProps {
  biometricVector: number[] | null;
  onViolation: (message: string) => void;
  intervalMs?: number;
}

export function ContinuousProctoring({ biometricVector, onViolation, intervalMs = 5000 }: ContinuousProctoringProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const missingFaceCounter = useRef<number>(0);

  const stopVideo = React.useCallback(() => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  const startVideo = React.useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setWarningMessage("Akses kamera ditolak. Sistem tidak dapat memverifikasi kehadiran Anda.");
        onViolation("Kamera dimatikan atau akses ditolak selama pengerjaan.");
      });
  }, [onViolation]);

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
        console.error("Gagal memuat model face-api untuk background proctoring:", err);
      }
    };
    loadModels();

    return () => {
      stopVideo();
    };
  }, [startVideo, stopVideo]);

  useEffect(() => {
    if (modelsLoaded && videoRef.current) {
      detectionInterval.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (!detection) {
              missingFaceCounter.current += 1;
              if (missingFaceCounter.current >= 2) {
                setWarningMessage("Wajah tidak terdeteksi di kamera! Harap kembali ke depan layar.");
                onViolation("Wajah tidak terdeteksi di kamera.");
              }
            } else {
              missingFaceCounter.current = 0; // Reset
              
              if (biometricVector && biometricVector.length > 0) {
                const desc1 = new Float32Array(Array.from(detection.descriptor));
                const desc2 = new Float32Array(biometricVector);
                const distance = faceapi.euclideanDistance(desc1, desc2);

                if (distance > 0.6) {
                  setWarningMessage("Peringatan: Wajah yang terdeteksi tidak cocok dengan peserta terdaftar!");
                  onViolation(`Terdeteksi wajah asing (Distance: ${distance.toFixed(2)}).`);
                } else {
                  setWarningMessage(null);
                }
              } else {
                setWarningMessage(null);
              }
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
  }, [modelsLoaded, biometricVector, intervalMs, onViolation]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-1 h-1 opacity-0 absolute pointer-events-none"
      />
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
