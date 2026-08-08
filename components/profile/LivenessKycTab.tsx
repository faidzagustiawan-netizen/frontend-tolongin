import React from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import Link from 'next/link';

const FaceScanner = dynamic(() => import('../workspace/FaceScanner').then(mod => mod.FaceScanner), { ssr: false });

type StatusKyc = 'VERIFIED' | 'PENDING' | 'FAILED' | 'UNVERIFIED';

/**
 * Status mentah dari basis data tidak layak ditampilkan apa adanya. "PENDING"
 * saja tidak memberi tahu pengguna apakah dia ditolak, sedang diproses mesin,
 * atau menunggu manusia — dan ketiganya menuntut tindakan berbeda.
 */
const STATUS_KYC: Record<StatusKyc, { label: string; ringkas: string; warna: string }> = {
  VERIFIED: {
    label: 'TERVERIFIKASI',
    ringkas: 'Identitas Anda sudah terverifikasi penuh',
    warna: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  PENDING: {
    label: 'MENUNGGU TINJAUAN',
    ringkas: 'Sedang diperiksa petugas kami',
    warna: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  FAILED: {
    label: 'BELUM BERHASIL',
    ringkas: 'Verifikasi terakhir tidak lolos',
    warna: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  UNVERIFIED: {
    label: 'BELUM DIVERIFIKASI',
    ringkas: 'Verifikasi KTP & wajah belum dilakukan',
    warna: 'bg-muted-foreground/10 border-border text-muted-foreground',
  },
};

interface LivenessKycTabProps {
  isTalent: boolean;
  /**
   * Hanya pemilik akun perusahaan yang boleh mengirim legalitas usahanya.
   * Backend menolak akun undangan lewat `CompanyOwnerGuard`; nilai ini menahan
   * formulirnya agar penolakan itu tidak muncul sebagai galat mendadak.
   */
  isCompanyOwner?: boolean;
  talentProfile?: any;
  companyProfile?: any;
  verificationError: string | null;
  showLivenessCam: boolean;
  setShowLivenessCam: (val: boolean) => void;
  showTestFaceCam: boolean;
  setShowTestFaceCam: (val: boolean) => void;
  handleFaceCaptureComplete: (descriptor: number[], imageDataUrl?: string) => Promise<void>;
  handleFaceTestComplete: (descriptor: number[], imageDataUrl?: string) => Promise<void>;
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
  isCompanyOwner = false,
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
  const statusKyc: StatusKyc =
    (talentProfile?.faceVerificationStatus as StatusKyc) in STATUS_KYC
      ? (talentProfile.faceVerificationStatus as StatusKyc)
      : 'UNVERIFIED';

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
      <h3 className="font-display text-xl font-bold text-foreground">Status Verifikasi Identitas</h3>

      {isTalent ? (
        <div className="space-y-6">
          {/* Judulnya dulu selalu "Verifikasi Ditolak:", termasuk untuk galat
              jaringan — gangguan koneksi terbaca oleh pengguna sebagai
              identitasnya yang ditolak. Putusan penolakan hanya sah bila server
              memang mencatat statusnya FAILED; selain itu ini masalah teknis. */}
          {verificationError && (
            <div
              className={`rounded-2xl p-4 flex items-start gap-3 shadow-lg text-xs leading-relaxed border ${
                statusKyc === 'FAILED'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <span
                  className={`font-bold block mb-0.5 ${
                    statusKyc === 'FAILED' ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  {statusKyc === 'FAILED'
                    ? 'Verifikasi Ditolak:'
                    : 'Pemeriksaan Gagal Dijalankan:'}
                </span>
                {verificationError}
                {statusKyc !== 'FAILED' && (
                  <span className="block mt-1 text-muted-foreground">
                    Status identitas Anda tidak berubah. Coba lagi sebentar lagi.
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="bg-background border border-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Verifikasi KTP &amp; Wajah</h4>
              <p className="text-xs text-muted-foreground">{STATUS_KYC[statusKyc].ringkas}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_KYC[statusKyc].warna}`}>
              {STATUS_KYC[statusKyc].label}
            </span>
          </div>

          {/* Status PENDING paling mudah disalahpahami sebagai penolakan, jadi
              dijelaskan panjang: apa yang terjadi, kenapa, dan apa yang bisa
              dilakukan pengguna. */}
          {statusKyc === 'PENDING' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-300">
                    Menunggu peninjauan tim kami
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dokumen dan selfie Anda sudah kami terima. Tingkat kemiripannya berada di
                    rentang yang tidak bisa diputuskan mesin sendiri, jadi seorang petugas akan
                    memeriksanya langsung. <b className="text-foreground">Ini bukan penolakan</b> —
                    kami sengaja tidak meloloskan kasus yang meragukan secara otomatis.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      Anda akan menerima notifikasi begitu keputusannya keluar.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      Selama menunggu, Anda belum bisa mengumpulkan hasil ujian yang memerlukan
                      verifikasi wajah.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      Bila foto Anda kurang terang atau wajah tertutup sebagian, mengulang
                      verifikasi dengan foto yang lebih baik biasanya langsung lolos.
                    </li>
                  </ul>
                </div>
              </div>
              <Link href="/settings/kyc" className="block">
                <Button variant="outline" className="w-full text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                  <RefreshCw className="h-4 w-4 mr-2" /> Ulangi dengan Foto Lebih Baik
                </Button>
              </Link>
            </div>
          )}

          {statusKyc === 'FAILED' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-red-300">Verifikasi belum berhasil</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Wajah pada selfie tidak cocok dengan foto di KTP yang Anda unggah, atau
                    identitas itu sudah terdaftar pada akun lain. Anda dapat mencoba lagi dengan
                    KTP asli milik Anda sendiri dan pencahayaan yang cukup. Bila Anda yakin ini
                    keliru, hubungi dukungan agar ditinjau petugas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Saat PENDING tombol ini disembunyikan: blok penjelasan di atas
              sudah memuat ajakan yang lebih tepat sasaran, dan dua tombol
              dengan maksud sama hanya membingungkan. */}
          {!showLivenessCam && statusKyc !== 'PENDING' && (
            <Link href="/settings/kyc" className="block w-full">
              <Button className="w-full shadow-xl" variant={statusKyc === 'VERIFIED' ? 'outline' : 'primary'}>
                {statusKyc === 'VERIFIED'
                  ? 'Perbarui Verifikasi KTP & Wajah'
                  : statusKyc === 'FAILED'
                    ? 'Coba Verifikasi Ulang'
                    : 'Mulai Verifikasi Identitas (KYC & Liveness)'}
              </Button>
            </Link>
          )}

          {talentProfile?.faceVerificationStatus === 'VERIFIED' && (
            <div className="space-y-4 pt-2">
              <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
                <div className="relative h-16 w-16 shrink-0 rounded-xl bg-black overflow-hidden border border-emerald-500/50 flex flex-col items-center justify-center shadow-md">
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold inline-block">Foto Identitas Privat (Terenkripsi AES-256)</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">Ini adalah wajah biometrik asli Anda yang diambil saat pencocokan KTP. Data ini bersifat **Sangat Rahasia**, diamankan dengan enkripsi level perbankan, dan **hanya** digunakan oleh mesin untuk ujian (Liveness). Foto profil Publik Anda dapat diatur terpisah di tab Profil.</p>
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
                <Button variant="ghost" onClick={() => { setShowLivenessCam(false); setShowTestFaceCam(false); }} className="w-full text-xs text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20">
                  Batal Kamera
                </Button>
              )}
            </div>
          )}

          {showTestFaceCam && (
            <div className="pt-4 border-t border-border space-y-6">
              <FaceScanner 
                onCaptureComplete={handleFaceTestComplete} 
                onCancel={() => setShowTestFaceCam(false)}
                title="Tes Kecocokan Wajah"
                description="Arahkan wajah Anda ke kamera. Sistem akan mencocokkannya dengan data biometrik Anda yang sudah terdaftar."
              />
            </div>
          )}

          {showLivenessCam && (
            <div className="pt-4 border-t border-border space-y-6">
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
          <div className="bg-background border border-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Legalitas Bisnis (KYB)</h4>
              <p className="text-xs text-muted-foreground">Verifikasi NIB / NPWP Perusahaan</p>
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

          {!isCompanyOwner && (
            <p className="text-xs text-muted-foreground leading-relaxed pt-4 border-t border-border">
              Dokumen legalitas dikirim oleh pemilik akun perusahaan. Hubungi
              pemilik akun bila statusnya perlu diperbarui.
            </p>
          )}

          {isCompanyOwner &&
            companyProfile?.kybStatus !== 'VERIFIED' &&
            companyProfile?.kybStatus !== 'PENDING' && (
            <form onSubmit={handleKybSubmit} className="space-y-4 pt-4 border-t border-border">
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
