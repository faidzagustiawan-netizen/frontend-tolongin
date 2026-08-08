'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Users, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { adminApi, apiErrorMessage } from '@/services/adminApi';
import { AdminActionDialog } from '@/components/admin/AdminActionDialog';

export default function AdminDashboardPage() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<any>(null);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  // Antrean kosong dan antrean yang gagal dimuat menuntun ke keputusan yang
  // berlawanan: yang satu berarti tidak ada pekerjaan, yang lain berarti
  // pekerjaannya tidak terlihat. Dulu keduanya berbunyi sama, dan toast yang
  // hilang beberapa detik adalah satu-satunya pembeda.
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    { id: string; nama: string; status: 'VERIFIED' | 'FAILED' } | null
  >(null);
  const [isActing, setIsActing] = useState(false);

  const fetchData = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const [statsData, companiesData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPendingCompanies(),
      ]);
      setStats(statsData);
      setPendingCompanies(companiesData);
    } catch (err) {
      const pesan = apiErrorMessage(err, 'Gagal memuat data dasbor admin.');
      setLoadError(pesan);
      toast.error(pesan);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleVerify = async (reason?: string) => {
    if (!dialog) return;
    const { id: companyId, status } = dialog;

    setIsActing(true);
    try {
      await adminApi.verifyCompany(companyId, status, reason || undefined);
      setPendingCompanies((prev) => prev.filter((c) => c.id !== companyId));
      toast.success(status === 'VERIFIED' ? 'Perusahaan diverifikasi.' : 'Verifikasi ditolak.');
      setDialog(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memperbarui verifikasi perusahaan.'));
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users />} />
          <StatCard title="Total Talents" value={stats.totalTalents} />
          <StatCard title="Total Companies" value={stats.totalCompanies} />
          <StatCard title="Active Challenges" value={stats.totalChallenges} />
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Perusahaan Menunggu Verifikasi (KYB)</h2>

        {isLoading ? (
          <p className="text-zinc-400 text-center py-8">Memuat antrean verifikasi...</p>
        ) : loadError ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-red-400 text-sm">{loadError}</p>
            <p className="text-zinc-500 text-xs">
              Antrean tidak bisa dibaca — ini bukan berarti antreannya kosong.
            </p>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="text-xs font-bold text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
            >
              Coba muat lagi
            </button>
          </div>
        ) : pendingCompanies.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Tidak ada perusahaan yang menunggu verifikasi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 text-zinc-400 font-medium">Perusahaan</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium">Email</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium">Dokumen</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{company.companyName}</div>
                      <div className="text-sm text-zinc-500">{company.industry}</div>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{company.user?.email}</td>
                    <td className="py-4 px-4">
                      {/* Kolomnya bernama `legalDocumentUrl` di skema. Halaman ini
                          membaca `legalDocsUrl`, nama yang tidak pernah ada, jadi
                          tautan dokumennya tidak pernah muncul sekali pun. */}
                      {company.legalDocumentUrl ? (
                        <a
                          href={company.legalDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Lihat Dokumen
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-sm">Tidak ada dokumen</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            setDialog({
                              id: company.id,
                              nama: company.companyName,
                              status: 'VERIFIED',
                            })
                          }
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Terima</span>
                        </button>
                        <button
                          onClick={() =>
                            setDialog({
                              id: company.id,
                              nama: company.companyName,
                              status: 'FAILED',
                            })
                          }
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminActionDialog
        open={!!dialog}
        title={dialog?.status === 'VERIFIED' ? 'Verifikasi perusahaan' : 'Tolak verifikasi'}
        confirmLabel={dialog?.status === 'VERIFIED' ? 'Verifikasi' : 'Tolak'}
        destructive={dialog?.status === 'FAILED'}
        isBusy={isActing}
        reason={
          dialog?.status === 'FAILED'
            ? {
                label: 'Alasan penolakan',
                placeholder: 'Contoh: Dokumen legal tidak terbaca dan nama badan usaha tidak cocok.',
                required: true,
                minLength: 10,
                hint: 'Dikirim ke pemilik akun perusahaan supaya mereka tahu apa yang harus diperbaiki.',
              }
            : undefined
        }
        onConfirm={(reason) => void handleVerify(reason)}
        onCancel={() => setDialog(null)}
      >
        {dialog?.status === 'VERIFIED' ? (
          <p>
            <strong className="text-foreground">{dialog?.nama}</strong> akan bisa menerbitkan studi
            kasus dan merekrut kandidat.
          </p>
        ) : (
          <p>
            <strong className="text-foreground">{dialog?.nama}</strong> tetap tidak bisa menerbitkan
            studi kasus. Mereka boleh mengajukan verifikasi ulang setelah memperbaiki dokumennya.
          </p>
        )}
      </AdminActionDialog>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-zinc-400 font-medium">{title}</h3>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
