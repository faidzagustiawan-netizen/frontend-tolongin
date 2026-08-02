import React, { useState, useEffect, useRef, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useDialogA11y } from '../../utils/useDialogA11y';
import { Button } from '../common/Button';
import { skillsService } from '@/services/skills.service';

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
    roleCategory: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  /**
   * `roleCategory` sudah lama diterima `PATCH /users/me/profile` dan disaring
   * `GET /talents` maupun `GET /leaderboard`, tetapi tidak ada satu pun ruas
   * di antarmuka yang mengisinya — jadi kolomnya null untuk setiap talenta dan
   * penyaring bidang tidak pernah punya apa pun untuk disaring.
   *
   * Pilihannya dari direktori keahlian, sama dengan yang dibaca penyaring di
   * papan peringkat.
   */
  const { data: categories } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => skillsService.listCategories(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

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
        roleCategory: talentProfile.roleCategory || '',
      });
    }
  }, [talentProfile]);

  // Escape, jebakan fokus Tab, kunci gulir, dan pengembalian fokus

  // ke pemicunya. Sebelumnya tidak ada satu pun di antaranya.

  const dialogRef = useRef<HTMLDivElement>(null);

  const dialogTitleId = useId();

  useDialogA11y(isOpen, onClose, dialogRef);


  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Nilai lama yang tidak (lagi) ada di direktori tetap ditawarkan, supaya
  // menyimpan profil tidak diam-diam mengosongkan bidang talenta.
  const categoryNames = (categories ?? []).map((c) => c.name);
  const categoryOptions =
    formData.roleCategory && !categoryNames.includes(formData.roleCategory)
      ? [formData.roleCategory, ...categoryNames]
      : categoryNames;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    await onSave({
      fullName,
      headline: formData.headline,
      location: formData.location,
      roleCategory: formData.roleCategory,
    });
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
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={dialogTitleId} className="text-xl font-semibold text-foreground">Edit intro</h2>
          <button onClick={onClose}
            type="button"
            aria-label="Tutup dialog" className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" aria-hidden="true" />
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

          <div className="space-y-2">
            <label
              htmlFor="roleCategory"
              className="text-sm font-medium text-foreground"
            >
              Kategori Peran Utama
            </label>
            <select
              id="roleCategory"
              name="roleCategory"
              value={formData.roleCategory}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">Pilih kategori...</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Dipakai perusahaan untuk menyaring papan peringkat dan direktori
              talenta.
            </p>
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
