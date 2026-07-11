'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../../../../store/userStore';
import { ShieldAlert, Ban, Search, MailWarning } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminUsersPage() {
  const { user } = useUserStore();
  const [usersList, setUsersList] = useState<any[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUsersList(data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchUsers();
  }, [user, token]);

  const handleBanToggle = async (userId: string, currentStatus: boolean) => {
    const confirmBan = confirm(`Apakah Anda yakin ingin ${currentStatus ? 'membuka blokir' : 'memblokir'} pengguna ini?`);
    if (!confirmBan) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isBanned: !currentStatus })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
      } else {
        alert('Gagal mengubah status blokir.');
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const handleWarning = async (userId: string) => {
    const message = prompt('Masukkan pesan peringatan untuk pengguna ini:');
    if (!message) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${userId}/warning`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        alert('Peringatan berhasil dikirim!');
      } else {
        alert('Gagal mengirim peringatan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manajemen Pengguna</h1>
          <p className="text-zinc-400">Pantau dan kelola seluruh pengguna di platform.</p>
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
              {filteredUsers.map(u => (
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
                        className={`p-2 rounded-lg transition-colors ${
                          u.isBanned 
                            ? 'text-emerald-500 hover:bg-emerald-500/10' 
                            : 'text-red-500 hover:bg-red-500/10'
                        }`}
                        title={u.isBanned ? 'Buka Blokir' : 'Blokir'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Tidak ada pengguna ditemukan.
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
