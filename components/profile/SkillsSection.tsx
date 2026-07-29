import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Search, Pencil, Trash, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { skillsService } from '../../services/skills.service';
import toast from 'react-hot-toast';

interface SkillsSectionProps {
  skills: string[];
  onUpdate: (skills: string[]) => Promise<void>;
  onRemoveSection?: () => void;
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

  const handleSaveAdd = async () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      setIsAddModalOpen(false);
      return;
    }

    if (skills.some(s => s.toLowerCase() === trimmedSearch.toLowerCase())) {
      toast.error(`Keahlian "${trimmedSearch}" sudah ditambahkan di profil Anda`);
      return;
    }

    setIsSaving(true);
    const newSkills = [...skills, trimmedSearch];
    setSkills(newSkills);
    await onUpdate(newSkills);
    
    // Add new skill to directory automatically
    skillsService.createSkill(trimmedSearch).catch(() => {});

    setSearchTerm('');
    setSuggestions([]);
    setIsSaving(false);
    setIsAddModalOpen(false);
  };

  const handleRemoveWholeSection = () => {
    if (window.confirm('Yakin ingin menghapus seluruh bagian Keahlian dari profil Anda?')) {
      if (onRemoveSection) {
        onRemoveSection();
      }
    }
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
            </div>

            <div className="p-6 border-t border-border flex justify-end items-center">
              <Button onClick={handleSaveAdd} isLoading={isSaving} className="rounded-full px-6">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
