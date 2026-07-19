'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { ShieldAlert, Users, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminDashboardPage() {
  const { user } = useUserStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const statsRes = await fetch(`${API_URL}/admin/stats`, { headers });
        const statsData = await statsRes.json();
        setStats(statsData);
        
        const companiesRes = await fetch(`${API_URL}/admin/companies/pending`, { headers });
        const companiesData = await companiesRes.json();
        setPendingCompanies(companiesData);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      }
    };

    fetchData();
  }, [user, router, token]);

  const handleVerify = async (companyId: string, status: 'VERIFIED' | 'FAILED') => {
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      await fetch(`${API_URL}/admin/companies/${companyId}/verify`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ status })
      });
      setPendingCompanies(prev => prev.filter(c => c.id !== companyId));
    } catch (err) {
      alert('Gagal memverifikasi perusahaan');
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users />} />
          <StatCard title="Total Talents" value={stats.totalTalents} />
          <StatCard title="Total Companies" value={stats.totalCompanies} />
          <StatCard title="Active Challenges" value={stats.totalChallenges} />
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Perusahaan Menunggu Verifikasi (KYB)</h2>
        
        {pendingCompanies.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Tidak ada perusahaan yang menunggu verifikasi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 text-zinc-400 font-medium">Perusahaan</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium">Email</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium">Dokumen</th>
                  <th className="py-4 px-4 text-zinc-400 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingCompanies.map(company => (
                  <tr key={company.id} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{company.companyName}</div>
                      <div className="text-sm text-zinc-500">{company.industry}</div>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{company.user.email}</td>
                    <td className="py-4 px-4">
                      {company.legalDocsUrl ? (
                        <a href={company.legalDocsUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm">
                          Lihat Dokumen
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-sm">Tidak ada dokumen</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleVerify(company.id, 'VERIFIED')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Terima</span>
                        </button>
                        <button
                          onClick={() => handleVerify(company.id, 'FAILED')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-zinc-400 font-medium">{title}</h3>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
