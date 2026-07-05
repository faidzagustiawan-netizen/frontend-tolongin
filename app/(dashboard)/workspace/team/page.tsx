'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '../../../../services/companies.service';
import { useUserStore } from '../../../../store/userStore';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Badge } from '../../../../components/common/Badge';
import { Input } from '../../../../components/common/Input';
import { Users, Activity, Copy, Check, Key } from 'lucide-react';
import toast from 'react-hot-toast';
export default function TeamWorkspacePage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'logs'>('members');

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
    onSuccess: (data) => {
      toast.success('Kode undangan berhasil diperbarui');
      // Update local storage or fetch profile if needed to show new code
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

  // Assuming inviteCode is attached to company profile (which we might need to fetch or might be in user context)
  const inviteCode = user?.profile?.inviteCode || '...';

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Kode disalin ke clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tim</h1>
          <p className="text-gray-500">
            Kelola akses karyawan dan pantau log aktivitas perusahaan Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 md:col-span-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
              <Key size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Kode Undangan</h3>
              <p className="text-sm text-gray-500">Untuk pendaftaran tim baru</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Input 
              value={inviteCode as string}
              readOnly 
              className="font-mono text-center tracking-widest text-lg bg-gray-50"
            />
            <Button
              variant="outline"
              onClick={copyToClipboard}
              title="Salin Kode"
            >
              {copied ? <Check className="text-green-600" size={20} /> : <Copy size={20} />}
            </Button>
          </div>
          <Button
            className="w-full mt-4"
            variant="outline"
            isLoading={generateCodeMutation.isPending}
            onClick={() => generateCodeMutation.mutate()}
          >
            Generate Kode Baru
          </Button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Peringatan: Generate ulang akan membuat kode lama tidak berlaku lagi.
          </p>
        </Card>

        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              className={`px-4 py-4 border-b-2 font-medium flex items-center space-x-2 ${
                activeTab === 'members' ? 'border-primary-600 text-primary-600 bg-primary-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={20} />
              <span>Anggota Tim</span>
            </button>
            <button
              className={`px-4 py-4 border-b-2 font-medium flex items-center space-x-2 ${
                activeTab === 'logs' ? 'border-primary-600 text-primary-600 bg-primary-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              <Activity size={20} />
              <span>Log Aktivitas</span>
            </button>
          </div>

          <div className="p-0">
            {activeTab === 'members' && (
              <div className="divide-y divide-gray-100">
                {isLoadingMembers ? (
                  <div className="p-8 text-center text-gray-500">Memuat anggota tim...</div>
                ) : teamMembers?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Belum ada anggota tim.</div>
                ) : (
                  teamMembers?.map((member: any) => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                          {member.user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user.email}</p>
                          <p className="text-sm text-gray-500">
                            Bergabung {new Date(member.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="emerald">Admin</Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {isLoadingLogs ? (
                  <div className="p-8 text-center text-gray-500">Memuat log aktivitas...</div>
                ) : activityLogs?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Belum ada log aktivitas.</div>
                ) : (
                  activityLogs?.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start space-x-4">
                      <div className="mt-1 p-2 bg-gray-100 rounded-full text-gray-600">
                        <Activity size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          User: <span className="font-medium">{log.user?.email || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {log.entityType} ID: {log.entityId}
                        </p>
                        {log.details && (
                          <div className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
