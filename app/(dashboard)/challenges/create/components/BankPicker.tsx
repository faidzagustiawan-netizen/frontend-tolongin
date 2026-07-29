import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  Layers,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import {
  QuestionBankItem,
  QuestionBankScope,
  questionBankService,
} from '@/services/questionBank.service';
import {
  CATEGORY_OPTIONS,
  CATEGORY_SHORT_LABELS,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_SHORT_LABELS,
  ChallengeCategoryValue,
  ChallengeDifficultyValue,
} from './options';

const PAGE_SIZE = 12;

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Pilihan Ganda',
  ESSAY: 'Essay',
  LIVE_CODING: 'Live Coding',
  FILE_UPLOAD: 'Unggah Berkas',
  URL_SUBMISSION: 'Tautan URL',
  VIDEO_UPLOAD: 'Video / Audio',
};

const SCOPE_TABS: { key: QuestionBankScope; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PLATFORM', label: 'Bank platform' },
  { key: 'MINE', label: 'Koleksi saya' },
];

interface BankPickerProps {
  open: boolean;
  onClose: () => void;
  /** Kategori & level studi kasus, dipakai sebagai penyaring awal. */
  defaultCategory?: ChallengeCategoryValue;
  defaultDifficulty?: ChallengeDifficultyValue;
  /** Nama tahap tujuan, supaya jelas soalnya akan mendarat di mana. */
  targetSectionTitle: string;
  onAdd: (items: QuestionBankItem[]) => void;
}

/**
 * Penelusuran bank soal.
 *
 * Penyaring kategori dibuka dengan kategori studi kasus yang sedang disusun —
 * itulah inti "rekomendasi": perusahaan yang mencari Backend Engineer langsung
 * melihat soal Backend, bukan seluruh isi bank. Backend selalu menyertakan
 * soal lintas bidang (soft skill, wawancara, etika) pada penyaring kategori
 * mana pun, jadi keduanya muncul berdampingan.
 */
export default function BankPicker({
  open,
  onClose,
  defaultCategory,
  defaultDifficulty,
  targetSectionTitle,
  onAdd,
}: BankPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<QuestionBankScope>('ALL');
  const [category, setCategory] = useState<string>(defaultCategory ?? '');
  const [difficulty, setDifficulty] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, QuestionBankItem>>({});

  useEffect(() => setMounted(true), []);

  // Penyaring awal mengikuti studi kasus yang sedang disusun. Dijaga oleh
  // `open` supaya penyaring yang sudah diubah pengguna tidak ditimpa setiap
  // kali komponen induknya dirender ulang; kategori studi kasus sendiri hanya
  // bisa berubah di tab lain, yang tertutup selama panel ini terbuka.
  useEffect(() => {
    if (!open) return;
    setCategory(defaultCategory ?? '');
    setDifficulty(defaultDifficulty ?? '');
    setPage(1);
    setSelected({});
  }, [open, defaultCategory, defaultDifficulty]);

  // Pencarian ditunda agar tiap ketukan tombol tidak memicu satu permintaan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const { data: tags = [] } = useQuery({
    queryKey: ['question-bank-tags', scope],
    queryFn: () => questionBankService.getTags(scope),
    enabled: open,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'question-bank',
      scope,
      category,
      difficulty,
      type,
      selectedTagIds.join(','),
      search,
      page,
    ],
    queryFn: () =>
      questionBankService.getAll({
        scope,
        category: category || undefined,
        difficulty: difficulty || undefined,
        type: type || undefined,
        skillIds: selectedTagIds.length > 0 ? selectedTagIds.join(',') : undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: open,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const toggleItem = (item: QuestionBankItem) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
    setPage(1);
  };

  const handleAdd = () => {
    if (selectedList.length === 0) return;
    onAdd(selectedList);
    setSelected({});
    onClose();
  };

  if (!open || !mounted) return null;

  const panel = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Ambil soal dari bank"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex flex-col w-full h-full sm:h-[85vh] sm:max-w-5xl bg-background border border-border sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border bg-card">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
              Ambil soal dari bank
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Soal yang dipilih disalin ke tahap{' '}
              <strong className="text-foreground">{targetSectionTitle}</strong>{' '}
              dan bebas Anda sunting setelahnya.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 border-b border-border space-y-4 bg-card/50">
          <div className="flex flex-wrap items-center gap-2">
            {SCOPE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setScope(tab.key);
                  setPage(1);
                }}
                aria-pressed={scope === tab.key}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  scope === tab.key
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:bg-foreground/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari isi pertanyaan..."
                aria-label="Cari soal"
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Kategori"
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="">Semua kategori</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              aria-label="Tingkat kesulitan"
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="">Semua level</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {DIFFICULTY_SHORT_LABELS[option.value]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              aria-label="Format soal"
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="">Semua format</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Hanya penanda yang benar-benar terpakai yang ditawarkan; direktori
                skill memuat ribuan nama dan hampir semuanya tidak akan
                mengembalikan satu soal pun. */}
            {tags.slice(0, 14).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                aria-pressed={selectedTagIds.includes(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {tag.name}
                <span className="ml-1.5 opacity-60">{tag.questionCount}</span>
              </button>
            ))}

            {selectedTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                className="text-xs font-semibold text-primary underline underline-offset-4"
              >
                Bersihkan penanda
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              aria-busy="true"
            >
              <Loader2 className="h-8 w-8 animate-spin mb-4" aria-hidden="true" />
              <p className="text-sm">Memuat soal...</p>
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center py-16 text-center px-6"
            >
              <AlertCircle className="h-10 w-10 mb-3 text-danger" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Bank soal gagal dimuat
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {(error as any)?.message || 'Periksa koneksi Anda lalu coba lagi.'}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-muted-foreground">
              <Layers className="h-10 w-10 mb-3 opacity-40" aria-hidden="true" />
              <p className="text-foreground font-medium mb-1">
                Tidak ada soal yang cocok
              </p>
              <p className="text-sm max-w-md">
                Longgarkan penyaringnya, atau tutup panel ini dan susun soalnya
                sendiri.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const isSelected = !!selected[item.id];

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      aria-pressed={isSelected}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-border'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase tracking-wide border border-emerald-500/20">
                              {TYPE_LABELS[item.type] ?? item.type}
                            </span>
                            <span className="px-2 py-0.5 bg-foreground/5 text-muted-foreground text-[10px] font-bold rounded border border-border">
                              {item.category
                                ? CATEGORY_SHORT_LABELS[item.category] ?? item.category
                                : 'Lintas bidang'}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {DIFFICULTY_SHORT_LABELS[item.difficulty] ?? item.difficulty}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {item.defaultPoints} poin
                            </span>
                            {item.companyId && (
                              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/20">
                                Koleksi saya
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-foreground font-medium leading-relaxed">
                            {item.question}
                          </p>

                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag.skill.id}
                                  className="px-2 py-0.5 bg-foreground/5 text-muted-foreground text-[10px] rounded-full"
                                >
                                  {tag.skill.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Halaman {page} dari {totalPages} · {total} soal
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Pilihan bertahan saat berpindah halaman dan mengganti penyaring,
                jadi jumlahnya perlu terlihat — kalau tidak, soal yang dipilih di
                halaman sebelumnya seolah hilang. */}
            <span className="text-xs text-muted-foreground">
              {selectedList.length} dipilih
            </span>
            <Button
              onClick={handleAdd}
              disabled={selectedList.length === 0}
              className="flex-1 sm:flex-none font-bold"
            >
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              Tambahkan ke tahap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
