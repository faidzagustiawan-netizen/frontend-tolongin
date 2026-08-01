'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Wrench } from 'lucide-react';
import { announcementsApi, type AnnouncementType } from '@/services/adminApi';

/**
 * Spanduk pengumuman aktif.
 *
 * Sisi admin sudah punya CMS untuk membuat pengumuman sejak lama, tetapi tidak
 * ada satu pun tempat yang menampilkannya — pengumumannya hanya masuk ke tabel
 * dan berhenti di sana.
 */

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
}

const STYLES: Record<AnnouncementType, { wrap: string; icon: React.ReactNode }> = {
  INFO: {
    wrap: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    icon: <Info className="w-4 h-4 text-blue-400" />,
  },
  WARNING: {
    wrap: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  },
  SUCCESS: {
    wrap: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  },
  MAINTENANCE: {
    wrap: 'bg-red-500/10 border-red-500/30 text-red-100',
    icon: <Wrench className="w-4 h-4 text-red-400" />,
  },
};

/** Kunci penyimpanan pengumuman yang sudah ditutup pembacanya. */
const DISMISSED_KEY = 'tolongin.dismissedAnnouncements';

function readDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());

    // Endpoint ini terbuka tanpa autentikasi, jadi kegagalannya tidak boleh
    // mengganggu apa pun: tanpa pengumuman, halaman tetap berjalan normal.
    announcementsApi
      .listActive()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const handleDismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Peramban yang memblokir localStorage tetap boleh menutup spanduknya
      // untuk sesi ini; hanya ingatannya yang hilang.
    }
  };

  const visible = items.filter((item) => !dismissed.includes(item.id));
  if (visible.length === 0) return null;

  return (
    <div className="w-full px-4 pt-4 space-y-2">
      {visible.map((item) => {
        const style = STYLES[item.type] ?? STYLES.INFO;
        return (
          <div
            key={item.id}
            role="status"
            className={`mx-auto max-w-7xl flex items-start gap-3 rounded-xl border px-4 py-3 ${style.wrap}`}
          >
            <span className="mt-0.5 shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-sm opacity-90 whitespace-pre-wrap">{item.content}</p>
            </div>
            <button
              onClick={() => handleDismiss(item.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Tutup pengumuman ${item.title}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
