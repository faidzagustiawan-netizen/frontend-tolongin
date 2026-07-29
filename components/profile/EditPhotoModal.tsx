import React, { useState, useRef, useId } from 'react';
import { X, UploadCloud, Link as LinkIcon, User } from 'lucide-react';
import { useDialogA11y } from '../../utils/useDialogA11y';
import { Button } from '../common/Button';

interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentProfile: any;
  onSave: (data: any) => Promise<void>;
}

export const EditPhotoModal = ({ isOpen, onClose, talentProfile, onSave }: EditPhotoModalProps) => {
  const [photoUrl, setPhotoUrl] = useState(talentProfile?.avatarUrl || '');
  const [previewUrl, setPreviewUrl] = useState(talentProfile?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');

  // Escape, jebakan fokus Tab, kunci gulir, dan pengembalian fokus

  // ke pemicunya. Sebelumnya tidak ada satu pun di antaranya.

  const dialogRef = useRef<HTMLDivElement>(null);

  const dialogTitleId = useId();

  useDialogA11y(isOpen, onClose, dialogRef);


  if (!isOpen) return null;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUrl(e.target.value);
    setPreviewUrl(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo purposes, create an object URL. In a real app, upload this to a server/storage first.
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhotoUrl(url); 
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhotoUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ avatarUrl: photoUrl });
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
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={dialogTitleId} className="text-xl font-semibold text-foreground">Edit foto profil</h2>
          <button onClick={onClose}
            type="button"
            aria-label="Tutup dialog" className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-card shadow-lg overflow-hidden bg-foreground/5 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewUrl('')} />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-foreground/5 rounded-lg">
            <button 
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LinkIcon className="h-4 w-4" /> URL
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <UploadCloud className="h-4 w-4" /> Upload
            </button>
          </div>

          {activeTab === 'url' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL Foto</label>
              <input 
                value={photoUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          ) : (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-background hover:bg-foreground/5 transition-colors cursor-pointer"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <UploadCloud className="h-8 w-8 text-emerald-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Klik atau tarik file ke sini</p>
                <p className="text-xs text-muted-foreground mt-1">Maksimal ukuran file 5MB (JPG, PNG)</p>
              </div>
              <input 
                id="photo-upload"
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">Batal</Button>
          <Button onClick={handleSubmit} isLoading={isSaving} className="rounded-full px-6">
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};
