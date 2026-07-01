import React from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ShieldCheck, AlertCircle, User, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const FaceScanner = dynamic(() => import('../workspace/FaceScanner').then(mod => mod.FaceScanner), { ssr: false });

interface LivenessKycTabProps {
  isTalent: boolean;
  talentProfile?: any;
  companyProfile?: any;
  verificationError: string | null;
  showLivenessCam: boolean;
  setShowLivenessCam: (val: boolean) => void;
  showTestFaceCam: boolean;
  setShowTestFaceCam: (val: boolean) => void;
  handleFaceCaptureComplete: (descriptor: number[], imageDataUrl?: string) => Promise<void>;
  handleFaceTestComplete: (descriptor: number[]) => Promise<void>;
  handleKybSubmit: (e: React.FormEvent) => Promise<void>;
  kybEntityName: string;
  setKybEntityName: (val: string) => void;
  kybNumber: string;
  setKybNumber: (val: string) => void;
  kybDocUrl: string;
  setKybDocUrl: (val: string) => void;
  isVerifyingKyb: boolean;
}

export const LivenessKycTab = ({
  isTalent,
  talentProfile,
  companyProfile,
  verificationError,
  showLivenessCam,
  setShowLivenessCam,
  showTestFaceCam,
  setShowTestFaceCam,
  handleFaceCaptureComplete,
  handleFaceTestComplete,
  handleKybSubmit,
  kybEntityName,
  setKybEntityName,
  kybNumber,
  setKybNumber,
  kybDocUrl,
  setKybDocUrl,
  isVerifyingKyb,
}: LivenessKycTabProps) => {
  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-8 shadow-xl space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4" /> Keamanan & Validasi
      </div>
      <h3 className="font-display text-xl font-bold text-white">Status Verifikasi Identitas</h3>

      {isTalent ? (
        <div className="space-y-6">
          {verificationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-400 shadow-lg text-xs leading-relaxed">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5 text-red-300">Verifikasi Ditolak:</span>
                {verificationError}
              </div>
            </div>
          )}
          <div className="bg-dark-bg border border-dark-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">AI Liveness Check</h4>
              <p className="text-xs text-gray-400">Verifikasi wajah mandiri (Tanpa KTP)</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              talentProfile?.faceVerificationStatus === 'VERIFIED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {talentProfile?.faceVerificationStatus || 'UNVERIFIED'}
            </span>
          </div>

          {talentProfile?.faceVerificationStatus !== 'VERIFIED' && !showLivenessCam && (
            <Button onClick={() => setShowLivenessCam(true)} className="w-full shadow-xl">
              Mulai Verifikasi Wajah AI
            </Button>
          )}

          {talentProfile?.faceVerificationStatus === 'VERIFIED' && (
            <div className="space-y-4 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
                <div className="relative h-16 w-16 rounded-xl bg-black overflow-hidden border border-emerald-500/50 flex-shrink-0 shadow-md">
                  {talentProfile.avatarUrl ? (
                    <Image src={talentProfile.avatarUrl} alt="Verified Biometric" fill sizes="64px" className="object-cover transform scale-x-[-1]" />
                  ) : (
                    <User className="relative z-10 h-8 w-8 text-emerald-400 mx-auto my-4" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold inline-block">Wajah Terdaftar (Lokal)</span>
                  <p className="text-xs text-gray-300 leading-relaxed">Topologi wajah Anda telah direkam sebagai descriptor numerik. Ini akan digunakan secara otomatis sebelum mengumpulkan studi kasus.</p>
                </div>
              </div>

              {!showLivenessCam && !showTestFaceCam && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setShowTestFaceCam(true)} className="w-full text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Cek Deteksi Wajah (Test)
                  </Button>
                  <Button variant="outline" onClick={() => setShowLivenessCam(true)} className="w-full text-xs">
                    <RefreshCw className="h-4 w-4 mr-2" /> Ambil Ulang Foto (Retake)
                  </Button>
                </div>
              )}
              
              {(showLivenessCam || showTestFaceCam) && (
                <Button variant="ghost" onClick={() => { setShowLivenessCam(false); setShowTestFaceCam(false); }} className="w-full text-xs text-red-400 border border-red-500/20 bg-red-500/10">
                  Batal Kamera
                </Button>
              )}
            </div>
          )}

          {showTestFaceCam && (
            <div className="pt-4 border-t border-dark-border space-y-6">
              <FaceScanner 
                onCaptureComplete={handleFaceTestComplete} 
                onCancel={() => setShowTestFaceCam(false)}
                title="Tes Kecocokan Wajah"
                description="Arahkan wajah Anda ke kamera. Sistem akan mencocokkannya dengan data biometrik Anda yang sudah terdaftar."
              />
            </div>
          )}

          {showLivenessCam && (
            <div className="pt-4 border-t border-dark-border space-y-6">
              <FaceScanner 
                onCaptureComplete={handleFaceCaptureComplete} 
                onCancel={() => setShowLivenessCam(false)}
                title="Pendaftaran Wajah Baru"
                description="Arahkan wajah Anda ke kamera untuk direkam sebagai verifikator saat pengumpulan tugas."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-dark-bg border border-dark-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Legalitas Bisnis (KYB)</h4>
              <p className="text-xs text-gray-400">Verifikasi NIB / NPWP Perusahaan</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              companyProfile?.kybStatus === 'VERIFIED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : companyProfile?.kybStatus === 'PENDING'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {companyProfile?.kybStatus || 'UNVERIFIED'}
            </span>
          </div>

          {companyProfile?.kybStatus !== 'VERIFIED' && companyProfile?.kybStatus !== 'PENDING' && (
            <form onSubmit={handleKybSubmit} className="space-y-4 pt-4 border-t border-dark-border">
              <Input
                label="Nama Entitas Hukum Resmi"
                type="text"
                placeholder="PT Teknologi Tolongin Indonesia"
                value={kybEntityName}
                onChange={(e) => setKybEntityName(e.target.value)}
              />
              <Input
                label="Nomor Induk Berusaha (NIB) / NPWP"
                type="text"
                placeholder="1234567890123"
                value={kybNumber}
                onChange={(e) => setKybNumber(e.target.value)}
              />
              <Input
                label="Tautan Dokumen Legalitas (PDF/Image)"
                type="url"
                placeholder="https://storage.tolongin.co/docs/nib.pdf"
                value={kybDocUrl}
                onChange={(e) => setKybDocUrl(e.target.value)}
              />
              <Button type="submit" isLoading={isVerifyingKyb} className="w-full shadow-xl">
                Kirim Dokumen KYB
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
