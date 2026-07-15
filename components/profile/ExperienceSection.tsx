import React, { useState } from 'react';
import { Plus, Pencil, Trash, X } from 'lucide-react';
import { Button } from '../common/Button';

interface Experience {
  id?: string;
  title: string;
  companyName: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

interface ExperienceSectionProps {
  experiences: Experience[];
  onUpdate: (experiences: Experience[]) => Promise<void>;
  onRemoveSection?: () => void;
}

export const ExperienceSection = ({ experiences: initialExperiences, onUpdate, onRemoveSection }: ExperienceSectionProps) => {
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Experience>({
    title: '', companyName: '', isCurrent: false
  });

  const handleEdit = (index: number) => {
    setFormData(experiences[index]);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({ title: '', companyName: '', isCurrent: false });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let newArr = [...experiences];
    if (editingIndex !== null) {
      newArr[editingIndex] = formData;
    } else {
      newArr.push(formData);
    }
    setExperiences(newArr);
    setIsModalOpen(false);
    await onUpdate(newArr);
  };

  const handleDeleteItem = async () => {
    if (editingIndex !== null) {
      if (window.confirm('Yakin ingin menghapus pengalaman ini?')) {
        const newArr = experiences.filter((_, i) => i !== editingIndex);
        setExperiences(newArr);
        setIsModalOpen(false);
        await onUpdate(newArr);
      }
    }
  };

  const handleRemoveWholeSection = () => {
    if (window.confirm('Yakin ingin menghapus seluruh bagian Pengalaman dari profil Anda?')) {
      if (onRemoveSection) {
        onRemoveSection();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-display text-xl font-bold text-foreground">Pengalaman</h3>
        <div className="flex items-center gap-2">
          {onRemoveSection && (
            <button onClick={handleRemoveWholeSection} className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500" title="Hapus Bagian Ini">
              <Trash className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleAdd} className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground" title="Tambah Pengalaman">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {experiences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pengalaman yang ditambahkan.</p>
        ) : (
          experiences.map((exp, index) => (
            <div key={index} className="flex gap-4 group">
              <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">{exp.companyName.substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-foreground text-lg">{exp.title}</h4>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(index)} className="p-1.5 hover:bg-foreground/10 rounded-full"><Pencil className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-foreground">{exp.companyName}</p>
                <p className="text-sm text-muted-foreground">
                  {exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - {exp.isCurrent ? 'Saat ini' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                  {exp.location && ` • ${exp.location}`}
                </p>
                {exp.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{exp.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Edit/Add Experience */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">{editingIndex !== null ? 'Edit Pengalaman' : 'Tambah Pengalaman'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Posisi*</label>
                <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama Perusahaan*</label>
                <input required name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Lokasi</label>
                <input name="location" value={formData.location || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="isCurrent" id="isCurrent" checked={formData.isCurrent} onChange={handleChange} className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-background border-border" />
                <label htmlFor="isCurrent" className="text-sm text-foreground">Saya masih bekerja di posisi ini</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tanggal Mulai</label>
                  <input type="date" name="startDate" value={formData.startDate ? formData.startDate.substring(0, 10) : ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
                </div>
                {!formData.isCurrent && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tanggal Selesai</label>
                    <input type="date" name="endDate" value={formData.endDate ? formData.endDate.substring(0, 10) : ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deskripsi</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px]" />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center">
              <div>
                {/* Delete entire section option placed here as requested "di tombol kirinya simpan ketika popup edit section" */}
                <Button variant="outline" onClick={handleRemoveWholeSection} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50">
                  Hapus Bagian Ini
                </Button>
              </div>
              <div className="flex gap-3">
                {editingIndex !== null && (
                  <Button variant="outline" onClick={handleDeleteItem} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent">
                    Hapus Item
                  </Button>
                )}
                <Button onClick={handleSave} className="rounded-full px-6">
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
