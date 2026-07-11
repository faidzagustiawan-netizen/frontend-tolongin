'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../../../../store/userStore';
import { CreditCard, Search, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminBillingPage() {
  const { user } = useUserStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchBilling = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/admin/billing`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error('Failed to fetch billing', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [user, token]);

  const filtered = transactions.filter(t => 
    t.user?.email?.toLowerCase().includes(search.toLowerCase()) || 
    t.paymentType?.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Finansial (Billing)
          </h1>
          <p className="text-zinc-400">Pantau seluruh arus kas dan transaksi perusahaan.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Cari email atau jenis pembayaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="py-3 px-4 font-medium text-zinc-400">ID / Waktu</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Pengguna</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Tipe Pembayaran</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Nominal</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Status</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Tidak ada transaksi ditemukan.</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-zinc-500 truncate w-24" title={t.id}>{t.id}</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {t.createdAt ? format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm') : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{t.user?.fullName || 'No Name'}</div>
                      <div className="text-sm text-zinc-500">{t.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-zinc-800 text-zinc-300">
                        {t.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {formatRupiah(t.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        t.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                        t.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.checkoutUrl ? (
                        <a href={t.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm">
                          <FileText className="w-4 h-4 mr-1" />
                          Receipt
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
