import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, X, Search, Pencil, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { CategoryResolution, skillsService } from '../../services/skills.service';
import toast from 'react-hot-toast';

interface SkillsSectionProps {
  skills: string[];
  onUpdate: (skills: string[]) => Promise<void>;
  onRemoveSection?: () => Promise<void> | void;
  autoOpenAddModal?: boolean;
  onModalOpened?: () => void;
}

export const SkillsSection = ({ skills: initialSkills, onUpdate, onRemoveSection, autoOpenAddModal, onModalOpened }: SkillsSectionProps) => {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  /** Putusan pemeriksaan yang menunggu keputusan talenta (salah ketik / ditolak). */
  const [resolution, setResolution] = useState<CategoryResolution | null>(null);
  
  useEffect(() => {
    setSkills(initialSkills || []);
  }, [initialSkills]);

  // Dideklarasikan sebelum effect yang memakainya. Sebagai `const` arrow
  // function yang tadinya berada 20 baris di bawah, pemanggilan dari effect ini
  // masuk temporal dead zone dan melempar
  // `ReferenceError: Cannot access 'handleOpenAddModal' before initialization`
  // setiap kali `autoOpenAddModal` bernilai true pada render pertama — jalur
  // yang dipakai `autoOpenSection` dari halaman profil.
  const handleOpenAddModal = useCallback(() => {
    setSearchTerm('');
    setFocusedIndex(-1);
    setResolution(null);
    setIsAddModalOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAddModal();
      if (onModalOpened) onModalOpened();
    }
  }, [autoOpenAddModal, onModalOpened, handleOpenAddModal]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length >= 2) {
        try {
          const results = await skillsService.searchSkills(searchTerm);
          setSuggestions(results);
        } catch (e: any) {
          console.error('Failed to search skills', e.message || e.response?.data || e);
        }
      } else {
        setSuggestions([]);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleOpenEditListModal = () => {
    router.push('/settings/skills');
  };

  const handleSelectSuggestion = (skillName: string) => {
    setSearchTerm(skillName);
    setSuggestions([]);
    setFocusedIndex(-1);
    setResolution(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, suggestions.length - 1);
          document.getElementById(`suggestion-${next}`)?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          document.getElementById(`suggestion-${next}`)?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[focusedIndex].name);
        } else {
          handleSaveAdd();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveAdd();
    }
  };

  /** Menyimpan nama yang sudah pasti benar ke profil, lalu menutup modal. */
  const commitSkill = async (name: string) => {
    if (skills.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.error(`Keahlian "${name}" sudah ditambahkan di profil Anda`);
      setResolution(null);
      setIsSaving(false);
      return;
    }

    const newSkills = [...skills, name];
    setSkills(newSkills);
    await onUpdate(newSkills);

    setSearchTerm('');
    setSuggestions([]);
    setResolution(null);
    setIsSaving(false);
    setIsAddModalOpen(false);
  };

  /**
   * Keahlian diperiksa lebih dulu, tidak lagi dikirim mentah ke direktori.
   *
   * Sebelumnya baris ini memanggil `createSkill` tanpa syarat, sehingga
   * "Reactt" masuk direktori apa adanya. Sejak direktori yang sama juga
   * menyetir bidang pekerjaan yang dicari perusahaan, salah ketik dari layar
   * ini muncul sebagai pilihan bidang di sana — gerbang pemeriksaan yang
   * dipasang di sisi perusahaan bisa dilewati dari pintu ini.
   *
   * `force` dikirim ketika talenta sudah melihat usulan pembetulan dan tetap
   * memilih ketikannya sendiri.
   */
  const handleSaveAdd = async (force = false) => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      setIsAddModalOpen(false);
      return;
    }

    if (!force && skills.some(s => s.toLowerCase() === trimmedSearch.toLowerCase())) {
      toast.error(`Keahlian "${trimmedSearch}" sudah ditambahkan di profil Anda`);
      return;
    }

    setIsSaving(true);
    try {
      const result = await skillsService.resolveSkill(trimmedSearch, force);

      if (result.status === 'EXACT' || result.status === 'CREATED') {
        // Nama baku dari direktori yang dipakai, bukan ketikan mentahnya —
        // itulah yang membuat "Node.js" milik talenta cocok dengan "Node.js"
        // milik soal dan bidang pekerjaan.
        await commitSkill(result.category.name);
        return;
      }

      setResolution(result);
      setSuggestions([]);
      setIsSaving(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Keahlian tidak bisa diperiksa sekarang. Coba lagi sebentar lagi.',
      );
      setIsSaving(false);
    }
  };

  /**
   * Konfirmasinya dipegang halaman profil, bukan di sini.
   *
   * `window.confirm` diganti `ConfirmDialog`, dan `ConfirmDialog` merender
   * `Modal` — sementara tombol ini berada di dalam modal yang digulung tangan
   * pada z-index yang sama. Menumpuk keduanya membuat dua jebakan fokus aktif
   * bersamaan, jadi modal ini menutup diri lebih dulu dan dialognya muncul
   * sendirian di atas halaman.
   */
  const handleRemoveWholeSection = () => {
    setIsAddModalOpen(false);
    onRemoveSection?.();
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-display text-xl font-bold text-foreground">Keahlian</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenAddModal} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Tambah Keahlian">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={handleOpenEditListModal} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Edit Keahlian">
            <Pencil className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <div key={index} className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-full px-4 py-1.5">
            <span className="text-sm font-medium text-foreground">{skill}</span>
          </div>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada keahlian yang ditambahkan.</p>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col min-h-[550px] max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Tambahkan keahlian</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <p className="text-xs text-muted-foreground">* Wajib diisi</p>
              <div className="relative">
                <label className="text-sm font-medium text-foreground mb-1 block">Keahlian*</label>
                <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input 
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setFocusedIndex(-1);
                      setResolution(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Keahlian (mis: Manajemen Proyek)"
                    className="w-full bg-transparent outline-none text-sm text-foreground"
                  />
                </div>
                
                {searchTerm.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto custom-scrollbar">
                    {suggestions.length > 0 && (
                      <div className="p-2 space-y-1">
                        {suggestions.map((s, index) => (
                          <button
                            key={s.id}
                            id={`suggestion-${index}`}
                            onClick={() => handleSelectSuggestion(s.name)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex justify-between items-center ${
                              focusedIndex === index ? 'bg-emerald-500/10 text-emerald-600 font-medium' : 'hover:bg-foreground/5'
                            }`}
                          >
                            <span>{s.name}</span>
                            <Plus className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {resolution?.status === 'SUGGESTION' && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{resolution.reason}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSaving(true);
                        void commitSkill(resolution.suggestion.name);
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Pakai &quot;{resolution.suggestion.name}&quot;
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveAdd(true)}
                      className="px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      Tetap pakai &quot;{resolution.input}&quot;
                    </button>
                  </div>
                </div>
              )}

              {resolution?.status === 'REJECTED' && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-2">
                  <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{resolution.reason}</span>
                  </p>
                  {resolution.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {resolution.suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setIsSaving(true);
                            void commitSkill(s.name);
                          }}
                          className="px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center">
              {/* Sejajar dengan EducationModal dan ExperienceSection: menghapus
                  seluruh bagian dari profil hanya bisa dari dalam modalnya,
                  bukan dari ikon di kepala kartu, supaya tidak bersebelahan
                  dengan tombol tambah dan edit. */}
              <div>
                {onRemoveSection && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveWholeSection}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50"
                  >
                    Hapus Bagian Ini
                  </Button>
                )}
              </div>
              {/* Dibungkus arrow function: `onClick={handleSaveAdd}` akan
                  meneruskan MouseEvent sebagai argumen pertama, yang di sini
                  berarti `force` dan membuat setiap klik Simpan melewati
                  pemeriksaan. */}
              <Button onClick={() => handleSaveAdd()} isLoading={isSaving} className="rounded-full px-6">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
