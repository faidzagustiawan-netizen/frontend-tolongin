import React, { useState, useRef, useEffect } from 'react';
import { SolverProps } from '../types';
import { Video, Mic, StopCircle, Play, Loader2, RefreshCw } from 'lucide-react';
import { storageService } from '../../../services/storage.service';

export default function VideoRecordingSolver({ comp, value, onChange }: SolverProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const maxDurationMinutes = comp.metadata?.maxDurationMinutes || 5;

  useEffect(() => {
    return () => {
      // Cleanup stream when unmounted
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute self playback
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsUploading(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
          
          // Stop all tracks to turn off camera light
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          const publicUrl = await storageService.uploadFileToR2(file);
          onChange(publicUrl);
        } catch (err) {
          console.error("Gagal mengunggah video:", err);
          setError("Gagal mengunggah rekaman. Silakan coba lagi.");
        } finally {
          setIsUploading(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Gagal mengakses kamera/mikrofon:", err);
      setError("Gagal mengakses kamera/mikrofon. Pastikan Anda memberikan izin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}

      {value ? (
        <div className="border border-border rounded-xl p-4 bg-bg flex flex-col gap-4">
          <video src={value} controls className="w-full rounded-lg max-h-64 bg-black" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-400">
              <Video className="w-5 h-5" />
              <p className="text-sm font-bold truncate max-w-[200px]">{value.split('/').pop()}</p>
            </div>
            <button 
              onClick={() => onChange(null)}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-500/10 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Rekam Ulang
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl p-4 sm:p-8 bg-bg flex flex-col items-center justify-center text-center">
          <div className={`w-full max-w-md aspect-video bg-black rounded-lg mb-6 overflow-hidden relative ${!isRecording && 'hidden'}`}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-white">REC</span>
            </div>
          </div>

          {!isRecording && (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
              isUploading ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-400'
            }`}>
              {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Video className="w-8 h-8" />}
            </div>
          )}
          
          <h4 className="text-foreground font-bold mb-1">
            {isUploading ? 'Mengunggah Rekaman...' : isRecording ? 'Sedang Merekam' : 'Siap Merekam'}
          </h4>
          <p className="text-xs text-muted mb-6 max-w-xs">
            {isUploading ? 'Harap tunggu hingga proses unggah selesai.' : 
             `Durasi maksimal adalah ${maxDurationMinutes} menit. Pastikan pencahayaan dan suara Anda jelas.`}
          </p>
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-black'
            }`}
          >
            {isRecording ? (
              <><StopCircle className="w-4 h-4" /> Selesai & Simpan</>
            ) : (
              <><Video className="w-4 h-4" /> Mulai Merekam</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
