import React, { useRef, useId } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useDialogA11y } from '../../utils/useDialogA11y';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (sectionKey: string) => void;
  visibleSections: string[];
  isAboutAdded?: boolean;
}

export const AddSectionModal = ({ isOpen, onClose, onAddSection, visibleSections, isAboutAdded }: AddSectionModalProps) => {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>('Inti');

  // Escape, jebakan fokus Tab, kunci gulir, dan pengembalian fokus

  // ke pemicunya. Sebelumnya tidak ada satu pun di antaranya.

  const dialogRef = useRef<HTMLDivElement>(null);

  const dialogTitleId = useId();

  useDialogA11y(isOpen, onClose, dialogRef);


  if (!isOpen) return null;

  const categories = [
    {
      name: 'Inti',
      description: 'Lengkapi bagian inti ini untuk meningkatkan visibilitas profil Anda kepada perekrut dan koneksi.',
      items: [
        { key: 'about', label: 'Tambahkan tentang' },
        { key: 'education', label: 'Tambahkan pendidikan' },
        { key: 'experience', label: 'Tambahkan pengalaman' },
        { key: 'skills', label: 'Tambahkan keahlian' },
      ]
    },
    {
      name: 'Direkomendasikan',
      description: 'Bagian ini disarankan untuk membantu Anda mendapatkan lebih banyak kesempatan.',
      items: [
        { key: 'liveness', label: 'Tambahkan verifikasi liveness (KYC)' },
        { key: 'badges', label: 'Tambahkan lencana (Badges)' },
      ]
    }
  ];

  const handleAdd = (key: string) => {
    onAddSection(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={dialogTitleId} className="text-xl font-semibold text-foreground">Tambahkan ke profil</h2>
          <button onClick={onClose}
            type="button"
            aria-label="Tutup dialog" className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {categories.map((category) => (
            <div key={category.name} className="border-b border-border">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className="w-full flex items-center justify-between p-6 hover:bg-foreground/5 transition-colors text-left"
              >
                <span className="font-semibold text-lg text-foreground">{category.name}</span>
                {expandedCategory === category.name ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedCategory === category.name && (
                <div className="px-6 pb-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const isAdded = item.key === 'about' ? isAboutAdded : visibleSections.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleAdd(item.key)}
                          disabled={isAdded}
                          className={`w-full text-left py-3 border-b border-border/50 last:border-0 font-medium ${isAdded ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:text-emerald-500'}`}
                        >
                          {item.label} {isAdded && '(Sudah ditambahkan)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
