'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Trash2, Plus, Info, AlertTriangle, CheckCircle, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { adminApi, apiErrorMessage, type AnnouncementType } from '@/services/adminApi';
import { AdminActionDialog } from '@/components/admin/AdminActionDialog';

export default function AdminCMSPage() {
  const { user } = useUserStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogHapus, setDialogHapus] = useState<{ id: string; judul: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('INFO');
  // `isActive` dan `expiresAt` sudah lama ada di skema tetapi tidak pernah bisa
  // diisi dari mana pun, jadi setiap pengumuman abadi dan selalu tayang.
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    setLoading(true);
    try {
      const result = await adminApi.getAnnouncements({ limit: 50 });
      setAnnouncements(result.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat daftar pengumuman.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan isi pesan wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        type,
        isActive,
        // datetime-local memberi waktu lokal tanpa zona; server menyimpan
        // DateTime, jadi nilainya dinormalkan ke ISO lebih dulu.
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      setTitle('');
      setContent('');
      setType('INFO');
      setIsActive(true);
      setExpiresAt('');
      await fetchAnnouncements();
      toast.success('Pengumuman disiarkan.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal membuat pengumuman.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!dialogHapus) return;

    setIsDeleting(true);
    try {
      await adminApi.deleteAnnouncement(dialogHapus.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== dialogHapus.id));
      toast.success('Pengumuman dihapus.');
      setDialogHapus(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal menghapus pengumuman.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeIcon = (t: string) => {
    if (t === 'WARNING') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (t === 'SUCCESS') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (t === 'MAINTENANCE') return <PenTool className="w-5 h-5 text-red-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const isLive = (a: any) =>
    a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date());

  return (
    <div className="py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-fuchsia-400" />
          Pengumuman (CMS)
        </h1>
        <p className="text-zinc-400">Kelola banner informasi yang muncul di layar pengguna.</p>
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
                <label htmlFor="ann-type" className="block text-sm font-medium text-zinc-400 mb-1">
                  Tipe Banner
                </label>
                <select
                  id="ann-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as AnnouncementType)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="INFO">Informasi (Biru)</option>
                  <option value="WARNING">Peringatan (Kuning)</option>
                  <option value="SUCCESS">Sukses/Promo (Hijau)</option>
                  <option value="MAINTENANCE">Maintenance (Merah)</option>
                </select>
              </div>
              <div>
                <label htmlFor="ann-title" className="block text-sm font-medium text-zinc-400 mb-1">
                  Judul
                </label>
                <input
                  id="ann-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Server..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label htmlFor="ann-content" className="block text-sm font-medium text-zinc-400 mb-1">
                  Isi Pesan
                </label>
                <textarea
                  id="ann-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detail pengumuman..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label htmlFor="ann-expires" className="block text-sm font-medium text-zinc-400 mb-1">
                  Berhenti tampil pada <span className="text-zinc-600">(opsional)</span>
                </label>
                <input
                  id="ann-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-fuchsia-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-fuchsia-500 focus:ring-fuchsia-500"
                />
                Langsung tayangkan
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                {isSaving ? 'Menyiarkan...' : 'Siarkan Sekarang'}
              </button>
            </form>
          </div>
        </div>

        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Daftar Pengumuman</h2>
          {loading ? (
            <div className="text-zinc-500">Memuat...</div>
          ) : announcements.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-12 text-center text-zinc-500">
              Belum ada pengumuman yang disiarkan.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div className="p-3 bg-zinc-950 rounded-lg shrink-0">
                  {getTypeIcon(a.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-white text-lg">{a.title}</h3>
                    <button
                      onClick={() => setDialogHapus({ id: a.id, judul: a.title })}
                      className="text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-400 text-sm mt-1 mb-3 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500">
                    <span>{format(new Date(a.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                    {a.expiresAt && (
                      <>
                        <span>•</span>
                        <span>berakhir {format(new Date(a.expiresAt), 'dd MMM yyyy, HH:mm')}</span>
                      </>
                    )}
                    <span>•</span>
                    {isLive(a) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">Tayang</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {a.isActive ? 'Kedaluwarsa' : 'Non-aktif'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      <AdminActionDialog
        open={!!dialogHapus}
        title="Hapus pengumuman"
        confirmLabel="Hapus"
        destructive
        isBusy={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDialogHapus(null)}
      >
        <p>
          <strong className="text-foreground">{dialogHapus?.judul}</strong> akan hilang dari spanduk
          pengumuman di seluruh aplikasi.
        </p>
        <p className="text-muted-foreground">Tindakan ini tidak bisa dibatalkan.</p>
      </AdminActionDialog>
    </div>
  );
}
