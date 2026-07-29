'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { ShieldAlert, Trash2, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { readAuthToken } from '@/lib/authStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminChallengesPage() {
  const { user } = useUserStore();
  const [challenges, setChallenges] = useState<any[]>([]);
  const token = readAuthToken();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchChallenges = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/challenges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setChallenges(data);
      } catch (err) {
        console.error('Failed to fetch challenges', err);
      }
    };

    fetchChallenges();
  }, [user, token]);

  const handleTakedown = async (challengeId: string, challengeTitle: string) => {
    const confirmTakedown = confirm(`Takedown Challenge Peringatan!\n\nAnda akan menghapus secara permanen challenge: "${challengeTitle}".\nTindakan ini tidak bisa dibatalkan. Lanjutkan?`);
    if (!confirmTakedown) return;

    try {
      const res = await fetch(`${API_URL}/admin/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChallenges(prev => prev.filter(c => c.id !== challengeId));
      } else {
        alert('Gagal menghapus challenge.');
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const filteredChallenges = challenges.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Moderasi Tantangan</h1>
          <p className="text-zinc-400">Pantau dan hapus (*takedown*) challenge yang melanggar ketentuan.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Cari judul challenge atau perusahaan..."
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
              {filteredChallenges.map(c => (
                <tr key={c.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-3 px-4">
                    <div className="font-medium text-white max-w-xs truncate" title={c.title}>{c.title}</div>
                    <div className="text-xs text-zinc-500 mt-1 capitalize">{c.difficulty} &bull; {c.type}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {c.company?.companyName || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">
                    {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : '-'}
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
                      <button
                        onClick={() => handleTakedown(c.id, c.title)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Takedown (Hapus Permanen)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChallenges.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Tidak ada challenge ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

