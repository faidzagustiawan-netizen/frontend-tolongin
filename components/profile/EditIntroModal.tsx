import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';

interface EditIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentProfile: any;
  onSave: (data: any) => Promise<void>;
}

export const EditIntroModal = ({ isOpen, onClose, talentProfile, onSave }: EditIntroModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (talentProfile) {
      const parts = (talentProfile.fullName || '').split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';
      setFormData({
        firstName: fName,
        lastName: lName,
        headline: talentProfile.headline || '',
        location: talentProfile.location || '',
      });
    }
  }, [talentProfile]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    await onSave({ fullName, headline: formData.headline, location: formData.location });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Edit intro</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <p className="text-xs text-muted-foreground">* Wajib diisi</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nama depan*</label>
              <input 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nama belakang*</label>
              <input 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Moto Profesional*</label>
            <input 
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Lokasi</label>
            <input 
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Cth: Jakarta, Indonesia"
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
