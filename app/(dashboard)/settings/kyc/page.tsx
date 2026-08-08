'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { verificationService } from '@/services/verification.service';
import { Camera, UploadCloud, CheckCircle2, AlertCircle, ScanFace, ArrowRight, ArrowLeft, ZoomIn, ZoomOut, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';

const FaceScanner = dynamic(() => import('@/components/workspace/FaceScanner').then(mod => mod.FaceScanner), { ssr: false });
import { motion, AnimatePresence } from 'framer-motion';

type KycStep = 'KTP' | 'LIVENESS' | 'SUCCESS';

export default function KycVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loadUserFromStorage } = useUserStore();

  const [step, setStep] = useState<KycStep>('KTP');
  const [isProcessing, setIsProcessing] = useState(false);
  const [livenessInstruction, setLivenessInstruction] = useState('Posisikan wajah Anda tepat di dalam bingkai oval');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const [isReverifying, setIsReverifying] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(true);

  // Polling KYC verification status every 3 seconds if PENDING or on Step 3
  const { data: kycStatusData } = useQuery({
    queryKey: ['kyc-status', user?.id],
    queryFn: () => verificationService.getStatus(),
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'PENDING' || step === 'SUCCESS' || verificationResult?.status === 'PROCESSING') {
        return 3000;
      }
      return false;
    },
  });

  // Sync initial state from server KYC status
  useEffect(() => {
    if (!isReverifying && kycStatusData?.status) {
      if (kycStatusData.status === 'VERIFIED') {
        setStep('SUCCESS');
        setVerificationResult((prev: any) =>
          prev?.status === 'VERIFIED' ? prev : { status: 'VERIFIED', isMatch: true, isKtpValid: true }
        );
      } else if (kycStatusData.status === 'PENDING' && step !== 'LIVENESS') {
        setStep('SUCCESS');
        setVerificationResult((prev: any) =>
          prev?.status === 'PROCESSING' ? prev : { status: 'PROCESSING', message: 'Verifikasi Anda sedang diproses.' }
        );
      }
    }
  }, [kycStatusData?.status, isReverifying, step]);

  const handleRestartVerification = () => {
    setIsReverifying(true);
    setKtpPreview(null);
    setKtpFileError(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setVerificationResult(null);
    setStep('KTP');
  };

  // Real-time update listener when verification status changes to VERIFIED or REJECTED
  useEffect(() => {
    if (step === 'SUCCESS' && kycStatusData?.status) {
      if (kycStatusData.status === 'VERIFIED' && verificationResult?.status !== 'VERIFIED') {
        setVerificationResult({
          status: 'VERIFIED',
          isMatch: true,
          isKtpValid: true,
        });
        toast.success('Identitas Anda telah berhasil terverifikasi 100%!');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        loadUserFromStorage();
      } else if (kycStatusData.status === 'FAILED' && verificationResult?.status !== 'REJECTED') {
        setVerificationResult({
          status: 'REJECTED',
          isMatch: false,
          reason: 'Verifikasi ditolak. Foto wajah tidak cocok dengan dokumen KTP.',
        });
        toast.error('Verifikasi identitas ditolak. Silakan coba lagi.');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    }
  }, [kycStatusData, step, verificationResult, queryClient, loadUserFromStorage]);

  // State for KTP
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [ktpFileError, setKtpFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // `setCroppedAreaPixels` harus disebut walau setter useState stabil: React
  // Compiler menyimpulkan dependensinya sendiri, dan ketika hasilnya tidak
  // cocok dengan yang ditulis tangan ia MELEWATI optimasi seluruh komponen —
  // dilaporkan sebagai error lint, bukan peringatan.
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, [setCroppedAreaPixels]);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  // Di bawah lebar ini, tulisan pada KTP tidak terbaca OCR dan wajah pada
  // kartu terlalu kecil untuk dicocokkan. Menahannya di sini jauh lebih baik
  // daripada membiarkan verifikasi gagal beberapa menit kemudian dengan alasan
  // yang terdengar seperti menyalahkan penggunanya.
  const LEBAR_KTP_MINIMUM = 600;

  const handleKtpContinue = async () => {
    if (!ktpPreview || !croppedAreaPixels) {
      toast.error('Atur dulu posisi KTP di dalam bingkai hijau.');
      return;
    }

    if (croppedAreaPixels.width < LEBAR_KTP_MINIMUM) {
      setKtpFileError(
        `Hasil potongan hanya ${Math.round(croppedAreaPixels.width)} piksel — terlalu kecil untuk dibaca. ` +
          'Kurangi zoom, atau unggah foto KTP dengan resolusi lebih tinggi.',
      );
      return;
    }

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(ktpPreview, croppedAreaPixels);
      setKtpPreview(croppedImage);
      setKtpFileError(null);
      setStep('LIVENESS');
      setIsCameraModalOpen(true);
    } catch (_e) {
      toast.error('Gagal memotong gambar');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleKtpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setKtpFileError('Ukuran gambar maksimal 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setKtpFileError('Format file harus berupa gambar (JPG/PNG)');
      return;
    }

    setKtpFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setKtpPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKtpDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setKtpFileError('Ukuran gambar maksimal 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setKtpFileError('Format file harus berupa gambar (JPG/PNG)');
      return;
    }

    setKtpFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setKtpPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };



  const captureSelfieAndVerify = useCallback(async (imageSrc: string) => {
    setIsProcessing(true);
    setLivenessInstruction('Memverifikasi kecocokan wajah...');

    try {
      const result = await verificationService.verifyFace({
        idCardPhotoUrl: ktpPreview!,
        selfiePhotoUrl: imageSrc
      });

      setVerificationResult(result);
      
      if (result.status === 'PROCESSING') {
        toast(result.message || 'Verifikasi AI sedang berjalan di latar belakang. Anda akan mendapat notifikasi saat selesai.', { icon: 'ℹ️' });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setStep('SUCCESS'); // Atau Anda bisa membuat step khusus 'PROCESSING' jika ada
      } else if (result.isMatch && result.isKtpValid) {
        toast.success('Identitas berhasil diverifikasi!');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setStep('SUCCESS');
      } else {
        toast.error(result.reason || 'Verifikasi gagal. Silakan coba lagi.');
        setLivenessInstruction('Silakan coba posisikan wajah Anda kembali');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
      setLivenessInstruction('Terjadi kesalahan jaringan, silakan coba lagi');
    } finally {
      setIsProcessing(false);
    }
  }, [ktpPreview]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <ScanFace className="h-6 w-6 text-emerald-500" />
            Verifikasi Identitas (KYC)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tolongin menggunakan standar keamanan biometrik ketat untuk membasmi joki dan menjaga kualitas ekosistem.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* PROGRESS BAR */}
        <div className="flex border-b border-border bg-foreground/5">
          <div className={`flex-1 p-4 text-center text-sm font-semibold border-r border-border transition-colors ${step === 'KTP' ? 'bg-emerald-500/10 text-emerald-500 border-b-2 border-b-emerald-500' : 'text-muted-foreground'}`}>
            1. Unggah KTP
          </div>
          <div className={`flex-1 p-4 text-center text-sm font-semibold border-r border-border transition-colors ${step === 'LIVENESS' ? 'bg-emerald-500/10 text-emerald-500 border-b-2 border-b-emerald-500' : 'text-muted-foreground'}`}>
            2. Foto Wajah
          </div>
          <div className={`flex-1 p-4 text-center text-sm font-semibold transition-colors ${step === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-b-2 border-b-emerald-500' : 'text-muted-foreground'}`}>
            3. Selesai
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1: KTP */}
          {step === 'KTP' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-blue-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    Unggah foto KTP asli Republik Indonesia milik Anda sendiri. Sistem membaca
                    tulisan pada kartu sekaligus membandingkan foto di kartu dengan wajah Anda.
                  </p>
                  <ul className="text-xs space-y-1 text-blue-400/80">
                    <li>• Seluruh kartu masuk, tidak ada sudut yang terpotong</li>
                    <li>• Difoto tegak lurus, bukan miring</li>
                    <li>• Tanpa pantulan cahaya di atas foto atau tulisan</li>
                    <li>• Gunakan kartu fisik, bukan fotokopi atau foto dari layar</li>
                  </ul>
                </div>
              </div>

              <div className="bg-foreground/5 border border-border rounded-lg p-3 flex gap-2.5 text-xs text-muted-foreground leading-relaxed">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <p>
                  Foto KTP Anda disimpan dalam keadaan terenkripsi dan tidak pernah tampil di
                  profil publik. Hanya mesin pencocokan dan petugas verifikasi yang dapat
                  mengaksesnya.
                </p>
              </div>

              {!ktpPreview ? (
                <label 
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    handleKtpDrop(e);
                  }}
                  className={`border-2 border-dashed transition-all duration-300 rounded-3xl p-10 md:p-14 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden text-center ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-500/15 scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20' 
                      : 'border-border hover:border-emerald-500/60 hover:bg-emerald-500/5 hover:shadow-xl'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    isDragging 
                      ? 'bg-emerald-500/30 text-emerald-400 scale-110 animate-bounce' 
                      : 'bg-emerald-500/10 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20'
                  }`}>
                    <UploadCloud className={`h-10 w-10 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`} />
                  </div>

                  <p className="text-base font-bold text-foreground transition-colors group-hover:text-emerald-400">
                    {isDragging ? 'Lepaskan Foto KTP di Sini...' : 'Klik atau tarik file untuk mengunggah foto KTP'}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                    <span>Maksimal 5MB (JPG, PNG)</span>
                  </p>

                  <div className="mt-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Pilih Dari Perangkat
                  </div>

                  <input type="file" accept="image/*" className="hidden" onChange={handleKtpUpload} />
                </label>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mb-4 text-center">
                    <p className="text-emerald-400 text-sm font-medium">
                      Gunakan jari atau kursor Anda untuk <b>menggeser</b> gambar, dan gunakan slider di bawah untuk <b>memperbesar (zoom)</b> KTP agar pas di dalam bingkai hijau.
                    </p>
                  </div>
                  
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black/5 min-h-[350px]">
                    <Cropper
                      image={ktpPreview}
                      crop={crop}
                      zoom={zoom}
                      aspect={85.6 / 53.98} // Standard ID card ratio
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{
                        containerStyle: { borderRadius: '1rem' },
                        cropAreaStyle: { border: '2px dashed rgba(16, 185, 129, 0.8)', background: 'rgba(16, 185, 129, 0.05)' }
                      }}
                    />
                    
                    {/* Placeholder Siluet KTP */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-40">
                      <div className="relative" style={{ width: '100%', maxWidth: '400px', aspectRatio: '85.6 / 53.98' }}>
                         {/* Bayangan Foto KTP (Kiri) */}
                         <div className="absolute left-[8%] top-[25%] w-[22%] h-[50%] border-2 border-dashed border-emerald-400 rounded-md bg-emerald-500/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-emerald-400/50" />
                         </div>
                         {/* Bayangan Teks (Kanan) */}
                         <div className="absolute right-[8%] top-[25%] w-[55%] h-[50%] space-y-2">
                            <div className="w-full h-2 bg-emerald-400/20 rounded-full"></div>
                            <div className="w-[80%] h-2 bg-emerald-400/20 rounded-full"></div>
                            <div className="w-[90%] h-2 bg-emerald-400/20 rounded-full"></div>
                            <div className="w-[60%] h-2 bg-emerald-400/20 rounded-full"></div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-background border border-border p-3 rounded-xl shadow-sm">
                    <ZoomOut className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => {
                        setZoom(Number(e.target.value))
                      }}
                      className="w-full accent-emerald-500"
                    />
                    <ZoomIn className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={() => { setKtpPreview(null); setZoom(1); }}>Unggah Ulang</Button>
                    <Button onClick={handleKtpContinue} isLoading={isProcessing}>
                      Lanjutkan ke Kamera
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {ktpFileError && <p className="text-red-400 text-sm mt-2 text-center font-medium">{ktpFileError}</p>}
            </div>
          )}

          {/* STEP 2: LIVENESS */}
          {step === 'LIVENESS' && (
            <div className="space-y-6 text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card border border-border rounded-3xl p-8 max-w-md mx-auto space-y-4 shadow-xl">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                  <ScanFace className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-display text-foreground">Pemindaian Wajah Biometrik</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    KTP Anda telah terpotong. Posisikan wajah Anda tepat di dalam bingkai oval pada pop-up pemindaian wajah.
                  </p>
                </div>
                <Button
                  onClick={() => setIsCameraModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Buka Pop-Up Pemindaian Wajah
                </Button>
              </div>

              <AnimatePresence>
                {isCameraModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-left"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 10 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="max-w-lg w-full relative"
                    >
                      <FaceScanner 
                        title="Pemindaian Wajah Anti-Spoofing" 
                        description={livenessInstruction}
                        onCancel={() => setIsCameraModalOpen(false)}
                        onCaptureComplete={(descriptor, imageDataUrl) => {
                          if (imageDataUrl) {
                            setIsCameraModalOpen(false);
                            captureSelfieAndVerify(imageDataUrl);
                          }
                        }} 
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* STEP 3: SUCCESS OR PROCESSING */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-6 py-8 animate-in zoom-in-95 duration-500">
              {verificationResult?.status === 'PROCESSING' ? (
                <>
                  <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-foreground">Sedang Diperiksa</h3>
                    <p className="text-muted-foreground">
                      KTP dan foto wajah Anda sedang dicocokkan. Prosesnya memakan waktu
                      beberapa saat, dan Anda bebas menutup halaman ini — notifikasi akan
                      dikirim begitu selesai.
                    </p>
                  </div>

                  {/* Pemeriksaan ini punya tiga kemungkinan akhir, bukan dua.
                      Menjanjikan "terverifikasi" di sini membuat hasil PENDING
                      terasa seperti kegagalan yang tidak dijelaskan. */}
                  <div className="bg-foreground/5 border border-border rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                    <p className="text-xs font-bold text-foreground">Tiga kemungkinan hasilnya:</p>
                    <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                      <p className="flex gap-2.5">
                        <span className="text-emerald-400 font-bold shrink-0">Cocok</span>
                        Akun langsung terverifikasi dan lencana muncul di profil Anda.
                      </p>
                      <p className="flex gap-2.5">
                        <span className="text-amber-400 font-bold shrink-0">Ragu</span>
                        Petugas kami memeriksanya secara manual. Ini bukan penolakan — kami
                        sengaja tidak meloloskan kasus meragukan secara otomatis.
                      </p>
                      <p className="flex gap-2.5">
                        <span className="text-red-400 font-bold shrink-0">Tidak</span>
                        Wajah tidak cocok dengan KTP, atau identitasnya sudah dipakai akun lain.
                        Anda bisa mencoba lagi.
                      </p>
                    </div>
                  </div>
                </>
              ) : verificationResult?.status === 'REJECTED' ? (
                /* Cabang ini dulu tidak ada: penolakan jatuh ke blok "Terverifikasi"
                   di bawah dan tampil hijau. Layar yang mengabarkan keberhasilan
                   atas pemeriksaan yang gagal lebih buruk daripada layar galat. */
                <>
                  <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-foreground">Verifikasi Ditolak</h3>
                    <p className="text-muted-foreground">
                      {verificationResult.reason ||
                        'Foto wajah tidak cocok dengan dokumen KTP.'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Anda bisa mengulang dengan foto KTP yang lebih tajam dan pencahayaan wajah yang merata.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-foreground">Identitas Terverifikasi!</h3>
                    <p className="text-muted-foreground">KTP dan wajah Anda telah lolos uji biometrik Tolongin. Lencana *Verified* telah ditambahkan ke profil Anda.</p>
                  </div>
                </>
              )}

              {verificationResult?.ktpName && (
                <div className="bg-foreground/5 rounded-xl p-4 inline-block text-left min-w-[250px] border border-border mt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Nama Terdeteksi</p>
                      <p className="text-sm font-medium text-foreground">{verificationResult.ktpName}</p>
                    </div>
                    {verificationResult.ktpNik && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">NIK / ID</p>
                        <p className="text-sm font-medium text-foreground">•••• •••• •••• {verificationResult.ktpNik.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="outline" onClick={() => router.push('/settings')} size="lg">
                  Kembali ke Profil
                </Button>
                <Button 
                  onClick={handleRestartVerification} 
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Ulangi / Perbarui Verifikasi KTP & Wajah
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


