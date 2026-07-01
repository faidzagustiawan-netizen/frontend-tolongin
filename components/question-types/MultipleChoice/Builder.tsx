import React from 'react';
import { BuilderProps } from '../types';
import { Trash2, Plus } from 'lucide-react';

export default function MultipleChoiceBuilder({ comp, onChange }: BuilderProps) {
  return (
    <div className="space-y-4 pt-2">
      <label className="text-xs text-gray-500 font-bold block uppercase tracking-wider">Pilihan Jawaban</label>
      <div className="space-y-3">
        {(comp.options || []).map((opt: any, optIdx: number) => (
          <div key={optIdx} className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center">
              <input 
                type="radio" 
                name={`correct-${Math.random()}`} 
                checked={opt.isCorrect} 
                onChange={() => {
                  const newOpts = [...(comp.options || [])];
                  newOpts.forEach((o: any) => o.isCorrect = false);
                  newOpts[optIdx].isCorrect = true;
                  onChange('options', newOpts);
                }}
                className="w-5 h-5 text-emerald-500 bg-bg border-gray-600 focus:ring-emerald-500 focus:ring-offset-dark-bg cursor-pointer peer"
              />
            </div>
            <input
              value={opt.text}
              onChange={(e) => {
                const newOpts = [...(comp.options || [])];
                newOpts[optIdx].text = e.target.value;
                onChange('options', newOpts);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newOpts = [...(comp.options || []), { id: Math.random().toString(), text: '', isCorrect: false }];
                  onChange('options', newOpts);
                }
              }}
              className={`flex-1 bg-bg/50 border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:border-emerald-500 ${
                opt.isCorrect ? 'border-emerald-500/50 text-white' : 'border-border text-gray-300'
              }`}
              placeholder={`Opsi ${optIdx + 1}`}
            />
            <button 
              onClick={() => {
                const newOpts = [...(comp.options || [])];
                newOpts.splice(optIdx, 1);
                if (opt.isCorrect && newOpts.length > 0) newOpts[0].isCorrect = true;
                onChange('options', newOpts);
              }}
              className="p-2.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="Hapus opsi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={() => {
          const newOpts = [...(comp.options || []), { id: Math.random().toString(), text: '', isCorrect: false }];
          onChange('options', newOpts);
        }}
        className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors py-2 px-1"
      >
        <Plus className="w-4 h-4" /> Tambah Opsi
      </button>
    </div>
  );
}
