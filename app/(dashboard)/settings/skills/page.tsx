'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/auth.service';
import { AlertTriangle, ArrowLeft, Pencil, Plus, Sparkles, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { CategoryResolution, skillsService } from '@/services/skills.service';

export default function SkillsSettingsPage() {
  const router = useRouter();
  const { user, loadUserFromStorage } = useUserStore();
  const [skills, setSkills] = useState<string[]>([]);
  
  const [skillToEdit, setSkillToEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  /** Putusan pemeriksaan yang menunggu keputusan talenta. */
  const [resolution, setResolution] = useState<CategoryResolution | null>(null);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (user?.id) {
      authService.getProfile(user.id).then((res) => {
        const tp = res.data?.talentProfile;
        if (tp) {
          setSkills(tp.skills || []);
        }
      });
    }
  }, [user?.id]);

  const handleUpdate = async (newSkills: string[]) => {
    setIsSaving(true);
    try {
      await authService.updateProfile({ skills: newSkills });
      setSkills(newSkills);
      toast.success('Keahlian berhasil diperbarui');
    } catch (_e: any) {
      toast.error('Gagal memperbarui keahlian');
    }
    setIsSaving(false);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length >= 2) {
        try {
          const results = await skillsService.searchSkills(searchTerm);
          setSuggestions(results);
        } catch (e: any) {
          console.error('Failed to search skills', e);
        }
      } else {
        setSuggestions([]);
      }
    };
    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleOpenAddModal = () => {
    setSearchTerm('');
    setFocusedIndex(-1);
    setIsAddModalOpen(true);
  };

  const handleSelectSuggestion = (skillName: string) => {
    setSearchTerm(skillName);
    setSuggestions([]);
    setFocusedIndex(-1);
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

  /**
   * Pintu kedua ke direktori, di samping kartu Keahlian di halaman profil.
   *
   * Keduanya dulu memanggil `createSkill` tanpa syarat, jadi menutup salah
   * satunya saja tidak ada gunanya: salah ketik cukup lewat sini untuk sampai
   * ke direktori yang sama — yang kini juga menyetir bidang pekerjaan yang
   * dicari perusahaan.
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

  /** Menyimpan nama baku dari direktori, bukan ketikan mentahnya. */
  const commitSkill = async (name: string) => {
    if (skills.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.error(`Keahlian "${name}" sudah ditambahkan di profil Anda`);
      setResolution(null);
      setIsSaving(false);
      return;
    }

    await handleUpdate([...skills, name]);

    setSearchTerm('');
    setSuggestions([]);
    setResolution(null);
    setIsSaving(false);
    setIsAddModalOpen(false);
  };

  const handleDelete = async () => {
    if (skillToEdit) {
      const newSkills = skills.filter((s) => s !== skillToEdit);
      await handleUpdate(newSkills);
      setSkillToEdit(null);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/settings')} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-display font-bold text-foreground">Keahlian</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenAddModal} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors border border-border">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-medium">Semua keahlian ({skills.length})</span>
          </div>

          <div className="space-y-0">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada keahlian yang ditambahkan.</p>
            ) : (
              skills.map((skill, index) => (
                <div key={index} className="flex justify-between items-center py-6 border-b border-border last:border-0 group">
                  <span className="font-semibold text-foreground text-lg">{skill}</span>
                  <button 
                    onClick={() => setSkillToEdit(skill)}
                    className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Skill Modal */}
      {skillToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Edit keahlian</h2>
              <button onClick={() => setSkillToEdit(null)} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Keahlian*</label>
              <input 
                type="text" 
                value={skillToEdit} 
                disabled 
                className="w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground opacity-70 cursor-not-allowed"
              />
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center bg-foreground/5 rounded-b-2xl">
              <Button variant="outline" onClick={handleDelete} isLoading={isSaving} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent">
                Hapus keahlian
              </Button>
              <Button onClick={() => setSkillToEdit(null)} className="rounded-full px-6">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

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

            <div className="p-6 border-t border-border flex justify-end items-center">
              {/* Dibungkus arrow function: `onClick={handleSaveAdd}` akan
                  meneruskan MouseEvent sebagai `force` dan membuat setiap klik
                  Simpan melewati pemeriksaan. */}
              <Button onClick={() => handleSaveAdd()} isLoading={isSaving} className="rounded-full px-6">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
