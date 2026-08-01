'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, Search, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { adminApi, apiErrorMessage } from '@/services/adminApi';

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const { user } = useUserStore();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Pencarian kini dikerjakan server, jadi setiap ketikan tidak boleh langsung
  // jadi satu permintaan.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    setIsLoading(true);
    try {
      const result = await adminApi.getUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      setUsersList(result.data);
      setTotal(result.total);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat daftar pengguna.'));
    } finally {
      setIsLoading(false);
    }
  }, [user, page, debouncedSearch]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleBanToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'membuka blokir' : 'memblokir';
    if (!confirm(`Apakah Anda yakin ingin ${action} pengguna ini?`)) return;

    // Alasan ikut tersimpan di jejak audit dan dikirim ke penggunanya.
    const reason = currentStatus
      ? undefined
      : prompt('Alasan pemblokiran (opsional):') || undefined;

    try {
      await adminApi.toggleBanUser(userId, !currentStatus, reason);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBanned: !currentStatus } : u)),
      );
      toast.success(currentStatus ? 'Blokir dicabut.' : 'Pengguna diblokir.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal mengubah status blokir.'));
    }
  };

  const handleWarning = async (userId: string) => {
    const message = prompt('Masukkan pesan peringatan untuk pengguna ini:');
    if (!message) return;

    try {
      await adminApi.sendWarning(userId, message);
      toast.success('Peringatan berhasil dikirim.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal mengirim peringatan.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manajemen Pengguna</h1>
          <p className="text-zinc-400">
            Pantau dan kelola seluruh pengguna di platform.
            {total > 0 && <span className="ml-1 text-zinc-500">({total} akun)</span>}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari email atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#E3FF00]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="py-3 px-4 font-medium text-zinc-400">Email</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Role</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Status</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{u.fullName || 'No Name'}</div>
                    <div className="text-sm text-zinc-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400' :
                      u.role === 'COMPANY' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.isBanned ? (
                      <span className="text-red-400 flex items-center text-sm"><Ban className="w-3 h-3 mr-1"/> Banned</span>
                    ) : (
                      <span className="text-emerald-400 text-sm">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleWarning(u.id)}
                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title="Kirim Peringatan"
                      >
                        <MailWarning className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleBanToggle(u.id, u.isBanned)}
                        disabled={u.id === user?.id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          u.isBanned
                            ? 'text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        title={
                          u.id === user?.id
                            ? 'Anda tidak dapat memblokir akun sendiri'
                            : u.isBanned
                              ? 'Buka Blokir'
                              : 'Blokir'
                        }
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && usersList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Memuat...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800">
            <span className="text-sm text-zinc-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
