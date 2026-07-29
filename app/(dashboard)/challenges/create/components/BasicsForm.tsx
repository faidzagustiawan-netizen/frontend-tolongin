import React from 'react';
import { FileText } from 'lucide-react';
import { Input, Textarea } from '@/components/common/Input';
import { CreateChallengePayload } from '@/services/challenges.service';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from './options';

interface BasicsFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

/**
 * Langkah pertama penyusunan: hanya identitas studi kasusnya.
 *
 * Sebelumnya satu layar "Informasi Umum" memuat judul, jadwal, aset, rubrik
 * penilaian, dan enam saklar pengawasan sekaligus — sekitar lima belas kolom
 * sebelum pengguna sempat menulis satu soal pun. Yang di sini tinggal hal yang
 * memang sudah diketahui perusahaan saat membuka formulir.
 */
export default function BasicsForm({ manualData, setManualData }: BasicsFormProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">Informasi Dasar</h3>
          <p className="text-sm text-muted-foreground">
            Judul dan penjelasan yang akan dibaca kandidat di direktori.
          </p>
        </div>
      </div>

      <Input
        label="Judul Studi Kasus"
        placeholder="Contoh: Implementasi Payment Gateway Berbasis Microservices"
        value={manualData.title}
        onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="basics-category"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Kategori Pekerjaan
          </label>
          <select
            id="basics-category"
            value={manualData.category}
            onChange={(e) => setManualData({ ...manualData, category: e.target.value as any })}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="basics-difficulty"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Tingkat Kesulitan
          </label>
          <select
            id="basics-difficulty"
            value={manualData.difficulty}
            onChange={(e) => setManualData({ ...manualData, difficulty: e.target.value as any })}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Textarea
        label="Ringkasan Pendek (Summary)"
        placeholder="Deskripsi singkat yang akan muncul di card direktori..."
        value={manualData.summary}
        onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
        rows={2}
        required
      />

      <Textarea
        label="Deskripsi Lengkap & Instruksi"
        placeholder="Gunakan Markdown untuk membuat poin-poin latar belakang, objektif, dan persyaratan teknis..."
        value={manualData.description}
        onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
        rows={8}
        required
      />
    </div>
  );
}
