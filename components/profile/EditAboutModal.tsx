import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';

interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentProfile: any;
  onSave: (data: any) => Promise<void>;
}

export const EditAboutModal = ({ isOpen, onClose, talentProfile, onSave }: EditAboutModalProps) => {
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (talentProfile) {
      setBio(talentProfile.bio || '');
    }
  }, [talentProfile]);

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
      <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Edit tentang</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
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
            <Button 
              variant="outline" 
              onClick={async (e) => {
                e.preventDefault();
                if (window.confirm('Yakin ingin menghapus bagian Tentang dari profil Anda?')) {
                  setIsSaving(true);
                  await onSave({ bio: '' });
                  setIsSaving(false);
                  onClose();
                }
              }} 
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50"
            >
              Hapus Bagian Ini
            </Button>
          </div>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!bio.trim()} className="rounded-full px-6">
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};
