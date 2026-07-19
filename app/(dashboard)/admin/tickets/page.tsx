'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../../../../store/userStore';
import { LifeBuoy, Search, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminTicketsPage() {
  const { user } = useUserStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const [search, setSearch] = useState('');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const load = async () => {
      await fetchTickets();
    };
    load();
  }, [user, token]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`${API_URL}/admin/tickets/${ticket.id}/replies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReplies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage || !selectedTicket) return;

    try {
      await fetch(`${API_URL}/admin/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId: user?.id, message: replyMessage })
      });
      setReplyMessage('');
      handleSelectTicket(selectedTicket);
      fetchTickets(); // Refresh list to update status to IN_PROGRESS
    } catch (err) {
      alert('Gagal mengirim balasan');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`${API_URL}/admin/tickets/${selectedTicket.id}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert('Gagal menutup tiket');
    }
  };

  const filtered = tickets.filter(t => 
    t.subject?.toLowerCase().includes(search.toLowerCase()) || 
    t.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Cari tiket..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center text-zinc-500 py-4">Memuat...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-zinc-500 py-4">Tidak ada tiket.</div>
            ) : (
              filtered.map(t => (
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
                {replies.map(reply => {
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
                        {format(new Date(reply.createdAt), 'HH:mm - dd MMM')} {isAdmin ? '(You)' : ''}
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
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Ketik balasan Anda..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
                    />
                    <button 
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      Kirim
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
