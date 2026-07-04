import React from 'react';
import { Award, Globe } from 'lucide-react';

interface LeaderboardFilterBarProps {
  categories: string[];
  regions: string[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedRegion: string;
  setSelectedRegion: (val: string) => void;
}

export const LeaderboardFilterBar = ({
  categories,
  regions,
  selectedCategory,
  setSelectedCategory,
  selectedRegion,
  setSelectedRegion
}: LeaderboardFilterBarProps) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col w-full sm:w-auto gap-2">
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-cyan-400" /> Kategori Spesialisasi
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedCategory === cat 
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-full sm:w-auto gap-2 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-emerald-400" /> Region / Wilayah
        </label>
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground font-semibold focus:outline-none focus:border-emerald-500"
        >
          {regions.map(reg => (
            <option key={reg} value={reg}>{reg}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
