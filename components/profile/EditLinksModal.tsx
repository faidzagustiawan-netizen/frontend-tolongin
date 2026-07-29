import React, { useState, useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { useDialogA11y } from '../../utils/useDialogA11y';
import { Button } from '../common/Button';

interface EditLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentProfile: any;
  onSave: (data: any) => Promise<void>;
}

export const EditLinksModal = ({ isOpen, onClose, talentProfile, onSave }: EditLinksModalProps) => {
  const [formData, setFormData] = useState({
    linkedinUrl: '',
    githubUrl: '',
    figmaUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (talentProfile) {
      setFormData({
        linkedinUrl: talentProfile.linkedinUrl || '',
        githubUrl: talentProfile.githubUrl || '',
        figmaUrl: talentProfile.figmaUrl || '',
      });
    }
  }, [talentProfile]);

  // Escape, jebakan fokus Tab, kunci gulir, dan pengembalian fokus

  // ke pemicunya. Sebelumnya tidak ada satu pun di antaranya.

  const dialogRef = useRef<HTMLDivElement>(null);

  const dialogTitleId = useId();

  useDialogA11y(isOpen, onClose, dialogRef);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
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
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={dialogTitleId} className="text-xl font-semibold text-foreground">Edit URL dan Kontak</h2>
          <button onClick={onClose}
            type="button"
            aria-label="Tutup dialog" className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Profil LinkedIn</label>
            <input 
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Profil GitHub</label>
            <input 
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              placeholder="https://github.com/..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Profil Figma / Portofolio</label>
            <input 
              name="figmaUrl"
              value={formData.figmaUrl}
              onChange={handleChange}
              placeholder="https://figma.com/..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end">
          <Button onClick={handleSubmit} isLoading={isSaving} className="rounded-full px-6">
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};
