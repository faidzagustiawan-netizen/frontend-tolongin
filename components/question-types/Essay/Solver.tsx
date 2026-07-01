import React, { useState, useEffect } from 'react';
import { SolverProps } from '../types';

export default function EssaySolver({ comp, value, onChange }: SolverProps) {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onChange(val);
  };

  const wordCount = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  const charCount = text.length;

  const minWords = comp.metadata?.minWords;
  const maxLength = comp.metadata?.maxLength;

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={handleChange}
        rows={6}
        maxLength={maxLength || undefined}
        className="w-full bg-bg border border-border rounded-xl p-4 text-title focus:outline-none focus:border-cyan-500 transition-colors resize-y min-h-[150px]"
        placeholder="Tuliskan jawaban Anda di sini..."
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <div>
          {minWords && (
            <span className={wordCount < minWords ? 'text-red-400' : 'text-emerald-400'}>
              {wordCount} / {minWords} kata (Minimal)
            </span>
          )}
          {!minWords && <span>{wordCount} kata</span>}
        </div>
        <div>
          {maxLength && (
            <span>{charCount} / {maxLength} karakter</span>
          )}
          {!maxLength && <span>{charCount} karakter</span>}
        </div>
      </div>
    </div>
  );
}
