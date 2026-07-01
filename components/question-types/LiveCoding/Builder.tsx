import React from 'react';
import { BuilderProps } from '../types';

export default function LiveCodingBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="pt-2 space-y-4">
      <div>
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Bahasa Pemrograman Default</label>
        <select 
          value={comp.metadata?.language || 'javascript'} 
          onChange={(e) => onChange('metadata', { ...comp.metadata, language: e.target.value })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="java">Java</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 font-bold mb-2 block uppercase tracking-wider">Kode Awal (Template)</label>
        <textarea 
          value={comp.metadata?.initialCode || ''}
          onChange={(e) => onChange('metadata', { ...comp.metadata, initialCode: e.target.value })}
          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
          rows={6}
          placeholder="// Tuliskan kode awal yang akan dilihat pengguna..."
        />
      </div>
    </div>
  );
}
