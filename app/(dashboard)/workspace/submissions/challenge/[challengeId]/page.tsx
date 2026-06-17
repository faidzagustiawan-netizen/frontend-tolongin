'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../../../../../services/submissions.service';
import { useUserStore } from '../../../../../../store/userStore';
import { Button } from '../../../../../../components/common/Button';
import { FileText, CheckCircle, Clock, XCircle, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChallengeSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const challengeId = params.challengeId as string;

  // Protect route
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'COMPANY' && user?.role !== 'ADMIN') {
      router.push('/workspace');
    }
  }, [isAuthenticated, user, router]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['company-submissions', challengeId],
    queryFn: () => submissionsService.getCompanySubmissions(challengeId),
    enabled: isAuthenticated && !!challengeId && (user?.role === 'COMPANY' || user?.role === 'ADMIN'),
  });

  const submissions = response?.data || [];
  const challengeInfo = submissions.length > 0 ? submissions[0].challenge : null;

  const filteredSubmissions = submissions.filter((sub: any) =>
    sub.talent.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_AI':
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Diproses AI</span>;
      case 'UNDER_REVIEW':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Perlu Direview</span>;
      case 'PASSED':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Lolos</span>;
      case 'FAILED':
        return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Gagal</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs font-semibold w-fit">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button 
        onClick={() => router.push('/workspace')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Kandidat: {challengeInfo ? challengeInfo.title : 'Studi Kasus'}
        </h1>
        <p className="text-gray-400">Daftar talenta yang telah mengumpulkan pekerjaan untuk studi kasus ini.</p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between bg-white/5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Cari nama talenta..."
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-gray-400">Memuat data submisi...</p>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-bg/50 border-b border-dark-border">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kandidat</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Penilaian</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal Submit</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredSubmissions.map((sub: any, index: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={sub.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/workspace/submissions/${sub.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold overflow-hidden">
                          {sub.talent.avatarUrl ? (
                            <img src={sub.talent.avatarUrl} alt={sub.talent.fullName} className="w-full h-full object-cover" />
                          ) : (
                            sub.talent.fullName[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{sub.talent.fullName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{sub.talent.skills?.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Nilai Kandidat <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Belum ada kandidat</h3>
              <p className="text-sm text-gray-400 max-w-md">Belum ada kandidat yang mengumpulkan solusi untuk studi kasus ini, atau nama tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
