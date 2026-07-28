'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ScanFace,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Users,
  Clock,
  Inbox,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ProfilRingkas {
  id: string;
  slug?: string | null;
  fullName: string;
  ktpNik?: string | null;
  user?: { email?: string };
}

interface BarisTinjauan extends ProfilRingkas {
  duplicateCheckDistance: number | null;
  duplicateCheckMatchId: string | null;
  faceAlignmentDegraded: boolean;
  faceVerificationStatus: string;
  createdAt: string;
  user?: { id?: string; email?: string; isBanned?: boolean };
  matchedProfile: ProfilRingkas | null;
}

function nikTersamar(nik?: string | null) {
  if (!nik) return '—';
  return `•••• •••• •••• ${nik.slice(-4)}`;
}

export default function AdminIdentityReviewsPage() {
  const { user } = useUserStore();
  const [antrean, setAntrean] = useState<BarisTinjauan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [sedangProses, setSedangProses] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const ambilAntrean = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      const res = await fetch(`${API_URL}/admin/identity-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat antrean');
      setAntrean(await res.json());
    } catch (err) {
      toast.error('Gagal memuat antrean tinjauan identitas');
    } finally {
      setMemuat(false);
    }
  }, [user, token]);

  useEffect(() => {
    ambilAntrean();
  }, [ambilAntrean]);

  const tuntaskan = async (talentId: string, approve: boolean) => {
    const label = approve
      ? 'MENYETUJUI profil ini (dinyatakan orang yang sah dan berbeda dari profil pembanding)'
      : 'MENOLAK profil ini (dinyatakan duplikat atau tidak cocok). Status menjadi FAILED dan acuan biometriknya dihapus';

    if (!confirm(`Anda akan ${label}. Lanjutkan?`)) return;

    setSedangProses(talentId);
    try {
      const res = await fetch(`${API_URL}/admin/identity-reviews/${talentId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve, note: catatan[talentId] || undefined }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan keputusan');

      toast.success(
        approve ? 'Profil disetujui dan kini terverifikasi.' : 'Profil ditolak.',
      );
      setAntrean((baris) => baris.filter((b) => b.id !== talentId));
    } catch (err) {
      toast.error('Gagal menyimpan keputusan. Coba lagi.');
    } finally {
      setSedangProses(null);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Halaman ini hanya untuk admin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <ScanFace className="h-6 w-6 text-emerald-500" />
          Tinjauan Identitas
        </h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
          Profil di sini berhenti di zona ragu — mesin tidak cukup yakin untuk memutuskan
          sendiri. Menolak orang yang sah jauh lebih mahal daripada meminta satu pemeriksaan
          manusia, jadi keputusannya diserahkan ke Anda.
        </p>
      </div>

      {memuat ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Memuat antrean…
        </div>
      ) : antrean.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Antrean kosong</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tidak ada identitas yang menunggu keputusan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {antrean.map((baris, i) => {
            const menungguAktivasi = baris.faceVerificationStatus === 'PENDING';
            const adaPembanding = !!baris.matchedProfile;

            return (
              <motion.div
                key={baris.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{baris.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {baris.user?.email} · NIK {nikTersamar(baris.ktpNik)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        menungguAktivasi
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {baris.faceVerificationStatus}
                    </span>
                    {baris.faceAlignmentDegraded && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-orange-500/10 border-orange-500/30 text-orange-400">
                        Kualitas foto rendah
                      </span>
                    )}
                  </div>
                </div>

                {/* Alasan masuk antrean, dijelaskan apa adanya */}
                <div className="bg-background border border-border rounded-xl p-4 text-xs leading-relaxed">
                  {adaPembanding ? (
                    <div className="flex gap-3">
                      <Users className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-foreground font-semibold">
                          Mirip dengan identitas lain yang sudah terdaftar
                        </p>
                        <p className="text-muted-foreground">
                          Pembanding: <span className="text-foreground">{baris.matchedProfile!.fullName}</span>{' '}
                          ({baris.matchedProfile!.user?.email}) · NIK{' '}
                          {nikTersamar(baris.matchedProfile!.ktpNik)}
                        </p>
                        <p className="text-muted-foreground">
                          Jarak biometrik{' '}
                          <span className="font-mono text-foreground">
                            {baris.duplicateCheckDistance?.toFixed(4) ?? '—'}
                          </span>
                          . Makin kecil makin mirip; di bawah 0,35 sistem menolak sendiri.
                        </p>
                        <p className="text-muted-foreground">
                          <b>Setujui</b> bila keduanya benar orang berbeda (kembar dan saudara
                          kandung memang bisa sedekat ini). <b>Tolak</b> bila ini orang yang sama
                          memakai dua akun.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <p className="text-foreground font-semibold">
                          Wajah dan foto KTP tidak cukup meyakinkan
                        </p>
                        <p className="text-muted-foreground">
                          Jarak biometrik{' '}
                          <span className="font-mono text-foreground">
                            {baris.duplicateCheckDistance?.toFixed(4) ?? '—'}
                          </span>{' '}
                          — di atas batas cocok otomatis 0,42 tetapi belum cukup jauh untuk
                          ditolak. Pasangan sah biasanya di bawah 0,39; pasangan orang berbeda
                          yang pernah terukur mulai dari 0,45.
                        </p>
                        <p className="text-muted-foreground">
                          Akun ini <b>belum aktif</b> sampai Anda memutuskan. <b>Setujui</b> bila
                          wajah pada selfie memang pemilik KTP tersebut.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Mendaftar {new Date(baris.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>

                <input
                  type="text"
                  value={catatan[baris.id] || ''}
                  onChange={(e) =>
                    setCatatan((c) => ({ ...c, [baris.id]: e.target.value }))
                  }
                  placeholder="Catatan keputusan (opsional, tersimpan di audit log)"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={sedangProses === baris.id}
                    onClick={() => tuntaskan(baris.id, false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    <ShieldX className="h-4 w-4" />
                    Tolak
                  </button>
                  <button
                    disabled={sedangProses === baris.id}
                    onClick={() => tuntaskan(baris.id, true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {menungguAktivasi ? 'Setujui & Aktifkan' : 'Setujui'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
