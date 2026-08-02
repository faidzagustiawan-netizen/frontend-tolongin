import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Experience, ExperienceModal } from './ExperienceModal';

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: (experiences: Experience[]) => Promise<void>;
  onRemoveSection?: () => Promise<void> | void;
  autoOpenAddModal?: boolean;
  onModalOpened?: () => void;
}

export const ExperienceSection = ({ experiences: initialExperiences, onUpdate, onRemoveSection, autoOpenAddModal, onModalOpened }: ExperienceSectionProps) => {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  useEffect(() => {
    setExperiences(initialExperiences || []);
  }, [initialExperiences]);

  useEffect(() => {
    if (autoOpenAddModal) {
      setIsAddModalOpen(true);
      if (onModalOpened) onModalOpened();
    }
  }, [autoOpenAddModal, onModalOpened]);

  const handleSaveAdd = async (newExp: Experience) => {
    const newArr = [...experiences, newExp];
    setExperiences(newArr);
    await onUpdate(newArr);
    setIsAddModalOpen(false);
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
        <h3 className="font-display text-xl font-bold text-foreground">Pengalaman</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Tambah Pengalaman">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={() => router.push('/settings/experiences')} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Edit Pengalaman">
            <Pencil className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {experiences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pengalaman yang ditambahkan.</p>
        ) : (
          experiences.map((exp, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">{exp.companyName.substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-foreground text-lg">{exp.title}</h4>
                <p className="text-foreground">
                  {exp.companyName} {exp.employmentType ? `· ${exp.employmentType}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.isCurrent ? 'Saat ini' : (exp.endDate ? new Date(exp.endDate).getFullYear() : 'Saat ini')}
                </p>
                {(exp.location || exp.locationType) && (
                  <p className="text-sm text-muted-foreground">
                    {[exp.location, exp.locationType].filter(Boolean).join(' · ')}
                  </p>
                )}
                {exp.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{exp.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <ExperienceModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          experience={null}
          onSave={handleSaveAdd}
          onRemoveSection={handleRemoveWholeSection}
        />
      )}
    </div>
  );
};
