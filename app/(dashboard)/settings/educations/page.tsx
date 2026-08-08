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
import { Education, EducationModal } from '@/components/profile/EducationModal';

export default function EducationsSettingsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [educations, setEducations] = useState<Education[]>([]);
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
    if (profileData?.data?.talentProfile?.educations) {
      setEducations(profileData.data.talentProfile.educations);
    }
  }, [profileData]);

  /**
   * Simpan mengirim seluruh array pendidikan dan server menimpanya apa adanya.
   * Selama profil belum termuat `educations` masih kosong, jadi menyimpan saat
   * itu akan mengirim array tanpa riwayat lama dan menghapusnya di server.
   */
  const isDataReady = !!profileData?.data && !isError;

  const handleUpdateProfile = async (newEducations: Education[]) => {
    try {
      await authService.updateProfile({ educations: newEducations });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Pendidikan berhasil diperbarui!');
    } catch (err: any) {
      toast.error('Gagal memperbarui pendidikan.');
      throw err;
    }
  };

  const handleSave = async (education: Education) => {
    if (!isDataReady) {
      // Dilempar, bukan ditelan: EducationModal menampilkan pesannya di dalam
      // modal sehingga pengguna tahu kenapa simpanannya tidak jadi.
      throw new Error('Riwayat pendidikan belum termuat. Muat ulang halaman sebelum menyimpan.');
    }

    const newArr = [...educations];
    if (editingIndex !== null) {
      newArr[editingIndex] = education;
    } else {
      newArr.push(education);
    }

    // Server dulu, layar belakangan. `handleUpdateProfile` melempar saat gagal,
    // jadi entri yang ditolak server tidak pernah tertinggal di daftar.
    await handleUpdateProfile(newArr);
    setEducations(newArr);
    setIsModalOpen(false);
  };

  /**
   * `ConfirmDialog` merender `Modal` dengan jebakan fokusnya sendiri, sementara
   * modal pendidikan juga menjebak fokus. Menumpuk keduanya membuat dua jebakan
   * aktif bersamaan, jadi modal pendidikan ditutup lebih dulu.
   */
  const handleDelete = async () => {
    if (editingIndex === null) return;
    setIsModalOpen(false);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (editingIndex === null || !isDataReady) return;

    const newArr = educations.filter((_, i) => i !== editingIndex);
    setIsDeleting(true);
    try {
      await handleUpdateProfile(newArr);
      setEducations(newArr);
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
  const pendingDelete = editingIndex !== null ? educations[editingIndex] : null;

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  // Selama belum ada jawaban maupun galat, daftar kosong tidak boleh tampil:
  // itu yang dulu terbaca sebagai "Belum ada pendidikan."
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
        <h1 className="text-2xl font-bold text-foreground">Pendidikan</h1>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-foreground">Semua Pendidikan Anda</h2>
          <button
            onClick={handleAdd}
            disabled={!isDataReady}
            aria-label="Tambahkan pendidikan"
            title={isDataReady ? 'Tambahkan pendidikan' : 'Menunggu riwayat pendidikan termuat'}
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
                <span>Riwayat pendidikan gagal dimuat. Ini bukan berarti riwayat Anda kosong.</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Menambah pendidikan dimatikan sementara supaya riwayat yang sudah ada tidak tertimpa.
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()} isLoading={isFetching}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Muat ulang
              </Button>
            </div>
          ) : educations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pendidikan.</p>
          ) : (
            educations.map((edu, index) => (
              <div key={index} className="flex justify-between items-start group py-2 border-b border-border/50 last:border-0">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold">{edu.school.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-foreground text-lg">{edu.school}</h4>
                    <p className="text-foreground">{edu.degree} {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                    <p className="text-sm text-muted-foreground">
                      {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Saat ini'}
                    </p>
                    {edu.grade && <p className="text-sm text-foreground/90 mt-1">Nilai: {edu.grade}</p>}
                    {edu.activities && <p className="text-sm text-foreground/90 mt-1">Aktivitas dan kegiatan sosial: {edu.activities}</p>}
                    {edu.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{edu.description}</p>}
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

      <EducationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        education={editingIndex !== null ? educations[editingIndex] : null}
        onSave={handleSave}
        onDelete={editingIndex !== null ? handleDelete : undefined}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        destructive
        title="Hapus pendidikan ini?"
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        isBusy={isDeleting}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
      >
        <p>
          <strong>
            {pendingDelete?.school}
            {pendingDelete?.degree ? ` — ${pendingDelete.degree}` : ''}
          </strong>{' '}
          akan dihapus dari profil Anda, beserta tanggal, nilai, aktivitas, dan deskripsinya.
        </p>
        <p className="text-muted-foreground">
          Tindakan ini tidak bisa dibatalkan. Pendidikan ini bisa ditambahkan lagi, tetapi
          isinya harus ditulis ulang.
        </p>
      </ConfirmDialog>
    </div>
  );
}
