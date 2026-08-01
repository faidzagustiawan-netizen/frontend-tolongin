'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Search,
  ShieldOff,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { adminApi, apiErrorMessage } from '@/services/adminApi';

const PAGE_SIZE = 25;

export default function AdminChallengesPage() {
  const { user } = useUserStore();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchChallenges = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    setIsLoading(true);
    try {
      const result = await adminApi.getChallenges({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      setChallenges(result.data);
      setTotal(result.total);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat daftar studi kasus.'));
    } finally {
      setIsLoading(false);
    }
  }, [user, page, debouncedSearch]);

  useEffect(() => {
    void fetchChallenges();
  }, [fetchChallenges]);

  const handleTakedown = async (challengeId: string, challengeTitle: string) => {
    // Alasannya wajib: pemilik menerimanya di notifikasi, dan tanpa itu ia
    // tidak punya cara tahu apa yang harus diperbaiki.
    const reason = prompt(
      `Turunkan "${challengeTitle}" dari peredaran.\n\n` +
        'Submisi, penilaian, dan portofolio talenta tetap tersimpan.\n' +
        'Tuliskan alasannya (minimal 10 karakter):',
    );
    if (!reason) return;

    try {
      await adminApi.takedownChallenge(challengeId, reason);
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? { ...c, takenDownAt: new Date().toISOString(), takedownReason: reason }
            : c,
        ),
      );
      toast.success('Studi kasus diturunkan.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal menurunkan studi kasus.'));
    }
  };

  const handleRestore = async (challengeId: string, challengeTitle: string) => {
    if (!confirm(`Cabut penurunan "${challengeTitle}"?`)) return;

    try {
      await adminApi.restoreChallenge(challengeId);
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? { ...c, takenDownAt: null, takedownReason: null }
            : c,
        ),
      );
      toast.success('Penurunan dicabut.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal mencabut penurunan.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Moderasi Tantangan</h1>
          <p className="text-zinc-400">
            Turunkan studi kasus yang melanggar ketentuan. Penurunan tidak menghapus
            submisi maupun portofolio talenta yang sudah terbit.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari judul challenge..."
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
                <th className="py-3 px-4 font-medium text-zinc-400">Judul Challenge</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Perusahaan</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Dibuat</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-3 px-4">
                    <div className="font-medium text-white max-w-xs truncate" title={c.title}>
                      {c.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 capitalize">
                      {c.difficulty} &bull; {c.challengeType}
                    </div>
                    {c.takenDownAt && (
                      <div
                        className="text-xs text-red-400 mt-1 max-w-xs truncate"
                        title={c.takedownReason || undefined}
                      >
                        Diturunkan: {c.takedownReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {c.company?.companyName || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">
                    {c.createdAt
                      ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
                      : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/challenges/${c.slug}`}
                        target="_blank"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Lihat Detail (Tab Baru)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      {c.takenDownAt ? (
                        <button
                          onClick={() => handleRestore(c.id, c.title)}
                          className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Cabut penurunan"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTakedown(c.id, c.title)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Turunkan dari peredaran"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && challenges.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Tidak ada challenge ditemukan.
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
