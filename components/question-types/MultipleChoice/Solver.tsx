import React from 'react';
import { SolverProps } from '../types';

export default function MultipleChoiceSolver({ comp, value, onChange }: SolverProps) {
  return (
    <div className="space-y-4">
      {(comp.options || []).map((opt: any, optIdx: number) => (
        <label 
          key={optIdx} 
          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
            value === opt.id 
              ? 'bg-cyan-500/10 border-cyan-500/50 text-title' 
              : 'bg-card border-border text-body hover:border-white/20'
          }`}
        >
          <input 
            type="radio" 
            name={`mc-${comp.question}`} 
            className="mt-1 w-5 h-5 text-cyan-500 focus:ring-cyan-500 bg-bg" 
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span className="flex-1 text-base">{opt.text}</span>
        </label>
      ))}
      {(!comp.options || comp.options.length === 0) && (
        <p className="text-red-400 italic">Pilihan jawaban belum diset di Builder.</p>
      )}
    </div>
  );
}
