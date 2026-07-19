'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../../../../store/userStore';
import { Megaphone, Trash2, Plus, Info, AlertTriangle, CheckCircle, PenTool } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminCMSPage() {
  const { user } = useUserStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('INFO');

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const load = async () => {
      await fetchAnnouncements();
    };
    load();
  }, [user, token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('Judul dan Konten wajib diisi!');

    try {
      await fetch(`${API_URL}/admin/announcements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, content, type })
      });
      setTitle('');
      setContent('');
      setType('INFO');
      fetchAnnouncements();
    } catch (err) {
      alert('Gagal membuat pengumuman');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await fetch(`${API_URL}/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Gagal menghapus');
    }
  };

  const getTypeIcon = (t: string) => {
    if (t === 'WARNING') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (t === 'SUCCESS') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (t === 'MAINTENANCE') return <PenTool className="w-5 h-5 text-red-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-fuchsia-400" />
          Pengumuman (CMS)
        </h1>
        <p className="text-zinc-400">Kelola banner informasi yang akan muncul di layar pengguna.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-zinc-400" />
              Buat Pengumuman
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tipe Banner</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="INFO">Informasi (Biru)</option>
                  <option value="WARNING">Peringatan (Kuning)</option>
                  <option value="SUCCESS">Sukses/Promo (Hijau)</option>
                  <option value="MAINTENANCE">Maintenance (Merah)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Judul</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Server..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Isi Pesan</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Detail pengumuman..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                Siarkan Sekarang
              </button>
            </form>
          </div>
        </div>

        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Daftar Pengumuman Aktif</h2>
          {loading ? (
            <div className="text-zinc-500">Memuat...</div>
          ) : announcements.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-12 text-center text-zinc-500">
              Belum ada pengumuman yang disiarkan.
            </div>
          ) : (
            announcements.map(a => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div className="p-3 bg-zinc-950 rounded-lg shrink-0">
                  {getTypeIcon(a.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">{a.title}</h3>
                    <button 
                      onClick={() => handleDelete(a.id)}
                      className="text-zinc-500 hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-400 text-sm mt-1 mb-3 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                    <span>ID: {a.id.slice(0,8)}</span>
                    <span>•</span>
                    <span>{format(new Date(a.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Aktif</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
