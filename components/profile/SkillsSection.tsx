import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Pencil, Trash } from 'lucide-react';
import { Button } from '../common/Button';
import { skillsService } from '../../services/skills.service';

interface SkillsSectionProps {
  skills: string[];
  onUpdate: (skills: string[]) => Promise<void>;
  onRemoveSection?: () => void;
}

export const SkillsSection = ({ skills: initialSkills, onUpdate, onRemoveSection }: SkillsSectionProps) => {
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for modal editing so we don't save until 'Simpan' is clicked
  const [tempSkills, setTempSkills] = useState<string[]>([]);

  useEffect(() => {
    setSkills(initialSkills || []);
  }, [initialSkills]);

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

  const handleOpenModal = () => {
    setTempSkills([...skills]);
    setIsModalOpen(true);
  };

  const handleAddTemp = async (skillName: string) => {
    if (!tempSkills.includes(skillName)) {
      try {
        await skillsService.createSkill(skillName);
        setTempSkills([...tempSkills, skillName]);
        setSearchTerm('');
        setSuggestions([]);
      } catch (e) {
        console.error('Failed to add skill', e);
      }
    }
  };

  const handleRemoveTemp = (skillToRemove: string) => {
    setTempSkills(tempSkills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSkills(tempSkills);
    await onUpdate(tempSkills);
    setIsSaving(false);
    setIsModalOpen(false);
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
          {onRemoveSection && (
            <button onClick={handleRemoveWholeSection} className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500" title="Hapus Bagian Ini">
              <Trash className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleOpenModal} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Edit Keahlian">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Edit Keahlian</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="relative">
                <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input 
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari atau ketik keahlian baru (mis: React)..."
                    className="w-full bg-transparent outline-none text-sm text-foreground"
                  />
                </div>
                
                {searchTerm.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                    {suggestions.length > 0 && (
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Disarankan dari direktori</p>
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleAddTemp(s.name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/5 rounded transition-colors"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {!suggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
                      <div className="p-2 border-t border-border">
                        <button
                          onClick={() => handleAddTemp(searchTerm)}
                          className="w-full text-left px-3 py-2 text-sm text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                        >
                          Tambahkan "{searchTerm}" ke direktori
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Keahlian saat ini ({tempSkills.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {tempSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full px-4 py-1.5">
                      <span className="text-sm font-medium">{skill}</span>
                      <button onClick={() => handleRemoveTemp(skill)} className="hover:text-red-500 transition-colors rounded-full p-0.5">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {tempSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">Pilih atau ketik keahlian di atas untuk menambahkan.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center">
              <div>
                <Button variant="outline" onClick={handleRemoveWholeSection} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50">
                  Hapus Bagian Ini
                </Button>
              </div>
              <Button onClick={handleSave} isLoading={isSaving} className="rounded-full px-6">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
