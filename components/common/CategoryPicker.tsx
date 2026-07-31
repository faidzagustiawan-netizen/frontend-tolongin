'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, Plus, Search, Sparkles } from 'lucide-react';
import {
  CategoryResolution,
  SkillRef,
  skillsService,
} from '@/services/skills.service';

interface CategoryPickerProps {
  /** Nama bidang yang sedang dipilih; kosong berarti belum diisi. */
  value: string;
  onChange: (categoryName: string) => void;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

/**
 * Pemilih bidang pekerjaan yang boleh diisi sendiri.
 *
 * Menggantikan `<select>` berisi enam pilihan tetap. Enam itu adalah taksonomi
 * bank soal, bukan daftar pekerjaan yang boleh direkrut: perusahaan yang
 * mencari Video Editor atau Akuntan terpaksa mengaku salah satu bidang yang
 * bukan bidangnya, dan bidang baru hanya bisa ditambahkan lewat migrasi basis
 * data.
 *
 * Sekarang saran diambil dari direktori keahlian — sumber yang sama dengan
 * keahlian di profil talenta, sehingga "Backend Development" yang dicari
 * perusahaan adalah baris yang persis sama dengan yang tercantum di profil
 * kandidat. Ketikan yang tidak ada di direktori dikirim ke
 * `skillsService.resolveCategory`, yang membedakan tiga hal: salah ketik dari
 * bidang yang sudah ada, bidang baru yang sah (langsung ditambahkan), dan teks
 * yang sama sekali bukan bidang pekerjaan.
 */
export const CategoryPicker = ({
  value,
  onChange,
  label = 'Bidang pekerjaan',
  id = 'category-picker',
  required,
  disabled,
  helperText,
}: CategoryPickerProps) => {
  const [term, setTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<SkillRef[]>([]);
  const [popular, setPopular] = useState<SkillRef[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState<CategoryResolution | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  useEffect(() => {
    skillsService
      .listCategories()
      .then(setPopular)
      .catch(() => setPopular([]));
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      skillsService
        .searchSkills(trimmed)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [term]);

  // Klik di luar menutup daftar. Tanpa ini daftar saran menggantung di atas
  // ruas berikutnya dan menghalangi pengisian formulir.
  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const options = term.trim().length >= 2 ? suggestions : popular;

  const commit = useCallback(
    (name: string) => {
      setTerm(name);
      setSuggestions([]);
      setFocusedIndex(-1);
      setIsOpen(false);
      setResolution(null);
      onChange(name);
    },
    [onChange],
  );

  /**
   * `force` dikirim hanya setelah perusahaan melihat usulan pembetulan dan
   * tetap memilih ketikannya sendiri — itu melewati pemeriksaan AI, bukan
   * pemeriksaan duplikat.
   */
  const resolve = useCallback(
    async (raw: string, force = false) => {
      const name = raw.trim();
      if (!name) {
        onChange('');
        setResolution(null);
        return;
      }

      // Sudah persis sama dengan yang tersimpan: tidak ada yang perlu
      // diperiksa, dan memanggil AI di sini berarti satu permintaan setiap kali
      // ruas ini kehilangan fokus.
      if (!force && name.toLowerCase() === value.trim().toLowerCase()) {
        setResolution(null);
        return;
      }

      setIsResolving(true);
      try {
        const result = await skillsService.resolveCategory(name, force);
        setResolution(result);

        if (result.status === 'EXACT' || result.status === 'CREATED') {
          commit(result.category.name);
        } else {
          // SUGGESTION dan REJECTED menunggu keputusan perusahaan; nilai lama
          // sengaja tidak ditimpa supaya draf tidak menyimpan bidang yang
          // belum disetujui siapa pun.
          setIsOpen(false);
        }
      } catch (error: any) {
        setResolution({
          status: 'REJECTED',
          input: name,
          suggestions: [],
          reason:
            error?.response?.data?.message ??
            'Bidang tidak bisa diperiksa sekarang. Coba lagi sebentar lagi.',
          aiChecked: false,
        });
      } finally {
        setIsResolving(false);
      }
    },
    [commit, onChange, value],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && options.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp' && options.length > 0) {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        commit(options[focusedIndex].name);
      } else {
        void resolve(term);
      }
      return;
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-muted-foreground mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="flex items-center bg-background border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500">
        <Search
          className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0"
          aria-hidden="true"
        />
        <input
          id={id}
          value={term}
          disabled={disabled}
          onChange={(event) => {
            setTerm(event.target.value);
            setFocusedIndex(-1);
            setIsOpen(true);
            setResolution(null);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => void resolve(term)}
          onKeyDown={handleKeyDown}
          placeholder="Contoh: Backend Development, Video Editor, Akuntan"
          className="w-full bg-transparent outline-none text-sm text-foreground font-semibold disabled:opacity-60"
          autoComplete="off"
        />
        {isResolving && (
          <Loader2
            className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0"
            aria-hidden="true"
          />
        )}
      </div>

      {helperText && !resolution && (
        <p className="text-xs text-muted-foreground mt-2">{helperText}</p>
      )}

      {isOpen && options.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto custom-scrollbar">
          {term.trim().length < 2 && (
            <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Paling sering dipakai
            </p>
          )}
          <div className="p-2 space-y-1">
            {options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => {
                  // Mendahului blur; tanpa ini `resolve` berjalan lebih dulu
                  // dan kliknya mengenai daftar yang sudah tertutup.
                  event.preventDefault();
                  commit(option.name);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex justify-between items-center ${
                  focusedIndex === index
                    ? 'bg-emerald-500/10 text-emerald-600 font-medium'
                    : 'hover:bg-foreground/5 text-foreground'
                }`}
              >
                <span>{option.name}</span>
                {option.name.toLowerCase() === value.trim().toLowerCase() ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {resolution?.status === 'SUGGESTION' && (
        <div className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{resolution.reason}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => commit(resolution.suggestion.name)}
              className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              Pakai &quot;{resolution.suggestion.name}&quot;
            </button>
            <button
              type="button"
              onClick={() => void resolve(resolution.input, true)}
              className="px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
            >
              Tetap pakai &quot;{resolution.input}&quot;
            </button>
          </div>
        </div>
      )}

      {resolution?.status === 'REJECTED' && (
        <div className="mt-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-2">
          <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{resolution.reason}</span>
          </p>
          {resolution.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resolution.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => commit(suggestion.name)}
                  className="px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {resolution?.status === 'CREATED' && (
        <p className="mt-2 text-xs text-emerald-600 flex items-start gap-2">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            &quot;{resolution.category.name}&quot; ditambahkan ke direktori dan
            siap dipakai perusahaan lain.
          </span>
        </p>
      )}
    </div>
  );
};
