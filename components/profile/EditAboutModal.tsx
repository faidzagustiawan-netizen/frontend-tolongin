import React, { useState, useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { useDialogA11y } from '../../utils/useDialogA11y';
import { Button } from '../common/Button';

interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentProfile: any;
  onSave: (data: any) => Promise<void>;
  /**
   * Menghapus seluruh bagian Tentang. Dulu modal ini memanggil
   * `onSave({ bio: '' })` sendiri — satu-satunya bagian yang menghapus lewat
   * jalurnya sendiri, sehingga halaman induk tidak tahu bagiannya sudah hilang
   * dan `visibleSections` tidak ikut diperbarui.
   */
  onRemoveSection?: () => Promise<void> | void;
}

export const EditAboutModal = ({ isOpen, onClose, talentProfile, onSave, onRemoveSection }: EditAboutModalProps) => {
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (talentProfile) {
      setBio(talentProfile.bio || '');
    }
  }, [talentProfile]);

  // Escape, jebakan fokus Tab, kunci gulir, dan pengembalian fokus

  // ke pemicunya. Sebelumnya tidak ada satu pun di antaranya.

  const dialogRef = useRef<HTMLDivElement>(null);

  const dialogTitleId = useId();

  useDialogA11y(isOpen, onClose, dialogRef);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim()) return;
    setIsSaving(true);
    await onSave({ bio });
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
        className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={dialogTitleId} className="text-xl font-semibold text-foreground">Edit tentang</h2>
          <button onClick={onClose}
            type="button"
            aria-label="Tutup dialog" className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tulis lama pengalaman, industri, atau keahlian Anda. Orang juga biasanya menceritakan pencapaian atau pengalaman kerja mereka sebelumnya.
            </p>
            
            <div className="relative">
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2600}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[250px] resize-y"
              />
              
                <div className="flex justify-end items-center mt-2">
                  <span className="text-xs text-muted-foreground">{bio.length}/2.600</span>
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center">
          <div>
            {onRemoveSection && (
              <Button
                variant="outline"
                onClick={(e) => {
                  // Modal ini menutup diri lebih dulu, baru meminta halaman
                  // profil membuka ConfirmDialog-nya. ConfirmDialog merender
                  // `Modal` pada z-index yang sama dengan modal ini, jadi
                  // menumpuknya membuat dua jebakan fokus aktif bersamaan.
                  e.preventDefault();
                  onClose();
                  onRemoveSection();
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50"
              >
                Hapus Bagian Ini
              </Button>
            )}
          </div>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!bio.trim()} className="rounded-full px-6">
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};
