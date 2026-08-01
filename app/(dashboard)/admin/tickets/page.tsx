'use client';

import { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Search, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { adminApi, apiErrorMessage, type TicketStatus } from '@/services/adminApi';

const STATUS_FILTERS: Array<{ label: string; value: TicketStatus | 'ALL' }> = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Baru', value: 'OPEN' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Ditutup', value: 'CLOSED' },
];

export default function AdminTicketsPage() {
  const { user } = useUserStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

    setLoading(true);
    try {
      const result = await adminApi.getTickets({
        limit: 50,
        search: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setTickets(result.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat daftar tiket.'));
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const loadReplies = useCallback(async (ticketId: string) => {
    try {
      setReplies(await adminApi.getTicketReplies(ticketId));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal memuat balasan tiket.'));
    }
  }, []);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setReplies([]);
    await loadReplies(ticket.id);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      // Penulis balasan diambil server dari token. Versi sebelumnya mengirim
      // `userId` di badan permintaan, dan server memakainya apa adanya.
      await adminApi.replyToTicket(selectedTicket.id, replyMessage.trim());
      setReplyMessage('');
      await loadReplies(selectedTicket.id);
      setSelectedTicket((prev: any) =>
        prev?.status === 'OPEN' ? { ...prev, status: 'IN_PROGRESS' } : prev,
      );
      await fetchTickets();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal mengirim balasan.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('Tutup tiket ini? Pelapor akan diberi tahu.')) return;

    try {
      await adminApi.closeTicket(selectedTicket.id);
      setSelectedTicket(null);
      await fetchTickets();
      toast.success('Tiket ditutup.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Gagal menutup tiket.'));
    }
  };

  return (
    <div className="py-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-sky-400" />
          Tiket Bantuan (Helpdesk)
        </h1>
        <p className="text-zinc-400">Selesaikan komplain dan pertanyaan dari pengguna.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">

        {/* Ticket List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari judul atau email pelapor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center text-zinc-500 py-4">Memuat...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-zinc-500 py-4">Tidak ada tiket.</div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`w-full text-left p-4 rounded-lg transition-colors border ${
                    selectedTicket?.id === t.id
                      ? 'bg-sky-500/10 border-sky-500/50'
                      : 'bg-transparent border-transparent hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-white truncate pr-2">{t.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'OPEN' ? 'bg-red-500/20 text-red-400' :
                      t.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 truncate mb-2">{t.user?.email}</div>
                  <div className="flex items-center text-[10px] text-zinc-600 gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {format(new Date(t.createdAt), 'dd MMM yyyy')}
                    {t._count?.replies > 0 && (
                      <span className="ml-2">{t._count.replies} balasan</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Chat Area */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Pilih tiket dari daftar di sebelah kiri untuk melihat detail dan mulai membalas.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-white">{selectedTicket.subject}</h2>
                  <p className="text-sm text-zinc-400">Dari: {selectedTicket.user?.email}</p>
                </div>
                {selectedTicket.status !== 'CLOSED' && (
                  <button
                    onClick={handleCloseTicket}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Tutup Tiket
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-950/50">
                {/* Original Ticket Description */}
                <div className="flex flex-col items-start">
                  <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 ml-1">
                    {format(new Date(selectedTicket.createdAt), 'HH:mm - dd MMM')}
                  </span>
                </div>

                {/* Replies */}
                {replies.map((reply) => {
                  const isAdmin = reply.user?.role === 'ADMIN';
                  return (
                    <div key={reply.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        isAdmin
                          ? 'bg-sky-600 text-white rounded-tr-sm'
                          : 'bg-zinc-800 text-white rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 mx-1">
                        {format(new Date(reply.createdAt), 'HH:mm - dd MMM')} {isAdmin ? '(Admin)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              {selectedTicket.status !== 'CLOSED' ? (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                  <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Ketik balasan Anda..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim() || isSending}
                      className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      {isSending ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 text-center text-zinc-500 text-sm">
                  Tiket ini telah ditutup. Tidak dapat membalas lagi.
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
