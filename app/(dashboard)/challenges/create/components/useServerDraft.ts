import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CreateChallengePayload,
  challengesService,
  mergeServerSectionIds,
} from '@/services/challenges.service';

export type ServerDraftState = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

/** Jeda sesudah ketukan terakhir sebelum draf dikirim ke server. */
const DEBOUNCE_MS = 4000;

export type ServerDraft = {
  state: ServerDraftState;
  savedAt: Date | null;
  error: string | null;
  /** Menyimpan sekarang juga, tanpa menunggu jeda. */
  saveNow: () => Promise<void>;
};

/**
 * Menyimpan pekerjaan ke server sebagai DRAFT, otomatis.
 *
 * Sebelumnya seluruh formulir enam langkah hanya hidup di localStorage satu
 * peramban. Menutup tab bukan masalah, tetapi berganti perangkat, membersihkan
 * data peramban, atau memakai mode penyamaran berarti pekerjaan setengah jam
 * hilang tanpa jejak — dan tidak ada satu pun tanda di layar yang memberi tahu
 * bahwa risikonya ada.
 *
 * Draf yang sama dipakai ulang lewat `challengeId`, bukan membuat baris baru
 * tiap penyimpanan, sehingga percobaan berulang tidak menghabiskan kuota paket.
 */
export function useServerDraft(
  manualData: CreateChallengePayload,
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>,
  options: { enabled: boolean; allowCreate?: boolean },
): ServerDraft {
  /**
   * Bolehkah autosave membuat studi kasus baru bila `manualData.id` kosong?
   *
   * Halaman pembuatan memang butuh itu. Halaman penyuntingan tidak: di sana id
   * yang hilang berarti pemuatan gagal, dan `create()` yang tetap berjalan
   * menerbitkan duplikat diam-diam yang memakan kuota paket — persis yang sudah
   * dicegah di jalur simpan manual. Karena itu bawaannya `true` demi halaman
   * pembuatan, dan halaman penyuntingan mematikannya secara tegas.
   */
  const allowCreate = options.allowCreate ?? true;
  const [state, setState] = useState<ServerDraftState>('IDLE');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Perbandingan dilakukan atas isi, bukan identitas objek: setiap ketukan
  // membuat objek baru, jadi menyimpan tiap perubahan referensi akan mengirim
  // permintaan tanpa henti.
  const lastSavedRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const isReady =
    options.enabled &&
    (allowCreate || !!manualData.id) &&
    !!manualData.title?.trim() &&
    !!manualData.summary?.trim() &&
    !!manualData.description?.trim() &&
    // Studi kasus yang sudah terbit atau diarsipkan ditolak backend; tidak ada
    // gunanya mencoba menyimpannya berulang di latar belakang.
    manualData.status !== 'PUBLISHED' &&
    manualData.status !== 'CLOSED';

  const persist = useCallback(async () => {
    if (!isReady || inFlightRef.current) return;

    const snapshot = JSON.stringify({ ...manualData, status: 'DRAFT' });
    if (snapshot === lastSavedRef.current) return;

    inFlightRef.current = true;
    setState('SAVING');
    setError(null);

    try {
      const payload = { ...manualData, status: 'DRAFT' as const };

      const { data } = manualData.id
        ? await challengesService.update(manualData.id, payload)
        : await challengesService.create(payload);

      // Id disimpan ke state supaya penyimpanan berikutnya memperbarui baris
      // yang sama. Tanpa ini tiap autosave membuat challenge baru dan kuota
      // paket habis dalam hitungan menit.
      const nextId = data?.id ?? manualData.id;

      // Id tahap juga disalin balik, dengan alasan sejenis satu tingkat lebih
      // dalam: tahap tanpa id diperlakukan backend sebagai tahap baru, jadi
      // seluruh id berganti tiap simpan dan syarat masuk antar-tahap — yang
      // menunjuk tahap lain lewat id — ikut membusuk.
      const nextSections = mergeServerSectionIds(manualData.sections, data?.sections);

      if (nextId !== manualData.id || nextSections !== manualData.sections) {
        setManualData((prev) => ({ ...prev, id: nextId, sections: nextSections }));
      }

      // Penanda ikut membawa id barunya. Kalau tidak, penambahan id itu sendiri
      // terbaca sebagai perubahan dan memicu satu PATCH mubazir beberapa detik
      // kemudian.
      lastSavedRef.current =
        nextId === manualData.id && nextSections === manualData.sections
          ? snapshot
          : JSON.stringify({
              ...manualData,
              id: nextId,
              sections: nextSections,
              status: 'DRAFT',
            });

      setSavedAt(new Date());
      setState('SAVED');
    } catch (err: any) {
      setError(err?.message || 'Draf gagal disimpan ke server.');
      setState('ERROR');
    } finally {
      inFlightRef.current = false;
    }
  }, [isReady, manualData, setManualData]);

  useEffect(() => {
    if (!isReady) return;

    const timer = setTimeout(() => void persist(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isReady, persist]);

  return { state, savedAt, error, saveNow: persist };
}
