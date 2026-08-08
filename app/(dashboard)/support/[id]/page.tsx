'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, LifeBuoy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage, supportApi } from '@/services/adminApi';
// Peta status dipakai bersama dengan halaman daftar; lihat catatan di sana.
import { STATUS_LABEL } from '../page';

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params?.id;

  const [ticket, setTicket] = useState<any>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      setTicket(await supportApi.getMyTicket(ticketId));
      setLoadFailed(false);
    } catch (err) {
      // Permintaan yang gagal dibedakan dari tiket yang memang tidak ada:
      // keduanya dulu berakhir di kalimat "Tiket tidak ditemukan.", jadi
      // gangguan jaringan sesaat terbaca seperti tiket yang hilang.
      setLoadFailed(true);
      toast.error(apiErrorMessage(err, 'Gagal memuat tiket.'));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void fetchTicket();
  }, [fetchTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ticketId) return;

    setIsSending(true);
    try {
      await supportApi.replyToMyTicket(ticketId, message.trim());
      setMessage('');
      await fetchTicket();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal mengirim balasan.'));
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Memuat...</div>;
  }

  if (loadFailed) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-red-400 font-medium">Gagal memuat tiket ini.</p>
        <p className="text-sm text-muted-foreground">
          Tiketnya kemungkinan besar masih ada — permintaannya yang tidak sampai.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => void fetchTicket()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Coba Lagi
          </button>
          <Link href="/support" className="text-sky-500 hover:text-sky-400 text-sm">
            Kembali ke daftar tiket
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Tiket tidak ditemukan.
        <div className="mt-4">
          <Link href="/support" className="text-sky-500 hover:text-sky-400">
            Kembali ke daftar tiket
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const statusLabel = STATUS_LABEL[ticket.status];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Semua tiket
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <LifeBuoy className="w-6 h-6 text-sky-500 mt-1 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
            <span>Dibuat {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm')}</span>
            {/* Status mentah (`IN_PROGRESS`) diganti terjemahan yang sama
                dengan halaman daftar. */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusLabel?.className ?? 'bg-foreground/10 text-muted-foreground'}`}>
              {statusLabel?.text ?? ticket.status}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 space-y-6 bg-background/50">
          <div className="flex flex-col items-start">
            <div className="bg-foreground/10 text-foreground rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 ml-1">
              {format(new Date(ticket.createdAt), 'HH:mm - dd MMM')}
            </span>
          </div>

          {(ticket.replies ?? []).map((reply: any) => {
            const fromAdmin = reply.user?.role === 'ADMIN';
            return (
              <div
                key={reply.id}
                className={`flex flex-col ${fromAdmin ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    fromAdmin
                      ? 'bg-sky-600 text-white rounded-tl-sm'
                      : 'bg-foreground/10 text-foreground rounded-tr-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {fromAdmin ? 'Tim Dukungan' : 'Anda'} &bull;{' '}
                  {format(new Date(reply.createdAt), 'HH:mm - dd MMM')}
                </span>
              </div>
            );
          })}
        </div>

        {isClosed ? (
          <div className="p-4 border-t border-border text-center text-muted-foreground text-sm">
            Tiket ini sudah ditutup. Buat tiket baru bila masalahnya belum selesai.
          </div>
        ) : (
          <form onSubmit={handleReply} className="p-4 border-t border-border flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis balasan..."
              className="flex-1 bg-background border border-border text-foreground rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              {isSending ? 'Mengirim...' : 'Kirim'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
