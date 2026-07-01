import React from 'react';
import { BuilderProps } from '../types';

export default function EssayBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2 flex gap-4">
      <div className="flex-1">
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Minimal Kata (Opsional)</label>
        <input 
          type="number"
          value={comp.metadata?.minWords || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, minWords: parseInt(e.target.value) || null })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Contoh: 100"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Maks. Karakter (Opsional)</label>
        <input 
          type="number"
          value={comp.metadata?.maxLength || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, maxLength: parseInt(e.target.value) || null })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="Contoh: 1000"
        />
      </div>
    </div>
  );
}
