import React, { useState } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { Input, Textarea } from '@/components/common/Input';
import { CreateChallengePayload } from '@/services/challenges.service';
import { CategoryPicker } from '@/components/common/CategoryPicker';
import {
  DIFFICULTY_OPTIONS,
  DIFFICULTY_SHORT_LABELS,
  categoryLabel as toCategoryLabel,
} from './options';

interface BasicsFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

const selectClass =
  'w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold';

/**
 * Langkah pertama penyusunan: hanya identitas studi kasusnya.
 *
 * Sebelumnya satu layar "Informasi Umum" memuat judul, jadwal, aset, rubrik
 * penilaian, dan enam saklar pengawasan sekaligus — sekitar lima belas kolom
 * sebelum pengguna sempat menulis satu soal pun. Yang di sini tinggal hal yang
 * memang sudah diketahui perusahaan saat membuka formulir.
 *
 * Bidang dan tingkat kesulitan sudah dijawab di layar pembuka, jadi di sini
 * keduanya tampil sebagai konteks — bukan ditanyakan ulang dengan daftar enam
 * pilihan yang sama persis. Sebuah pilihan menampilkan seluruh opsinya sekali,
 * saat memilih; sesudah itu ia berhenti jadi kontrol. Menanyakannya dua kali
 * tidak menambah informasi, cuma membuka kesempatan jawabannya menyimpang.
 */
export default function BasicsForm({ manualData, setManualData }: BasicsFormProps) {
  const [isEditingContext, setIsEditingContext] = useState(false);

  const categoryLabel = toCategoryLabel(manualData.category);
  const difficultyLabel =
    DIFFICULTY_SHORT_LABELS[manualData.difficulty] ?? manualData.difficulty;

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

      {/* Posisi yang direkrut. Dulu ditanyakan di layar pembuka lalu dibuang —
          hanya dipakai menyemai judul. Padahal inilah yang perusahaan tahu
          persis dan yang kandidat cari; kategori cuma keranjang bank soal. */}
      <Input
        label="Posisi yang Dicari"
        placeholder="Contoh: Frontend Engineer, Video Editor, Staf Akuntansi"
        value={manualData.role ?? ''}
        onChange={(e) => setManualData({ ...manualData, role: e.target.value })}
      />

      <div className="bg-background border border-border rounded-2xl p-4">
        {!isEditingContext ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                Bidang
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-bold">
                {categoryLabel}
              </span>
              <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-sm font-bold">
                {difficultyLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingContext(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Ubah
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryPicker
              id="basics-category"
              label="Bidang Pekerjaan"
              value={manualData.category ?? ''}
              onChange={(category) =>
                setManualData((prev) => ({ ...prev, category }))
              }
              helperText={
                manualData.category
                  ? undefined
                  : 'Dikosongkan berarti lintas bidang — bank soal akan menawarkan soal soft skill, situasional, dan wawancara.'
              }
            />

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
                onChange={(e) =>
                  setManualData({ ...manualData, difficulty: e.target.value as any })
                }
                className={selectClass}
                required
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditingContext(false)}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
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
