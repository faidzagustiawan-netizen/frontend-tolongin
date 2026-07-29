import React from 'react';
import { CalendarClock, Paperclip } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import { CreateChallengePayload } from '@/services/challenges.service';

interface ScheduleAssetsFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

/**
 * Langkah kedua: kapan dibuka-ditutup, dan bahan apa yang dipegang kandidat.
 *
 * Dipisahkan dari informasi dasar karena sifatnya berbeda — keduanya opsional
 * dan sering baru diputuskan setelah soalnya jadi, sementara judul dan
 * deskripsi selalu diisi lebih dulu.
 */
export default function ScheduleAssetsForm({
  manualData,
  setManualData,
}: ScheduleAssetsFormProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">Jadwal</h3>
            <p className="text-sm text-muted-foreground">
              Kapan studi kasus ini dibuka dan ditutup untuk kandidat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <DateTimePicker
              label="Tanggal Mulai (Opsional)"
              value={manualData.startsAt}
              onChange={(isoString) => setManualData({ ...manualData, startsAt: isoString })}
              placeholder="Mulai segera setelah terbit..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              Kosongkan bila challenge langsung dibuka begitu diterbitkan.
            </p>
          </div>
          <div>
            <DateTimePicker
              label="Batas Akhir / Deadline Global"
              value={manualData.deadlineAt}
              onChange={(isoString) => setManualData({ ...manualData, deadlineAt: isoString })}
              placeholder="Tentukan batas akhir..."
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Menentukan kapan challenge ini ditutup secara keseluruhan.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <Paperclip className="h-6 w-6 text-cyan-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              Aset &amp; Sumber Daya
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Tautan yang dibutuhkan kandidat untuk mengerjakan. Wajib diisi bila
              AI menandai studi kasus Anda membutuhkan aset eksternal.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Input
            label="URL Dataset"
            placeholder="https://drive.google.com/... atau tautan CSV/JSON publik"
            value={manualData.datasetUrl || ''}
            onChange={(e) => setManualData({ ...manualData, datasetUrl: e.target.value })}
          />
          <Input
            label="URL Mock API"
            placeholder="https://api.contoh.com/mock atau koleksi Postman"
            value={manualData.mockApiUrl || ''}
            onChange={(e) => setManualData({ ...manualData, mockApiUrl: e.target.value })}
          />
          <Input
            label="URL Panduan Merek / Desain"
            placeholder="https://figma.com/file/... atau tautan brand guideline"
            value={manualData.brandGuidelineUrl || ''}
            onChange={(e) =>
              setManualData({ ...manualData, brandGuidelineUrl: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
