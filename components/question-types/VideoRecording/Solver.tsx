import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SolverProps } from '../types';
import {
  AlertCircle,
  Camera,
  Loader2,
  RefreshCw,
  StopCircle,
  Video,
} from 'lucide-react';
import { storageService } from '../../../services/storage.service';

/**
 * Batas unggah server adalah 25 MB (MAX_UPLOAD_BYTES di
 * backend/src/storage/upload-policy.ts). Target di sini sengaja lebih rendah
 * supaya wadah WebM dan variasi bitrate sesaat tidak menembusnya di ujung
 * durasi.
 */
const TARGET_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Batas bawah agar wajah dan suara tetap terbaca, batas atas agar hemat. */
const MIN_TOTAL_BITS_PER_SECOND = 400_000;
const MAX_TOTAL_BITS_PER_SECOND = 2_000_000;
const AUDIO_BITS_PER_SECOND = 64_000;

/** Hitung mundur sebelum perekaman benar-benar dimulai. */
const COUNTDOWN_SECONDS = 3;

/**
 * Wadah rekaman menurut apa yang benar-benar didukung peramban.
 *
 * Versi sebelumnya memaksa `video/webm`. Safari tidak mendukungnya di
 * MediaRecorder, jadi konstruktornya melempar dan perekaman gagal sebelum
 * dimulai — tanpa penjelasan selain "gagal mengakses kamera".
 */
const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;

  for (const candidate of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }

  return null;
}

/**
 * Bitrate yang membuat rekaman sepanjang durasi maksimal tetap muat.
 *
 * Tanpa ini MediaRecorder memakai bawaan peramban — sekitar 2,5 Mbps — dan
 * rekaman dua menit saja sudah menembus 25 MB, sehingga unggahannya selalu
 * ditolak setelah kandidat selesai berbicara.
 */
function bitrateForDuration(maxDurationMinutes: number) {
  const seconds = Math.max(30, maxDurationMinutes * 60);
  const total = Math.round((TARGET_UPLOAD_BYTES * 8) / seconds);

  const clamped = Math.min(
    MAX_TOTAL_BITS_PER_SECOND,
    Math.max(MIN_TOTAL_BITS_PER_SECOND, total),
  );

  return {
    videoBitsPerSecond: Math.max(200_000, clamped - AUDIO_BITS_PER_SECOND),
    audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
  };
}

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

type Stage = 'IDLE' | 'READY' | 'COUNTDOWN' | 'RECORDING' | 'UPLOADING';

export default function VideoRecordingSolver({ comp, value, onChange }: SolverProps) {
  const [stage, setStage] = useState<Stage>('IDLE');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const maxDurationMinutes = Number(comp.metadata?.maxDurationMinutes) || 5;
  const maxSeconds = maxDurationMinutes * 60;

  const releaseCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => releaseCamera, [releaseCamera]);

  /**
   * Menyalakan kamera untuk pratinjau, tanpa merekam apa pun.
   *
   * Dulu menekan "Mulai Merekam" langsung meminta izin dan merekam pada detik
   * yang sama, sehingga detik-detik pertama selalu berisi kandidat yang masih
   * membenahi posisi dan membaca dialog izin peramban.
   */
  const prepareCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setStage('READY');
    } catch {
      setError(
        'Kamera atau mikrofon tidak bisa diakses. Periksa izin peramban, lalu coba lagi.',
      );
      setStage('IDLE');
    }
  };

  const cancelPreparation = () => {
    releaseCamera();
    setStage('IDLE');
    setCountdown(COUNTDOWN_SECONDS);
  };

  const beginRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickMimeType();
    if (!mimeType) {
      setError(
        'Peramban ini tidak mendukung perekaman video. Coba Chrome, Edge, atau Firefox versi terbaru.',
      );
      setStage('READY');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType,
        ...bitrateForDuration(maxDurationMinutes),
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setStage('UPLOADING');
        const blob = new Blob(chunksRef.current, { type: mimeType });
        releaseCamera();

        // Diperiksa sebelum dikirim. Server menolak yang kelewat besar dengan
        // galat multipart yang tidak menyebutkan ukurannya, dan kandidat hanya
        // melihat "gagal mengunggah" setelah menunggu unggahan panjang.
        if (blob.size > TARGET_UPLOAD_BYTES * 1.25) {
          setError(
            `Rekaman terlalu besar (${formatSize(blob.size)}). Rekam ulang dengan durasi lebih pendek.`,
          );
          setStage('IDLE');
          return;
        }

        try {
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const file = new File(
            [blob],
            `rekaman-${Date.now()}.${extension}`,
            // Parameter codec dibuang: kebijakan server mencocokkan tipe dasar,
            // dan "video/webm;codecs=vp9,opus" tidak ada di daftar izinnya.
            { type: mimeType.split(';')[0] },
          );
          onChange(await storageService.uploadFileToR2(file));
          setStage('IDLE');
        } catch (err: any) {
          setError(
            err?.message ||
              'Rekaman gagal diunggah. Periksa koneksi Anda lalu rekam ulang.',
          );
          setStage('IDLE');
        }
      };

      // Potongan per detik: tanpa ini seluruh rekaman baru muncul saat berhenti,
      // dan perekaman panjang menahan semuanya di memori sekaligus.
      recorder.start(1000);
      setElapsed(0);
      setStage('RECORDING');
    } catch {
      setError('Perekaman gagal dimulai. Coba muat ulang halaman.');
      setStage('READY');
    }
  }, [maxDurationMinutes, onChange, releaseCamera]);

  // Hitung mundur persiapan.
  useEffect(() => {
    if (stage !== 'COUNTDOWN') return;

    if (countdown <= 0) {
      beginRecording();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, countdown, beginRecording]);

  // Penghitung durasi sekaligus penegak batas.
  useEffect(() => {
    if (stage !== 'RECORDING') return;

    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Batas durasi dulu hanya tertulis di layar dan tidak pernah ditegakkan,
        // jadi berkasnya tumbuh sampai melewati batas unggah.
        if (next >= maxSeconds) {
          mediaRecorderRef.current?.stop();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, maxSeconds]);

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const remaining = Math.max(0, maxSeconds - elapsed);

  if (value) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl p-4 bg-background flex flex-col gap-4">
          <video src={value} controls className="w-full rounded-lg max-h-64 bg-black" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-emerald-400 min-w-0">
              <Video className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm font-bold truncate">Rekaman tersimpan</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setError(null);
              }}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 bg-red-500/10 rounded-lg flex items-center gap-1 flex-shrink-0"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" /> Rekam Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showCameraFrame = stage !== 'IDLE' && stage !== 'UPLOADING';

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="border border-border rounded-xl p-4 sm:p-6 bg-background flex flex-col items-center text-center">
        <div
          className={`w-full max-w-md aspect-video bg-black rounded-lg mb-5 overflow-hidden relative ${
            showCameraFrame ? '' : 'hidden'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {stage === 'COUNTDOWN' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <span className="text-6xl font-extrabold text-white tabular-nums">
                {countdown}
              </span>
              <span className="text-xs text-white/80 mt-2">Bersiap...</span>
            </div>
          )}

          {stage === 'RECORDING' && (
            <>
              <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-white">REC</span>
              </div>
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                <span className="text-xs font-mono text-white tabular-nums">
                  Sisa {formatClock(remaining)}
                </span>
              </div>
            </>
          )}
        </div>

        {stage === 'IDLE' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-cyan-500/10 text-cyan-400">
              <Camera className="w-8 h-8" aria-hidden="true" />
            </div>
            <h4 className="text-foreground font-bold mb-1">Siapkan kamera dulu</h4>
            <p className="text-xs text-muted-foreground mb-5 max-w-sm leading-relaxed">
              Kamera menyala untuk pratinjau lebih dulu — perekaman baru mulai
              setelah Anda menekan tombolnya, dengan hitung mundur{' '}
              {COUNTDOWN_SECONDS} detik. Durasi maksimal {maxDurationMinutes} menit
              dan akan berhenti sendiri saat habis.
            </p>
            <button
              type="button"
              onClick={prepareCamera}
              className="px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black transition-colors"
            >
              <Camera className="w-4 h-4" aria-hidden="true" /> Nyalakan Kamera
            </button>
          </>
        )}

        {stage === 'READY' && (
          <>
            <h4 className="text-foreground font-bold mb-1">Sudah siap?</h4>
            <p className="text-xs text-muted-foreground mb-5 max-w-sm leading-relaxed">
              Perbaiki posisi dan pencahayaan Anda. Perekaman dimulai setelah
              hitung mundur {COUNTDOWN_SECONDS} detik.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={cancelPreparation}
                className="px-5 py-2.5 rounded-full font-bold text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Matikan Kamera
              </button>
              <button
                type="button"
                onClick={() => {
                  setCountdown(COUNTDOWN_SECONDS);
                  setStage('COUNTDOWN');
                }}
                className="px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black transition-colors"
              >
                <Video className="w-4 h-4" aria-hidden="true" /> Mulai Merekam
              </button>
            </div>
          </>
        )}

        {stage === 'RECORDING' && (
          <button
            type="button"
            onClick={stopRecording}
            className="px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <StopCircle className="w-4 h-4" aria-hidden="true" /> Selesai &amp; Simpan
          </button>
        )}

        {stage === 'UPLOADING' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-amber-500/10 text-amber-500">
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>
            <h4 className="text-foreground font-bold mb-1">Mengunggah rekaman...</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Jangan tutup halaman ini sampai proses selesai.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
