'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminApi, apiErrorMessage } from '@/services/adminApi';
import {
  Building2,
  ShieldCheck,
  ShieldX,
  Inbox,
  Clock,
  ExternalLink,
} from 'lucide-react';

/**
 * Nama kolomnya mengikuti CompanyProfile di Prisma.
 *
 * Sebelumnya antarmuka ini menyebut `employeeCount`, `website`, `nibNumber`,
 * `npwpNumber`, `nibDocumentUrl`, dan `npwpDocumentUrl` — enam nama yang tidak
 * satu pun ada di basis data. Kartu tinjauan karena itu selalu menampilkan
 * "—" dan "Tidak dilampirkan", dan admin menyetujui perusahaan tanpa pernah
 * melihat dokumen apa pun.
 */
interface CompanyProfile {
  id: string;
  companyName: string;
  industry: string;
  companySize: string | null;
  location: string | null;
  websiteUrl: string | null;
  description: string | null;
  legalEntityName: string | null;
  businessRegistrationNumber: string | null;
  legalDocumentUrl: string | null;
  kybSubmittedAt: string | null;
  kybStatus: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export default function AdminCompanyVerificationsPage() {
  const { user } = useUserStore();
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingCompanies = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      setCompanies(await adminApi.getPendingCompanies());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat antrean verifikasi perusahaan.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingCompanies();
  }, [fetchPendingCompanies]);

  const verifyCompany = async (companyId: string, status: 'VERIFIED' | 'FAILED') => {
    const label = status === 'VERIFIED'
      ? 'MENYETUJUI verifikasi perusahaan ini'
      : 'MENOLAK verifikasi perusahaan ini';

    if (!confirm(`Anda akan ${label}. Lanjutkan?`)) return;

    // Alasan penolakan ikut dikirim ke perusahaan lewat notifikasi; tanpa itu
    // yang ditolak tidak punya cara tahu dokumen mana yang bermasalah.
    const reason =
      status === 'FAILED'
        ? prompt('Alasan penolakan (dikirim ke perusahaan):') || undefined
        : undefined;
    if (status === 'FAILED' && !reason) return;

    setProcessing(companyId);
    try {
      await adminApi.verifyCompany(companyId, status, reason);

      toast.success(
        status === 'VERIFIED' ? 'Perusahaan disetujui dan aktif.' : 'Perusahaan ditolak.'
      );
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal menyimpan keputusan. Coba lagi.'));
    } finally {
      setProcessing(null);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Halaman ini hanya untuk admin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" />
          Verifikasi Perusahaan (KYB)
        </h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
          Tinjau dokumen legalitas (NIB/NPWP) dari perusahaan yang mendaftar dan pastikan perusahaan sah sebelum akun mereka diaktifkan.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Memuat antrean...
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Antrean kosong</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tidak ada perusahaan yang menunggu verifikasi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-lg text-foreground">{company.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    Oleh: {company.user.fullName} ({company.user.email})
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">
                  {company.kybStatus}
                </span>
              </div>

              <div className="bg-background border border-border rounded-xl p-4 text-sm leading-relaxed space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Industri</p>
                    <p className="font-medium text-foreground">{company.industry || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ukuran Perusahaan</p>
                    <p className="font-medium text-foreground">{company.companySize || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lokasi</p>
                    <p className="font-medium text-foreground">{company.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    {company.websiteUrl ? (
                      <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 flex items-center gap-1 hover:underline">
                        {company.websiteUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="font-medium text-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">Dokumen Legalitas</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Nama Entitas Hukum</p>
                      <p className="text-sm mt-1">{company.legalEntityName || 'Tidak dilampirkan'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Nomor NIB / NPWP</p>
                      <p className="font-mono text-sm mt-1">{company.businessRegistrationNumber || 'Tidak dilampirkan'}</p>
                      {company.legalDocumentUrl && (
                        <a href={company.legalDocumentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
                          Lihat Dokumen <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Persetujuan tanpa dokumen adalah persetujuan buta. Ditandai
                      terang-terangan supaya kasusnya tidak lolos begitu saja. */}
                  {!company.legalDocumentUrl && (
                    <p className="mt-3 text-xs text-amber-500">
                      Perusahaan ini belum melampirkan dokumen legalitas apa pun.
                      Tidak ada yang bisa ditinjau — mintalah dokumennya sebelum menyetujui.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Mendaftar {new Date(company.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={processing === company.id}
                  onClick={() => verifyCompany(company.id, 'FAILED')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  <ShieldX className="h-4 w-4" />
                  Tolak
                </button>
                <button
                  disabled={processing === company.id}
                  onClick={() => verifyCompany(company.id, 'VERIFIED')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Setujui & Aktifkan
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
