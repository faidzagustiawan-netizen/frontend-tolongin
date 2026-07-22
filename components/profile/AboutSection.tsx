import React from 'react';
import { Pencil, Plus } from 'lucide-react';

interface AboutSectionProps {
  bio?: string;
  onEditClick: () => void;
  autoOpenAddModal?: boolean;
  onModalOpened?: () => void;
}

export const AboutSection = ({ bio, onEditClick, autoOpenAddModal, onModalOpened }: AboutSectionProps) => {
  React.useEffect(() => {
    if (autoOpenAddModal) {
      onEditClick();
      if (onModalOpened) onModalOpened();
    }
  }, [autoOpenAddModal, onModalOpened]);

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-display text-xl font-bold text-foreground">Tentang</h3>
        <div className="flex items-center gap-2">
          {!bio && (
            <button onClick={onEditClick} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground">
              <Plus className="h-5 w-5" />
            </button>
          )}
          {bio && (
            <button onClick={onEditClick} className="p-2 rounded-full hover:bg-foreground/10 transition-colors z-20 text-muted-foreground hover:text-foreground">
              <Pencil className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
        {bio || <span className="text-muted-foreground">Belum ada informasi tentang yang ditambahkan.</span>}
      </div>
    </div>
  );
};
