'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/common/Button';
import { verificationService } from '../../../../services/verification.service';
import { Camera, UploadCloud, CheckCircle2, AlertCircle, ScanFace, ArrowRight, ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';

const FaceScanner = dynamic(() => import('../../../../components/workspace/FaceScanner').then(mod => mod.FaceScanner), { ssr: false });

type KycStep = 'KTP' | 'LIVENESS' | 'SUCCESS';

export default function KycVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<KycStep>('KTP');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for KTP
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [ktpFileError, setKtpFileError] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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

  const handleKtpContinue = async () => {
    if (ktpPreview && croppedAreaPixels) {
      setIsProcessing(true);
      try {
        const croppedImage = await getCroppedImg(ktpPreview, croppedAreaPixels);
        setKtpPreview(croppedImage); // Save the cropped image
        setStep('LIVENESS');
      } catch (e) {
        toast.error('Gagal memotong gambar');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setStep('LIVENESS');
    }
  };

  // State for Liveness
  const [livenessInstruction, setLivenessInstruction] = useState('Posisikan wajah Anda tepat di dalam bingkai oval');
  
  // Results
  const [verificationResult, setVerificationResult] = useState<any>(null);

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
            2. Cek Liveness Cam
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
                <p className="text-sm leading-relaxed">
                  Harap unggah foto KTP asli Republik Indonesia Anda. Pastikan tulisan terbaca jelas, tidak terpotong, dan tidak terkena pantulan cahaya berlebih (glare).
                </p>
              </div>

              {!ktpPreview ? (
                <label 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleKtpDrop}
                  className="border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
                  <UploadCloud className="h-12 w-12 text-muted-foreground group-hover:text-emerald-500 mb-4 transition-colors" />
                  <p className="text-sm font-medium text-foreground text-center">Klik atau tarik file untuk mengunggah foto KTP</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Maksimal 5MB (JPG, PNG)</p>
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-center">
                 <div className="w-full max-w-md">
                   <FaceScanner 
                     title="Pemindaian Wajah Anti-Spoofing" 
                     description={livenessInstruction} 
                     onCaptureComplete={(descriptor, imageDataUrl) => {
                       if (imageDataUrl) {
                         captureSelfieAndVerify(imageDataUrl);
                       }
                     }} 
                   />
                 </div>
               </div>
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
                    <h3 className="text-2xl font-bold font-display text-foreground">Sedang Diproses (AI Latar Belakang)</h3>
                    <p className="text-muted-foreground">KTP dan foto wajah Anda sedang diverifikasi oleh AI DeepFace secara ketat. Hal ini memakan waktu beberapa saat.<br/>Anda bebas menutup halaman ini, kami akan mengirimkan notifikasi saat selesai.</p>
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

              <div className="pt-6">
                <Button onClick={() => router.push('/profile')} size="lg">
                  Kembali ke Profil
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
