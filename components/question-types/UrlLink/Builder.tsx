import React from 'react';
import { BuilderProps } from '../types';

export default function UrlLinkBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2">
      <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Domain yang Diizinkan (Opsional)</label>
      <input 
        type="text"
        value={comp.metadata?.expectedDomain || ''}
        onChange={(e) => onChange('metadata', { ...comp.metadata, expectedDomain: e.target.value })}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
        placeholder="Contoh: github.com atau figma.com"
      />
    </div>
  );
}
