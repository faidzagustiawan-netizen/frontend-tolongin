import React, { useState, useRef, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, Check, SlidersHorizontal, User, Building2 } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Category {
  id: string;
  name: string;
}

interface Difficulty {
  id: string;
  name: string;
}

interface Publisher {
  id: string;
  name: string;
}

interface ChallengeFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (val: string[]) => void;
  selectedDifficulties: string[];
  setSelectedDifficulties: (val: string[]) => void;
  selectedPublishers: string[];
  setSelectedPublishers: (val: string[]) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  categories: Category[];
  difficulties: Difficulty[];
  publishers: Publisher[];
}

// --- Hook ---
function useOnClickOutside(ref: React.RefObject<HTMLDivElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export const ChallengeFilterBar = ({
  search,
  setSearch,
  selectedCategories,
  setSelectedCategories,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedPublishers,
  setSelectedPublishers,
  sortBy,
  setSortBy,
  categories,
  difficulties,
  publishers
}: ChallengeFilterBarProps) => {
  
  // Dropdown States
  const [openSort, setOpenSort] = useState(false);
  const [openPublisher, setOpenPublisher] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openDifficulty, setOpenDifficulty] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState('');

  // Refs for click outside
  const sortRef = useRef<HTMLDivElement>(null);
  const pubRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const diffRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(sortRef, () => setOpenSort(false));
  useOnClickOutside(pubRef, () => setOpenPublisher(false));
  useOnClickOutside(catRef, () => setOpenCategory(false));
  useOnClickOutside(diffRef, () => setOpenDifficulty(false));

  const hasFilters = 
    selectedCategories.length < categories.length || 
    selectedDifficulties.length < difficulties.length || 
    selectedPublishers.length < publishers.length || 
    search !== '' || 
    sortBy !== 'TERBARU';

  const resetFilters = () => {
    setSearch('');
    setSelectedCategories(categories.map(c => c.id));
    setSelectedDifficulties(difficulties.map(d => d.id));
    setSelectedPublishers(publishers.map(p => p.id));
    setSortBy('TERBARU');
  };

  const getDifficultyColor = (diffId: string) => {
    switch (diffId) {
      case 'BEGINNER':
        return 'text-white bg-[#A16207] border-transparent';
      case 'INTERMEDIATE':
        return 'text-white bg-[#DB2777] border-transparent';
      case 'ADVANCED':
        return 'text-white bg-[#991B1B] border-transparent';
      default:
        return 'text-white bg-gray-500 border-transparent';
    }
  };

  const toggleArrayItem = (array: string[], setArray: (val: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const filteredCategoryOptions = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  const toggleSelectAllCategory = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };
  
  const toggleSelectAllDifficulty = () => {
    if (selectedDifficulties.length === difficulties.length) {
      setSelectedDifficulties([]);
    } else {
      setSelectedDifficulties(difficulties.map(d => d.id));
    }
  };

  const toggleSelectAllPublisher = () => {
    if (selectedPublishers.length === publishers.length) {
      setSelectedPublishers([]);
    } else {
      setSelectedPublishers(publishers.map(p => p.id));
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* --- Row 1: Search Bar --- */}
      <div className="w-full relative pt-10">
        <Input
          type="text"
          placeholder="Cari kata kunci: 'riset', 'ui/ux', atau nama perusahaan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-5 w-5" />}
          className="w-full text-base py-4 px-12 rounded-2xl bg-card border-2 border-border focus:border-[#1E7F4D] transition-colors shadow-sm"
        />
      </div>

      {/* --- Row 2: Filter Options --- */}
      <div className="w-full flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 pt-0 pb-1.5">
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full pt-0 pb-1.5">
          
          {/* SORT BY */}
          <div className="relative flex-shrink-0" ref={sortRef}>
            <button 
              onClick={() => setOpenSort(!openSort)}
              className="flex items-center gap-1.5 bg-card border border-border rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-muted/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-foreground">Diurutkan:</span>
              <span className="font-bold text-[#00BC7D]">{sortBy === 'TERBARU' ? 'Terbaru' : 'Terlama'}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground ml-0.5 transition-transform ${openSort ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openSort && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full mt-2 left-0 w-44 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 p-1.5 space-y-1"
                >
                  <button 
                    onClick={() => { setSortBy('TERBARU'); setOpenSort(false); }} 
                    className="w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 hover:bg-muted text-foreground transition-colors"
                  >
                    {sortBy === 'TERBARU' ? (
                      <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                    )}
                    <span>Terbaru</span>
                  </button>
                  <button 
                    onClick={() => { setSortBy('TERLAMA'); setOpenSort(false); }} 
                    className="w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 hover:bg-muted text-foreground transition-colors"
                  >
                    {sortBy === 'TERLAMA' ? (
                      <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                    )}
                    <span>Terlama</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-border flex-shrink-0 hidden lg:block mx-1"></div>

          {/* PUBLISHER (Dirilis Oleh) */}
          <div className="relative flex-shrink-0" ref={pubRef}>
            <button 
              onClick={() => setOpenPublisher(!openPublisher)}
              className="flex items-center gap-1.5 bg-card border border-border rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-muted/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-foreground">Dirilis oleh:</span>
              <span className="font-bold text-[#00BC7D]">
                {selectedPublishers.length === publishers.length || selectedPublishers.length === 0 
                  ? 'Semua Pihak' 
                  : selectedPublishers.length === 1 
                    ? (publishers.find(p => p.id === selectedPublishers[0])?.name || 'Semua Pihak')
                    : `${selectedPublishers.length} Pihak`}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground ml-0.5 transition-transform ${openPublisher ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openPublisher && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full mt-2 left-0 w-60 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 p-1.5"
                >
                  <div className="max-h-60 overflow-y-auto space-y-1 p-0.5">
                    {/* Select All Option */}
                    <div 
                      onClick={toggleSelectAllPublisher} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                    >
                      {selectedPublishers.length === publishers.length ? (
                        <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-xs">Semua Pihak</span>
                    </div>

                    {publishers.map((p) => {
                      const isSelected = selectedPublishers.includes(p.id);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => toggleArrayItem(selectedPublishers, setSelectedPublishers, p.id)} 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                        >
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                          )}
                          <span className="text-xs flex items-center gap-2">
                            {p.id === 'COMPANY' ? <Building2 className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4 text-[#00BC7D]" />}
                            {p.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CATEGORY (Kategori) */}
          <div className="relative flex-shrink-0" ref={catRef}>
            <button 
              onClick={() => setOpenCategory(!openCategory)}
              className="flex items-center gap-1.5 bg-card border border-border rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-muted/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-foreground">Kategori:</span>
              <span className="font-bold text-[#00BC7D]">
                {selectedCategories.length === categories.length 
                  ? 'Semua Kategori' 
                  : selectedCategories.length === 0 
                    ? 'Tidak Ada' 
                    : selectedCategories.length === 1 
                      ? (categories.find(c => c.id === selectedCategories[0])?.name || 'Semua Kategori')
                      : `${selectedCategories.length} Kategori`}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground ml-0.5 transition-transform ${openCategory ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openCategory && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full mt-2 left-0 md:left-auto md:right-auto w-[290px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col p-1.5"
                >
                  <div className="p-2 mb-1">
                    <input 
                      type="text" 
                      placeholder="Cari kategori..." 
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00BC7D] transition-colors"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-1 p-0.5">
                    {/* Select All Option */}
                    <div 
                      onClick={toggleSelectAllCategory} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                    >
                      {selectedCategories.length === categories.length ? (
                        <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-xs">Semua Kategori</span>
                    </div>

                    {filteredCategoryOptions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">Tidak ada kategori yang cocok</div>
                    ) : (
                      filteredCategoryOptions.map((c) => {
                        const isSelected = selectedCategories.includes(c.id);
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => toggleArrayItem(selectedCategories, setSelectedCategories, c.id)} 
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                          >
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                            )}
                            <span className="text-xs">{c.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LEVEL (Difficulty) */}
          <div className="relative flex-shrink-0" ref={diffRef}>
            <button 
              onClick={() => setOpenDifficulty(!openDifficulty)}
              className="flex items-center gap-1.5 bg-card border border-border rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-muted/50 transition-all cursor-pointer"
            >
              <span className="font-bold text-foreground">Level:</span>
              <span className="font-bold text-[#00BC7D]">
                {selectedDifficulties.length === difficulties.length 
                  ? 'Semua Level' 
                  : selectedDifficulties.length === 0 
                    ? 'Tidak Ada' 
                    : selectedDifficulties.length === 1 
                      ? (difficulties.find(d => d.id === selectedDifficulties[0])?.name || 'Semua Level')
                      : `${selectedDifficulties.length} Level`}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground ml-0.5 transition-transform ${openDifficulty ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDifficulty && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full mt-2 left-0 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col p-1.5"
                >
                  <div className="max-h-60 overflow-y-auto space-y-1 p-0.5">
                    {/* Select All Option */}
                    <div 
                      onClick={toggleSelectAllDifficulty} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                    >
                      {selectedDifficulties.length === difficulties.length ? (
                        <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                      )}
                      <span className="text-xs">Semua Level</span>
                    </div>

                    {difficulties.map((d) => {
                      const isSelected = selectedDifficulties.includes(d.id);
                      return (
                        <div 
                          key={d.id} 
                          onClick={() => toggleArrayItem(selectedDifficulties, setSelectedDifficulties, d.id)} 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted text-foreground font-semibold transition-colors"
                        >
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-md bg-[#00BC7D] text-white flex items-center justify-center flex-shrink-0">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                          )}
                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex-shrink-0 ${getDifficultyColor(d.id)}`}>
                            {d.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RESET FILTER BUTTON */}
        <div className="flex-shrink-0">
          <Button
            onClick={resetFilters}
            className={`px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap ${hasFilters ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted cursor-not-allowed opacity-70'}`}
            disabled={!hasFilters}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${hasFilters ? 'animate-spin-once' : ''}`} />
            <span className="hidden sm:inline">Reset Filter</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
