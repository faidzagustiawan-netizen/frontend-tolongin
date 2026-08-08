'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Pencil, Plus, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Experience, ExperienceModal } from '@/components/profile/ExperienceModal';

export default function ExperiencesSettingsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: profileData, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => authService.getProfile(user?.id!),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileData?.data?.talentProfile?.experiences) {
      setExperiences(profileData.data.talentProfile.experiences);
    }
  }, [profileData]);

  /**
   * Simpan mengirim seluruh array pengalaman dan server menimpanya apa adanya.
   * Selama profil belum termuat `experiences` masih kosong, jadi menyimpan saat
   * itu akan mengirim array tanpa riwayat lama dan menghapusnya di server.
   */
  const isDataReady = !!profileData?.data && !isError;

  const handleUpdateProfile = async (newExperiences: Experience[]) => {
    try {
      await authService.updateProfile({ experiences: newExperiences });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Pengalaman berhasil diperbarui!');
    } catch (err: any) {
      toast.error('Gagal memperbarui pengalaman.');
      throw err;
    }
  };

  const handleSave = async (experience: Experience) => {
    if (!isDataReady) {
      // Dilempar, bukan ditelan: ExperienceModal menampilkan pesannya di dalam
      // modal sehingga pengguna tahu kenapa simpanannya tidak jadi.
      throw new Error('Riwayat pengalaman belum termuat. Muat ulang halaman sebelum menyimpan.');
    }

    const newArr = [...experiences];
    if (editingIndex !== null) {
      newArr[editingIndex] = experience;
    } else {
      newArr.push(experience);
    }

    // Server dulu, layar belakangan. `handleUpdateProfile` melempar saat gagal,
    // jadi entri yang ditolak server tidak pernah tertinggal di daftar.
    await handleUpdateProfile(newArr);
    setExperiences(newArr);
    setIsModalOpen(false);
  };

  /**
   * `ConfirmDialog` merender `Modal` dengan jebakan fokusnya sendiri, sementara
   * modal pengalaman juga menjebak fokus. Menumpuk keduanya membuat dua jebakan
   * aktif bersamaan, jadi modal pengalaman ditutup lebih dulu.
   */
  const handleDelete = async () => {
    if (editingIndex === null) return;
    setIsModalOpen(false);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (editingIndex === null || !isDataReady) return;

    const newArr = experiences.filter((_, i) => i !== editingIndex);
    setIsDeleting(true);
    try {
      await handleUpdateProfile(newArr);
      setExperiences(newArr);
      setIsConfirmDeleteOpen(false);
      setEditingIndex(null);
    } catch (_e: any) {
      // Toast galatnya sudah muncul dari handleUpdateProfile. Dialog sengaja
      // dibiarkan terbuka supaya kegagalannya terlihat.
    } finally {
      setIsDeleting(false);
    }
  };

  /** Entri yang sedang ditawar hapus, untuk menyebut namanya di dialog. */
  const pendingDelete = editingIndex !== null ? experiences[editingIndex] : null;

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  // Selama belum ada jawaban maupun galat, daftar kosong tidak boleh tampil:
  // itu yang dulu terbaca sebagai "Belum ada pengalaman."
  if (isLoading || (!profileData && !isError)) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-64 bg-foreground/5 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/settings')} className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Pengalaman</h1>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-foreground">Semua Pengalaman Anda</h2>
          <button
            onClick={handleAdd}
            disabled={!isDataReady}
            aria-label="Tambahkan pengalaman"
            title={isDataReady ? 'Tambahkan pengalaman' : 'Menunggu riwayat pengalaman termuat'}
            className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {isError ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>Riwayat pengalaman gagal dimuat. Ini bukan berarti riwayat Anda kosong.</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Menambah pengalaman dimatikan sementara supaya riwayat yang sudah ada tidak tertimpa.
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()} isLoading={isFetching}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Muat ulang
              </Button>
            </div>
          ) : experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pengalaman.</p>
          ) : (
            experiences.map((exp, index) => (
              <div key={index} className="flex justify-between items-start group py-2 border-b border-border/50 last:border-0">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold">{exp.companyName.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground text-lg">{exp.title}</h4>
                    <p className="text-foreground">
                      {exp.companyName} {exp.employmentType ? `· ${exp.employmentType}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.isCurrent ? 'Saat ini' : (exp.endDate ? new Date(exp.endDate).getFullYear() : 'Saat ini')}
                    </p>
                    {(exp.location || exp.locationType) && (
                      <p className="text-sm text-muted-foreground">
                        {[exp.location, exp.locationType].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {exp.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(index)} 
                  className="p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        experience={editingIndex !== null ? experiences[editingIndex] : null}
        onSave={handleSave}
        onDelete={editingIndex !== null ? handleDelete : undefined}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        destructive
        title="Hapus pengalaman ini?"
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        isBusy={isDeleting}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
      >
        <p>
          <strong>
            {pendingDelete?.title}
            {pendingDelete?.companyName ? ` di ${pendingDelete.companyName}` : ''}
          </strong>{' '}
          akan dihapus dari profil Anda, beserta tanggal, lokasi, dan deskripsinya.
        </p>
        <p className="text-muted-foreground">
          Tindakan ini tidak bisa dibatalkan. Pengalaman ini bisa ditambahkan lagi, tetapi
          isinya harus ditulis ulang.
        </p>
      </ConfirmDialog>
    </div>
  );
}
