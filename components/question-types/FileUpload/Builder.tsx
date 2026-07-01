import React from 'react';
import { BuilderProps } from '../types';

export default function FileUploadBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2 flex gap-4">
      <div className="flex-1">
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Format File (Koma)</label>
        <input 
          type="text"
          value={comp.metadata?.allowedExtensions || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, allowedExtensions: e.target.value })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          placeholder="Contoh: pdf, docx, zip"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Maks. Ukuran (MB)</label>
        <input 
          type="number"
          value={comp.metadata?.maxSizeMb || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, maxSizeMb: parseInt(e.target.value) || null })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Maksimal 10 MB"
        />
      </div>
    </div>
  );
}
