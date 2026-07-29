'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { readAuthToken } from '@/lib/authStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsPage() {
  const { user } = useUserStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = readAuthToken();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, token]);

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Memuat data analitik...</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-red-500">Gagal memuat analitik.</div>;
  }

  const { growthData, challengeCategories } = data;

  return (
    <div className="py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analitik & Laporan
        </h1>
        <p className="text-zinc-400">Ikhtisar pertumbuhan pengguna dan demografi tantangan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">Pertumbuhan Pengguna (6 Bulan)</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTalent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompany" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Legend />
                <Area type="monotone" dataKey="Talent" stroke="#10b981" fillOpacity={1} fill="url(#colorTalent)" />
                <Area type="monotone" dataKey="Perusahaan" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCompany)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Challenge Demographics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">Demografi Kategori</h2>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={challengeCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {challengeCategories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

