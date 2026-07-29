import React from 'react';
import { BuilderProps } from '../types';

export default function VideoRecordingBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2">
      <label className="text-xs text-muted-foreground font-bold mb-2 block uppercase tracking-wider">Maks. Durasi (Menit)</label>
      <input
        type="number"
        min={1}
        max={15}
        value={comp.metadata?.maxDurationMinutes || ''}
        onChange={(e) => onChange('metadata', { ...comp.metadata, maxDurationMinutes: parseInt(e.target.value) || null })}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="Contoh: 3"
      />
      {/* Durasi menentukan kualitas: perekam menurunkan bitrate agar hasilnya
          tetap muat batas unggah 25 MB, jadi durasi panjang berarti gambar
          lebih kasar. Perekaman berhenti sendiri saat batas ini tercapai. */}
      <p className="text-xs text-muted-foreground mt-2">
        Kosongkan untuk memakai 5 menit. Semakin panjang durasinya, semakin
        rendah kualitas gambar yang bisa dipertahankan agar berkasnya tetap muat.
      </p>
    </div>
  );
}
