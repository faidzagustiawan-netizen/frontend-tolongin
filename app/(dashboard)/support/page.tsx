'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, LifeBuoy, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { apiErrorMessage, supportApi } from '@/services/adminApi';

/**
 * Terjemahan status tiket, dipakai bersama oleh daftar ini dan halaman detail
 * `support/[id]`. Detailnya dulu menampilkan nilai mentah (`IN_PROGRESS`)
 * karena petanya hanya ada di sini — satu sumber mencegah keduanya kembali
 * berbeda.
 */
export const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  OPEN: { text: 'Menunggu', className: 'bg-red-500/20 text-red-500' },
  IN_PROGRESS: { text: 'Diproses', className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  RESOLVED: { text: 'Selesai', className: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  CLOSED: { text: 'Ditutup', className: 'bg-foreground/10 text-muted-foreground' },
};

export default function SupportPage() {
  const { isAuthenticated } = useUserStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      setTickets(await supportApi.listMyTickets());
      setLoadFailed(false);
    } catch (err) {
      // Kegagalan dicatat di state, bukan cuma sebagai toast yang hilang dalam
      // beberapa detik: tanpa penanda ini layarnya berbunyi "Belum ada tiket"
      // dan pengguna mengira tiket yang baru dikirimnya raib.
      setLoadFailed(true);
      toast.error(apiErrorMessage(err, 'Gagal memuat tiket Anda.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await supportApi.createTicket({
        subject: subject.trim(),
        description: description.trim(),
      });
      setSubject('');
      setDescription('');
      setShowForm(false);
      await fetchTickets();
      toast.success('Tiket terkirim. Tim dukungan akan membalas lewat halaman ini.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal membuat tiket.'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          {/* Palet keras (`text-white`, `text-zinc-*`) diganti token tema.
              Di mode terang judul putih ini tidak terbaca sama sekali. */}
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-sky-500" />
            Bantuan
          </h1>
          <p className="text-muted-foreground">
            Kirim pertanyaan atau keluhan. Balasan tim dukungan muncul di tiket yang sama.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tiket Baru
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-xl p-6 mb-8 space-y-4"
        >
          <div>
            <label htmlFor="ticket-subject" className="block text-sm font-medium text-muted-foreground mb-1">
              Judul
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              minLength={5}
              maxLength={200}
              required
              placeholder="Ringkas masalahnya dalam satu baris"
              className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="ticket-description" className="block text-sm font-medium text-muted-foreground mb-1">
              Uraian
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={20}
              maxLength={5000}
              required
              rows={5}
              placeholder="Apa yang terjadi, kapan, dan apa yang sudah Anda coba"
              className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimal 20 karakter.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              {isCreating ? 'Mengirim...' : 'Kirim Tiket'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-muted-foreground text-center py-8">Memuat...</div>
        ) : loadFailed ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4">
            <p className="text-red-400 font-medium">Gagal memuat daftar tiket Anda.</p>
            <button
              onClick={() => void fetchTickets()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Coba Lagi
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            Belum ada tiket. Buat satu bila Anda butuh bantuan.
          </div>
        ) : (
          tickets.map((ticket) => {
            const status = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.OPEN;
            return (
              <Link
                key={ticket.id}
                href={`/support/${ticket.id}`}
                className="block bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h2 className="font-semibold text-foreground">{ticket.subject}</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                    {status.text}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(ticket.createdAt), 'dd MMM yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {ticket._count?.replies ?? 0} balasan
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
