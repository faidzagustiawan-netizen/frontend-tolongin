'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, RefreshCw, Sun, Glasses, ScanFace, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';

interface FaceScannerProps {
  onCaptureComplete: (descriptor: number[], imageDataUrl?: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  isVerifying?: boolean;
}

/**
 * Pengambilan foto wajah.
 *
 * CATATAN PENTING soal cermin. Pratinjau langsung sengaja dicerminkan karena
 * itulah yang terasa wajar saat orang melihat dirinya sendiri — gerak ke kanan
 * tampak ke kanan. Tetapi foto yang DIKIRIM tidak boleh ikut dicerminkan.
 *
 * Sebelumnya canvas membalik gambar saat menyalin dari video, lalu hasilnya
 * ditampilkan dengan scale-x-[-1] sekali lagi. Dua pembalikan itu membuat foto
 * yang dilihat pengguna berlawanan arah dengan foto yang benar-benar dikirim,
 * dan itulah yang terasa seperti "kok jadi mirror setelah diambil".
 *
 * Efeknya bukan cuma soal rasa. Foto KTP tidak pernah dicerminkan, jadi selfie
 * yang tercermin dibandingkan dengan KTP yang tidak — ketidakcocokan arah itu
 * menambah jarak biometrik pada pasangan yang sebenarnya sah.
 */
export function FaceScanner({
  onCaptureComplete,
  onCancel,
  title = 'Pemindaian Wajah',
  description = 'Arahkan wajah Anda ke kamera dan pastikan pencahayaan cukup.',
  isVerifying = false,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selfieImg, setSelfieImg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopVideo = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startVideo = React.useCallback(async () => {
    setError(null);
    setIsReady(false);
    try {
      // Resolusi diminta lebih tinggi daripada bingkai tampilan: pencocokan
      // wajah bekerja pada piksel asli, bukan pada ukuran elemen di layar.
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      const ditolak =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const tidakAda =
        err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';

      setError(
        ditolak
          ? 'Izin kamera ditolak. Klik ikon gembok di address bar browser, izinkan kamera, lalu muat ulang halaman ini.'
          : tidakAda
            ? 'Kamera tidak terdeteksi. Pastikan perangkat Anda punya kamera dan tidak sedang dipakai aplikasi lain.'
            : 'Tidak dapat mengakses kamera. Tutup aplikasi lain yang sedang memakainya, lalu coba lagi.',
      );
    }
  }, []);

  useEffect(() => {
    startVideo();
    return () => stopVideo();
  }, [startVideo, stopVideo]);

  const ambilFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      setError('Kamera belum siap. Tunggu gambar muncul lalu coba lagi.');
      setIsCapturing(false);
      setCountdown(null);
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      setError('Gagal menyiapkan kanvas untuk mengambil gambar.');
      setIsCapturing(false);
      setCountdown(null);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Disalin apa adanya. Tidak ada translate/scale di sini — lihat catatan
    // cermin di atas.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setSelfieImg(canvas.toDataURL('image/jpeg', 0.92));
    setIsCapturing(false);
    setCountdown(null);
    stopVideo();
  };

  const mulaiHitungMundur = () => {
    setError(null);
    setIsCapturing(true);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      ambilFoto();
      return;
    }
    const timer = setTimeout(() => setCountdown((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const ulangi = () => {
    setSelfieImg(null);
    setError(null);
    startVideo();
  };

  const gunakan = () => {
    if (!selfieImg) return;
    // Descriptor kosong: pencocokan dilakukan di server, bukan di peramban.
    onCaptureComplete([], selfieImg);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="text-center mb-5">
        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" /> {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
      </div>

      {!selfieImg && !error && (
        <div className="mb-5 grid grid-cols-3 gap-2 max-w-md mx-auto">
          {[
            { icon: Sun, text: 'Cahaya dari depan' },
            { icon: ScanFace, text: 'Wajah penuh di bingkai' },
            { icon: Glasses, text: 'Lepas masker & topi' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center gap-1.5 text-center bg-background border border-border rounded-xl p-2.5"
            >
              <Icon className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] leading-tight text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative mx-auto w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full overflow-hidden border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] bg-black">
        {selfieImg ? (
          // Ditampilkan apa adanya, tanpa scale-x. Yang dilihat pengguna di
          // sini persis foto yang dikirim ke server.
          <img src={selfieImg} alt="Hasil foto" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => setIsReady(true)}
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {!selfieImg && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-[62%] h-[78%] border-[3px] border-white/50 rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {isVerifying && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-emerald-400">Menganalisis Biometrik Wajah AI...</p>
              <p className="text-[10px] text-muted-foreground">Membandingkan dengan KTP/Identitas terdaftar</p>
            </div>
          </div>
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
            <span className="text-7xl font-black text-white drop-shadow-lg tabular-nums">
              {countdown}
            </span>
          </div>
        )}

        {!isReady && !selfieImg && !error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <span className="text-xs text-white/80">Menyalakan kamera…</span>
          </div>
        )}
      </div>

      {selfieImg && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Foto ini tampil sesuai aslinya, bukan pantulan cermin — jadi tulisan apa pun
          akan terbaca normal. Inilah gambar yang dibandingkan dengan foto pada KTP Anda.
        </p>
      )}

      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-xs font-medium leading-relaxed">{error}</p>
            <button
              onClick={startVideo}
              className="text-xs font-bold underline underline-offset-2 hover:text-red-300"
            >
              Coba nyalakan kamera lagi
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        {selfieImg ? (
          <>
            <Button variant="outline" onClick={ulangi} disabled={isVerifying} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" /> Ambil Ulang
            </Button>
            <Button
              onClick={gunakan}
              disabled={isVerifying}
              isLoading={isVerifying}
              className="flex-1 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {isVerifying ? (
                'Menganalisis Wajah...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Gunakan Foto Ini
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {onCancel && (
              <Button
                variant="outline"
                onClick={() => {
                  stopVideo();
                  onCancel();
                }}
                className="flex-1"
                disabled={isCapturing}
              >
                Batal
              </Button>
            )}
            <Button
              onClick={mulaiHitungMundur}
              disabled={!isReady || isCapturing || !!error}
              className="flex-1 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {isCapturing ? 'Bersiap…' : 'Ambil Foto'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
