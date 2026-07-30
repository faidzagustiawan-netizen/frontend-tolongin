import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StageView, stagesService } from '@/services/stages.service';

/**
 * Jeda penyegaran keadaan tahap dari server.
 *
 * Hitungan detik di layar berjalan sendiri supaya angkanya mulus, tetapi angka
 * itu tidak boleh menjadi satu-satunya sumber: jam peramban bisa digeser, dan
 * tahap bisa terbuka karena hal yang terjadi di luar tab ini — nilai keluar,
 * perusahaan meloloskan. Penyegaran berkala menyamakan keduanya kembali.
 */
const SYNC_INTERVAL_MS = 30_000;

export type StageGate = {
  stages: StageView[];
  isLoading: boolean;
  error: string | null;
  /** Tahap yang sedang dikerjakan, bila ada. */
  activeStage: StageView | null;
  /** Sisa detik tahap aktif, dihitung turun dari jawaban server. */
  remainingSeconds: number | null;
  /**
   * Tahap yang hitungannya baru saja mencapai nol.
   *
   * Dilaporkan sebagai nilai, bukan lewat callback, supaya pemanggil bisa
   * menanggapinya di dalam efeknya sendiri — pengumpulan otomatis membutuhkan
   * fungsi yang baru terdefinisi jauh setelah hook ini dipanggil.
   */
  expiredSectionId: string | null;
  refresh: () => Promise<void>;
  startStage: (sectionId: string) => Promise<void>;
};

/** Menjaga keadaan tahap tetap selaras dengan server. */
export function useStageGate(
  enrollmentId: string | null,
  options: { enabled?: boolean } = {},
): StageGate {
  const { enabled = true } = options;

  const [stages, setStages] = useState<StageView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiredSectionId, setExpiredSectionId] = useState<string | null>(null);

  // Titik acuan hitungan: sisa detik dari server beserta saat penerimaannya.
  // Menyimpan `expiresAt` apa adanya akan membuat hitungan ikut salah bila jam
  // peramban tidak sinkron dengan jam server.
  const [countdown, setCountdown] = useState<{
    sectionId: string;
    seconds: number;
  } | null>(null);

  const activeStage = useMemo(
    () => stages.find((s) => s.status === 'IN_PROGRESS') ?? null,
    [stages],
  );

  const refresh = useCallback(async () => {
    if (!enrollmentId || !enabled) return;

    try {
      const next = await stagesService.getStages(enrollmentId);
      setStages(next);
      setError(null);

      const running = next.find((s) => s.status === 'IN_PROGRESS');
      setCountdown(
        running && running.remainingSeconds !== null
          ? { sectionId: running.sectionId, seconds: running.remainingSeconds }
          : null,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat keadaan tahap.',
      );
    }
  }, [enrollmentId, enabled]);

  useEffect(() => {
    if (!enrollmentId || !enabled) return;

    let cancelled = false;
    setIsLoading(true);

    void refresh().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    const timer = setInterval(() => void refresh(), SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enrollmentId, enabled, refresh]);

  // Hitungan mundur di layar. Hanya tampilan — penolakan pengumpulan yang
  // sebenarnya terjadi di server, dibandingkan dengan `expiresAt` di basis data.
  useEffect(() => {
    if (!countdown) return;

    const timer = setInterval(() => {
      setCountdown((prev) =>
        prev ? { ...prev, seconds: Math.max(0, prev.seconds - 1) } : prev,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown?.sectionId]);

  // Habisnya waktu dilaporkan sekali per tahap. Tanpa perbandingan dengan nilai
  // sebelumnya, setiap detak sesudah nol akan memicu pengumpulan otomatis lagi.
  useEffect(() => {
    if (!countdown || countdown.seconds > 0 || !activeStage) return;
    setExpiredSectionId((prev) =>
      prev === activeStage.sectionId ? prev : activeStage.sectionId,
    );
  }, [countdown, activeStage]);

  const startStage = useCallback(
    async (sectionId: string) => {
      if (!enrollmentId) return;

      try {
        const stage = await stagesService.startStage(enrollmentId, sectionId);
        setExpiredSectionId(null);
        setStages((prev) =>
          prev.map((s) => (s.sectionId === sectionId ? stage : s)),
        );
        setCountdown(
          stage.remainingSeconds !== null
            ? { sectionId, seconds: stage.remainingSeconds }
            : null,
        );
      } catch (err: any) {
        // Alasan penolakan datang dari server dan sudah berbentuk kalimat siap
        // tampil — misalnya nilai kandidat berikut ambangnya.
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Tahap ini belum bisa dimulai.',
        );
        await refresh();
      }
    },
    [enrollmentId, refresh],
  );

  return {
    stages,
    isLoading,
    error,
    activeStage,
    remainingSeconds: countdown?.seconds ?? null,
    expiredSectionId,
    refresh,
    startStage,
  };
}

/**
 * Memicu pengumpulan otomatis ketika waktu tahap habis.
 *
 * Berupa komponen tersendiri karena efeknya harus berjalan setelah fungsi
 * pengumpulan terdefinisi — di halaman ruang kerja, fungsi itu baru ada jauh di
 * bawah `return` awal untuk keadaan memuat, sehingga sebuah `useEffect` di sana
 * akan melanggar urutan hook.
 */
export function StageExpiryWatcher({
  expiredSectionId,
  onExpire,
}: {
  expiredSectionId: string | null;
  onExpire: () => void;
}): null {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!expiredSectionId || firedRef.current === expiredSectionId) return;
    firedRef.current = expiredSectionId;
    onExpire();
  }, [expiredSectionId, onExpire]);

  return null;
}
