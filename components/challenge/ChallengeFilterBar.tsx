import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface Category {
  id: string;
  name: string;
}

interface Difficulty {
  id: string;
  name: string;
}

interface ChallengeFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (val: string) => void;
  categories: Category[];
  difficulties: Difficulty[];
}

export const ChallengeFilterBar = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  categories,
  difficulties
}: ChallengeFilterBarProps) => {
  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1">
          <Input
            type="text"
            placeholder="Cari judul, nama perusahaan mitra, atau teknologi spesifik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-5 w-5" />}
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
          >
            {difficulties.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {(search || selectedCategory || selectedDifficulty) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedDifficulty('');
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 flex-shrink-0"
              title="Reset Filter"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
