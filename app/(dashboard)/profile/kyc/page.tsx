'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/common/Button';
import { verificationService } from '../../../../services/verification.service';
import { Camera, UploadCloud, CheckCircle2, AlertCircle, ScanFace, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

type KycStep = 'KTP' | 'LIVENESS' | 'SUCCESS';

export default function KycVerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<KycStep>('KTP');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for KTP
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [ktpFileError, setKtpFileError] = useState<string | null>(null);

  // State for Liveness
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfieImg, setSelfieImg] = useState<string | null>(null);
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

  useEffect(() => {
    if (step === 'LIVENESS' && !selfieImg) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, selfieImg]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Gagal mengakses kamera. Harap izinkan akses kamera di browser Anda.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureSelfieAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !ktpPreview) return;
    
    // Simulate active liveness check UI
    setLivenessInstruction('Tahan posisi Anda... memindai biometrik');
    setIsProcessing(true);
    
    setTimeout(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const context = canvas.getContext('2d');
      if (context) {
        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageSrc = canvas.toDataURL('image/jpeg');
        setSelfieImg(imageSrc);
        stopCamera();
        
        setLivenessInstruction('Memverifikasi kecocokan wajah...');

      try {
        const result = await verificationService.verifyFace({
          idCardPhotoUrl: ktpPreview,
          selfiePhotoUrl: imageSrc
        });

        setVerificationResult(result);
        
        if (result.isMatch && result.isKtpValid) {
          toast.success('Identitas berhasil diverifikasi!');
          setStep('SUCCESS');
        } else {
          toast.error(result.reason || 'Verifikasi gagal. Silakan coba lagi.');
          setSelfieImg(null); // Reset to retry
          setLivenessInstruction('Silakan coba posisikan wajah Anda kembali');
        }
      } catch (err: any) {
        toast.error(err.message || 'Terjadi kesalahan sistem');
        setSelfieImg(null);
        setLivenessInstruction('Terjadi kesalahan jaringan, silakan coba lagi');
      } finally {
        setIsProcessing(false);
      }
      }
    }); // UI delay for "scanning" effect
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
                <label className="border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
                  <UploadCloud className="h-12 w-12 text-muted-foreground group-hover:text-emerald-500 mb-4 transition-colors" />
                  <p className="text-sm font-medium text-foreground text-center">Klik untuk mengunggah foto KTP</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Maksimal 5MB (JPG, PNG)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleKtpUpload} />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black/5 flex items-center justify-center min-h-[250px]">
                    <img src={ktpPreview} alt="Preview KTP" className="max-h-[300px] object-contain relative z-10" />
                    
                    {/* GUIDELINE OVERLAY */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                       <div className="w-[85%] h-[70%] border-2 border-emerald-500/70 border-dashed rounded-lg bg-emerald-500/10 backdrop-blur-[1px]"></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setKtpPreview(null)}>Unggah Ulang</Button>
                    <Button onClick={() => setStep('LIVENESS')}>
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
               <div className="text-center space-y-1">
                 <h3 className="text-lg font-bold text-foreground">Pemindaian Wajah Anti-Spoofing</h3>
                 <p className="text-sm text-muted-foreground">{livenessInstruction}</p>
               </div>

               <div className="relative mx-auto w-[320px] h-[320px] rounded-full overflow-hidden border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] bg-black">
                 {selfieImg ? (
                   <img src={selfieImg} alt="Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
                 ) : (
                   <video
                     ref={videoRef}
                     autoPlay
                     playsInline
                     muted
                     className="w-full h-full object-cover transform scale-x-[-1]"
                   />
                 )}
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {/* MASKING OVAL */}
                 <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <div className="w-[60%] h-[75%] border-[3px] border-white/50 rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                 </div>

                 {/* SCANNING LINE ANIMATION */}
                 {isProcessing && (
                   <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-400 shadow-[0_0_15px_#34d399] z-20 animate-[scan_2s_ease-in-out_infinite]" />
                 )}
               </div>

               <div className="flex justify-center pt-4">
                 <Button 
                   size="lg" 
                   onClick={captureSelfieAndVerify} 
                   isLoading={isProcessing}
                   disabled={isProcessing || selfieImg !== null}
                   className="w-[200px]"
                 >
                   {isProcessing ? 'Memindai...' : 'Ambil Pemindaian'}
                 </Button>
               </div>
               
               <style dangerouslySetInnerHTML={{__html: `
                 @keyframes scan {
                   0% { top: 0%; opacity: 0; }
                   10% { opacity: 1; }
                   90% { opacity: 1; }
                   100% { top: 100%; opacity: 0; }
                 }
               `}} />
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-6 py-8 animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-display text-foreground">Identitas Terverifikasi!</h3>
                <p className="text-muted-foreground">KTP dan wajah Anda telah lolos uji biometrik Tolongin. Lencana *Verified* telah ditambahkan ke profil Anda.</p>
              </div>

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
