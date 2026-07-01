import React from 'react';
import { SolverProps } from '../types';
import { Link as LinkIcon } from 'lucide-react';

export default function UrlLinkSolver({ comp, value, onChange }: SolverProps) {
  const expectedDomain = comp.metadata?.expectedDomain;
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <LinkIcon className="h-5 w-5 text-muted" />
        </div>
        <input 
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-bg border border-border rounded-xl pl-12 pr-4 py-4 text-title focus:outline-none focus:border-cyan-500 transition-colors"
          placeholder="https://..."
        />
      </div>
      {expectedDomain && (
        <p className="text-xs text-muted flex items-center gap-1">
          <span className="font-bold text-gray-400">Penting:</span> Pastikan tautan berasal dari domain <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{expectedDomain}</span>
        </p>
      )}
    </div>
  );
}
