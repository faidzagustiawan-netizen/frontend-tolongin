import React from 'react';
import { BuilderProps } from '../types';

export default function VideoRecordingBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2">
      <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Maks. Durasi (Menit)</label>
      <input 
        type="number"
        value={comp.metadata?.maxDurationMinutes || ''}
        onChange={(e) => onChange('metadata', { ...comp.metadata, maxDurationMinutes: parseInt(e.target.value) || null })}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="Contoh: 3"
      />
    </div>
  );
}
