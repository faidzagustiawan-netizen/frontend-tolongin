import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, MapPin, Zap, User, CheckCircle2, Calendar, Globe, ChevronDown, Check, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { LeaderboardEntry } from '@/services/portfolios.service';

interface RankInfo {
  minLevel: number;
  maxLevel: number;
  name: string;
  color: string;
  border: string;
  bg: string;
}

interface LeaderboardTableProps {
  fullLeaderboard: LeaderboardEntry[];
  /** Sesi yang sedang masuk; `id` di sini adalah id `User`. */
  currentUser?: { id: string } | null;
  getRankInfo: (level: number) => RankInfo;
  categories?: string[];
  regions?: string[];
  selectedCategory?: string;
  setSelectedCategory?: (val: string) => void;
  selectedRegion?: string;
  setSelectedRegion?: (val: string) => void;
  hasPodium?: boolean;
}

const CategorySingleDropdown = ({
  categories,
  selectedCategory = 'All Roles',
  setSelectedCategory,
}: {
  categories: string[];
  selectedCategory?: string;
  setSelectedCategory?: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayLabel = selectedCategory === 'All Roles' ? 'Semua Kategori' : selectedCategory;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button matching reference design */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer"
      >
        <span>Kategori: <span className="text-[#00BC7D]">{displayLabel}</span></span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu Card matching reference image */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D]"
            />
          </div>

          {/* Options List with Scrolldown */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (setSelectedCategory) setSelectedCategory(cat);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-[#00BC7D]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    {/* Green checkmark box on the LEFT */}
                    <div
                      className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#00BC7D] text-white shadow-sm'
                          : 'border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 group-hover:border-[#00BC7D]/50'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>

                    <span className="truncate">{cat === 'All Roles' ? 'Semua Kategori' : cat}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">Tidak ada kategori</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RegionSingleDropdown = ({
  regions,
  selectedRegion = 'Global',
  setSelectedRegion,
}: {
  regions: string[];
  selectedRegion?: string;
  setSelectedRegion?: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = regions.filter((reg) =>
    reg.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button matching Kategori design */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer"
      >
        <span>Region: <span className="text-[#00BC7D]">{selectedRegion}</span></span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card matching Kategori design */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari region..."
              className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D]"
            />
          </div>

          {/* Options List */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
            {filteredRegions.length > 0 ? (
              filteredRegions.map((reg) => {
                const isSelected = selectedRegion === reg;
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => {
                      if (setSelectedRegion) setSelectedRegion(reg);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-[#00BC7D]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    {/* Green checkmark box on the LEFT */}
                    <div
                      className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#00BC7D] text-white shadow-sm'
                          : 'border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 group-hover:border-[#00BC7D]/50'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>

                    <span className="truncate">{reg}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-gray-400">Tidak ada region</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LeaderboardTable = ({
  fullLeaderboard,
  currentUser,
  getRankInfo,
  categories,
  regions,
  selectedCategory,
  setSelectedCategory,
  selectedRegion,
  setSelectedRegion,
  hasPodium = true,
}: LeaderboardTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRegion]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(fullLeaderboard.length / ITEMS_PER_PAGE) || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = currentPage * ITEMS_PER_PAGE;
  let pageItems = fullLeaderboard.slice(startIndex, endIndex);

  if (currentPage === 1 && hasPodium) {
    pageItems = fullLeaderboard.slice(3, 10);
  }

  /**
   * `userId` adalah satu-satunya penghubung ke sesi.
   *
   * Sebelumnya baris ini juga memeriksa `talent.user?.email`, `talent.email`,
   * dan `talent.user?.id`. Tidak satu pun pernah dikirim: `getLeaderboard`
   * hanya memilih kolom publik `TalentProfile` dan tidak pernah menyertakan
   * relasi `user`. `talent.id` pun bukan padanan `currentUser.id` — yang satu
   * id `TalentProfile`, yang lain id `User`.
   */
  const isSameUser = (talent: LeaderboardEntry) =>
    Boolean(currentUser?.id) && talent.userId === currentUser!.id;

  const currentUserIndex = fullLeaderboard.findIndex(isSameUser);

  const isUserInCurrentPage = currentUserIndex >= startIndex && currentUserIndex < endIndex;
  const shouldShowPinnedUser = currentUserIndex !== -1 && !isUserInCurrentPage;
  const pinnedUser = shouldShowPinnedUser ? fullLeaderboard[currentUserIndex] : null;

  const renderRow = (talent: LeaderboardEntry, originalIndex: number, localIndex: number, isPinned = false) => {
    const rank = originalIndex + 1;
    const rankInfo = getRankInfo(talent.level || 1);
    const isCurrentUser = isSameUser(talent);

    return (
      <Link key={talent.id + (isPinned ? '-pinned' : '')} href={`/talents/${talent.slug || talent.userId}`} className="block">
        <motion.div
          layout={!isPinned}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: isPinned ? 0.2 : 0.2 + localIndex * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={`flex items-center justify-between p-4 sm:px-6 sm:py-4 rounded-2xl transition-all group relative overflow-hidden ${
            isCurrentUser 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500/40' 
              : 'bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800/80'
          }`}
        >
          <div className="absolute top-0 right-0 w-36 sm:w-48 h-full bg-gradient-to-l from-[#00BC7D]/12 via-[#00BC7D]/4 to-transparent pointer-events-none rounded-tr-2xl z-0" />
          
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <div className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-zinc-800">
              <span className="text-gray-700 dark:text-gray-300 text-sm font-bold">{rank}</span>
            </div>

            <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {talent.avatarUrl ? (
                <img src={talent.avatarUrl} alt={talent.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h4 className={`text-base font-bold transition-colors ${isCurrentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-[#00BC7D]'}`}>
                  {talent.fullName} {isCurrentUser && '(Anda)'}
                </h4>
                {talent.faceVerificationStatus === 'VERIFIED' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {talent.location || 'Global'}
                </span>
                <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${rankInfo.bg} ${rankInfo.border} ${rankInfo.color}`}>
                  {rankInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 ml-4 relative z-10">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Lvl:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{talent.level || 1}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold hidden sm:inline-block">XP:</span>
              <span className="text-[#00BC7D] font-bold text-lg flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-[#00BC7D] fill-[#00BC7D]" />
                {talent.xp || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  const marginTopClass = hasPodium 
    ? '-mt-20 sm:-mt-32 md:-mt-40' 
    : 'mt-0';

  return (
    <motion.div
      ref={tableRef}
      layout="position"
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`max-w-5xl mx-auto ${marginTopClass} relative z-30`}
    >
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-[32px] p-4 sm:p-6 shadow-2xl relative transition-colors">
        {/* Smooth Curved Notch / Arch tab matching reference image */}
        <div className="absolute -top-[17px] left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <svg width="96" height="18" viewBox="0 0 96 18" className="overflow-visible">
            {/* Filled curve background matching container background */}
            <path
              d="M 0 18 C 20 18, 28 2, 48 2 C 68 2, 76 18, 96 18 Z"
              className="fill-white dark:fill-black"
            />
            {/* Top border stroke matching container border */}
            <path
              d="M 0 18 C 20 18, 28 2, 48 2 C 68 2, 76 18, 96 18"
              className="stroke-gray-200 dark:stroke-gray-800 fill-none"
              strokeWidth="1.5"
            />
            {/* Center Dot */}
            <circle cx="48" cy="10" r="3" className="fill-gray-400 dark:fill-gray-500" />
          </svg>
        </div>

        {/* Top header: Title on Left, Filters on Right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2 sm:px-4 pt-1">
          <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100 flex-shrink-0">
            <Calendar className="h-5 w-5 text-[#00BC7D]" />
            <h3 className="font-semibold text-lg tracking-wide">Peringkat Talenta</h3>
          </div>

          {/* Filters section on the right */}
          {categories && setSelectedCategory && regions && setSelectedRegion && (
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <CategorySingleDropdown
                categories={categories}
                selectedCategory={selectedCategory as string}
                setSelectedCategory={setSelectedCategory}
              />
              <RegionSingleDropdown
                regions={regions}
                selectedRegion={selectedRegion as string}
                setSelectedRegion={setSelectedRegion}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 min-h-[160px] relative">
          <AnimatePresence mode="wait">
            {fullLeaderboard.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-center py-16 px-4 space-y-3"
              >
                <Filter className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-base text-gray-800 dark:text-gray-200 font-semibold">
                  Tidak ada talenta yang cocok dengan filter.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coba ubah filter kategori atau region Anda.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="data-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col gap-3"
              >
                <AnimatePresence>
                  {pageItems.map((talent: any, index: number) => {
                    const originalIndex = startIndex + (currentPage === 1 && hasPodium ? 3 : 0) + index;
                    return renderRow(talent, originalIndex, index, false);
                  })}

                  {shouldShowPinnedUser && pinnedUser && (
                    <motion.div
                      key="pinned-user-container"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {renderRow(pinnedUser, currentUserIndex, 0, true)}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 mb-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center ${
                                currentPage === page
                                  ? 'bg-[#00BC7D] text-white shadow-md'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
