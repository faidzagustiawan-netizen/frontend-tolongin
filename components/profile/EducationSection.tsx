import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Education, EducationModal } from './EducationModal';

interface EducationSectionProps {
  educations: Education[];
  onUpdate: (educations: Education[]) => Promise<void>;
  onRemoveSection?: () => void;
  autoOpenAddModal?: boolean;
  onModalOpened?: () => void;
}

export const EducationSection = ({ educations: initialEducations, onUpdate, onRemoveSection, autoOpenAddModal, onModalOpened }: EducationSectionProps) => {
  const router = useRouter();
  const [educations, setEducations] = useState<Education[]>(initialEducations || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  useEffect(() => {
    setEducations(initialEducations || []);
  }, [initialEducations]);

  useEffect(() => {
    if (autoOpenAddModal) {
      setIsAddModalOpen(true);
      if (onModalOpened) onModalOpened();
    }
  }, [autoOpenAddModal, onModalOpened]);

  const handleSaveAdd = async (newEdu: Education) => {
    const newArr = [...educations, newEdu];
    setEducations(newArr);
    await onUpdate(newArr);
    setIsAddModalOpen(false);
  };

  const handleRemoveWholeSection = () => {
    if (window.confirm('Yakin ingin menghapus seluruh bagian Pendidikan dari profil Anda?')) {
      if (onRemoveSection) onRemoveSection();
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-display text-xl font-bold text-foreground">Pendidikan</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Tambah Pendidikan">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={() => router.push('/settings/educations')} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground" title="Edit Pendidikan">
            <Pencil className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {educations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pendidikan yang ditambahkan.</p>
        ) : (
          educations.map((edu, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">{edu.school.substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-foreground text-lg">{edu.school}</h4>
                <p className="text-foreground">{edu.degree} {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                <p className="text-sm text-muted-foreground">
                  {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Saat ini'}
                </p>
                {edu.grade && <p className="text-sm text-foreground/90 mt-1">Nilai: {edu.grade}</p>}
                {edu.activities && <p className="text-sm text-foreground/90 mt-1">Aktivitas dan kegiatan sosial: {edu.activities}</p>}
                {edu.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{edu.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <EducationModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          education={null}
          onSave={handleSaveAdd}
          onRemoveSection={handleRemoveWholeSection}
        />
      )}
    </div>
  );
};
