'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { FileText, Search, Activity } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminAuditLogsPage() {
  const { user } = useUserStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, token]);

  const filtered = logs.filter(log => 
    log.action?.toLowerCase().includes(search.toLowerCase()) || 
    log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-6 h-6 text-zinc-400" />
            Audit Logs
          </h1>
          <p className="text-zinc-400">Jejak rekaman sistem (*Black Box*) aktivitas krusial platform.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Cari aksi, email, atau entitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="py-3 px-4 font-medium text-zinc-400 w-48">Waktu (WIB)</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Aktor (Email)</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Aksi (Action)</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Target Entitas</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Detail Spesifik</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Tidak ada log ditemukan.</td></tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-zinc-400">
                      {log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">{log.user?.email || 'System'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full font-bold bg-zinc-800 text-zinc-300 flex items-center w-fit">
                        <Activity className="w-3 h-3 mr-1" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-zinc-300 font-mono">{log.entityType}</div>
                      <div className="text-xs text-zinc-500 truncate w-32" title={log.entityId}>{log.entityId || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <pre className="text-xs text-zinc-500 bg-zinc-950 p-2 rounded-lg max-w-xs overflow-x-auto">
                        {JSON.stringify(log.details || {}, null, 2)}
                      </pre>
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

