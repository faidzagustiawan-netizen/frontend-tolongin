'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '../../../../services/companies.service';
import { useUserStore } from '../../../../store/userStore';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Badge } from '../../../../components/common/Badge';
import { Input } from '../../../../components/common/Input';
import { Users, Activity, Copy, Check, Key, ChevronRight, Clock, Box, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function TeamWorkspacePage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'logs'>('members');
  const [searchLog, setSearchLog] = useState('');

  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => companiesService.getTeamMembers(),
    enabled: !!user && user.role === 'COMPANY',
  });

  const { data: activityLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => companiesService.getActivityLogs(),
    enabled: !!user && user.role === 'COMPANY',
  });

  const generateCodeMutation = useMutation({
    mutationFn: () => companiesService.generateInviteCode(),
    onSuccess: () => {
      toast.success('Kode undangan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui kode undangan');
    },
  });

  if (user?.role !== 'COMPANY') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-gray-500">
          Hanya akun perusahaan yang dapat mengakses halaman ini.
        </div>
      </div>
    );
  }

  const inviteCode = user?.profile?.inviteCode || '...';

  const copyToClipboard = () => {
    if (inviteCode && inviteCode !== '...') {
      navigator.clipboard.writeText(inviteCode as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Kode disalin ke clipboard!');
    }
  };

  const filteredLogs = activityLogs?.filter((log: any) => {
    const search = searchLog.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(search);
    const userMatch = log.user?.email?.toLowerCase().includes(search);
    const entityMatch = log.entityType?.toLowerCase().includes(search);
    return actionMatch || userMatch || entityMatch;
  });

  const parseLogDetails = (log: any) => {
    const { action, details } = log;
    if (!details && !action) return <span className="text-xs text-muted-foreground italic">Tidak ada detail</span>;

    const renderRaw = () => (
      <div className="text-xs text-muted-foreground bg-foreground/5 p-2 rounded-lg max-w-sm overflow-x-auto font-mono">
        {JSON.stringify(details, null, 2)}
      </div>
    );

    switch(action) {
      case 'CHALLENGE_CREATED':
      case 'UPDATE_CHALLENGE':
        return (
          <div className="text-sm">
            <span className="text-foreground">Tantangan: </span>
            <span className="font-bold text-emerald-500">"{details?.title || 'Unknown'}"</span>
            {details?.status && <span className="ml-2 text-xs text-muted-foreground">(Status: {details.status})</span>}
          </div>
        );
      case 'PROFILE_UPDATED':
        return <div className="text-sm text-foreground">Profil perusahaan diperbarui.</div>;
      case 'USER_LOGIN':
        return <div className="text-sm text-foreground">Sesi login baru.</div>;
      case 'MEMBER_JOINED':
        return (
          <div className="text-sm">
            <span className="text-foreground">Anggota tim baru: </span>
            <span className="font-bold text-emerald-500">{details?.email || 'Unknown'}</span>
          </div>
        );
      case 'GRADE_SUBMISSION':
        return (
          <div className="text-sm">
            <span className="text-foreground">Submisi dinilai: </span>
            <span className="font-bold text-emerald-500">{details?.finalScore || 'N/A'} poin</span>
          </div>
        );
      default:
        return details ? renderRaw() : <span className="text-sm text-foreground">{action}</span>;
    }
  };

  const getUserName = (logUser: any) => {
    if (!logUser) return 'Sistem';
    return logUser.companyProfile?.companyName || logUser.talentProfile?.fullName || logUser.email.split('@')[0];
  };

  const getUserAvatar = (logUser: any) => {
    return logUser?.companyProfile?.logoUrl || logUser?.talentProfile?.avatarUrl;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Manajemen Tim</h1>
          <p className="text-muted-foreground mt-1">
            Kelola peran anggota tim dan pantau setiap aktivitas di dalam *workspace* perusahaan.
          </p>
        </div>
        
        {/* INVITE CODE CARD */}
        <Card className="p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 shadow-emerald-500/5">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-600 rounded-xl">
            <Key size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Kode Undangan Tim</p>
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-lg text-foreground px-2 py-0.5 bg-background rounded border border-border">
                {inviteCode}
              </code>
              <Button size="sm" variant="outline" className="h-8 px-3" onClick={copyToClipboard}>
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                isLoading={generateCodeMutation.isPending}
                onClick={() => generateCodeMutation.mutate()}
              >
                Generate Baru
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* DASHBOARD TABS */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        {/* TAB SWITCHER */}
        <div className="flex border-b border-border bg-foreground/5">
          <button
            className={`flex-1 sm:flex-none px-6 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'members' 
                ? 'bg-card text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={18} />
            Anggota Tim
          </button>
          <button
            className={`flex-1 sm:flex-none px-6 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'logs' 
                ? 'bg-card text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            <Activity size={18} />
            Log Aktivitas
          </button>
        </div>

        {/* TAB CONTENT: MEMBERS */}
        {activeTab === 'members' && (
          <div className="p-0 overflow-x-auto">
            {isLoadingMembers ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
                <Users size={32} className="mb-4 opacity-50" />
                <p>Memuat data tim...</p>
              </div>
            ) : teamMembers?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ShieldCheck size={32} className="mb-4 opacity-50 text-emerald-500" />
                <p>Belum ada anggota tim yang bergabung.</p>
                <p className="text-xs mt-2">Bagikan kode undangan di atas kepada karyawan Anda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-foreground/5 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4 font-bold">Profil & Pengguna</th>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Peran Akses</th>
                    <th className="px-6 py-4 font-bold">Tanggal Bergabung</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamMembers?.map((member: any) => {
                    const avatar = getUserAvatar(member.user);
                    const name = getUserName(member.user);
                    return (
                      <tr key={member.id} className="hover:bg-foreground/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {avatar ? (
                                <Image src={avatar} alt={name} width={40} height={40} className="object-cover w-full h-full" />
                              ) : (
                                <span className="font-bold text-emerald-500 uppercase">{name.substring(0, 2)}</span>
                              )}
                            </div>
                            <span className="font-bold text-foreground">{name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail size={14} />
                            {member.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30">
                            {member.role || 'Admin'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Kelola
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB CONTENT: LOGS */}
        {activeTab === 'logs' && (
          <div className="flex flex-col h-full flex-1">
            {/* Search Bar for Logs */}
            <div className="p-4 border-b border-border bg-card flex items-center">
              <Input
                placeholder="Cari berdasarkan aksi, email, atau entitas..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="max-w-md bg-background"
              />
            </div>

            <div className="p-0 overflow-x-auto flex-1">
              {isLoadingLogs ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
                  <Activity size={32} className="mb-4 opacity-50 text-cyan-500" />
                  <p>Memuat log aktivitas perusahaan...</p>
                </div>
              ) : filteredLogs?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Box size={32} className="mb-4 opacity-50" />
                  <p>Tidak ada log aktivitas yang ditemukan.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-foreground/5 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-bold">Waktu (WIB)</th>
                      <th className="px-6 py-4 font-bold">Aktor / Pengguna</th>
                      <th className="px-6 py-4 font-bold">Aktivitas Utama</th>
                      <th className="px-6 py-4 font-bold">Entitas Terdampak</th>
                      <th className="px-6 py-4 font-bold">Rincian Informasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs?.map((log: any) => {
                      const avatar = getUserAvatar(log.user);
                      const name = getUserName(log.user);
                      return (
                        <tr key={log.id} className="hover:bg-foreground/5 transition-colors group">
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                              <Clock size={14} className="text-cyan-500" />
                              {new Date(log.createdAt).toLocaleString('id-ID', { 
                                day: 'numeric', month: 'short', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {avatar ? (
                                  <Image src={avatar} alt={name} width={32} height={32} className="object-cover w-full h-full" />
                                ) : (
                                  <span className="font-bold text-xs text-cyan-500 uppercase">{name.substring(0, 2)}</span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm line-clamp-1">{name}</span>
                                <span className="text-[10px] text-muted-foreground">{log.user?.email || 'Sistem'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 border-border font-medium text-[11px] uppercase tracking-wider">
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">{log.entityType}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">ID: {log.entityId.substring(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-start gap-2">
                              <ChevronRight size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              {parseLogDetails(log)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
