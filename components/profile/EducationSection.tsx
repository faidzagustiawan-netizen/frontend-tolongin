import React, { useState } from 'react';
import { Plus, Pencil, Trash, X } from 'lucide-react';
import { Button } from '../common/Button';

interface Education {
  id?: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface EducationSectionProps {
  educations: Education[];
  onUpdate: (educations: Education[]) => Promise<void>;
  onRemoveSection?: () => void;
}

export const EducationSection = ({ educations: initialEducations, onUpdate, onRemoveSection }: EducationSectionProps) => {
  const [educations, setEducations] = useState<Education[]>(initialEducations || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Education>({
    school: ''
  });

  const handleEdit = (index: number) => {
    setFormData(educations[index]);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({ school: '' });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let newArr = [...educations];
    if (editingIndex !== null) {
      newArr[editingIndex] = formData;
    } else {
      newArr.push(formData);
    }
    setEducations(newArr);
    setIsModalOpen(false);
    await onUpdate(newArr);
  };

  const handleDeleteItem = async () => {
    if (editingIndex !== null) {
      if (window.confirm('Yakin ingin menghapus pendidikan ini?')) {
        const newArr = educations.filter((_, i) => i !== editingIndex);
        setEducations(newArr);
        setIsModalOpen(false);
        await onUpdate(newArr);
      }
    }
  };

  const handleRemoveWholeSection = () => {
    if (window.confirm('Yakin ingin menghapus seluruh bagian Pendidikan dari profil Anda?')) {
      if (onRemoveSection) {
        onRemoveSection();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-lg space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-display text-xl font-bold text-foreground">Pendidikan</h3>
        <div className="flex items-center gap-2">
          {onRemoveSection && (
            <button onClick={handleRemoveWholeSection} className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500" title="Hapus Bagian Ini">
              <Trash className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleAdd} className="p-2 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground" title="Tambah Pendidikan">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {educations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pendidikan yang ditambahkan.</p>
        ) : (
          educations.map((edu, index) => (
            <div key={index} className="flex gap-4 group">
              <div className="w-12 h-12 bg-foreground/10 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">{edu.school.substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-foreground text-lg">{edu.school}</h4>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(index)} className="p-1.5 hover:bg-foreground/10 rounded-full"><Pencil className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-foreground">{edu.degree} {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                <p className="text-sm text-muted-foreground">
                  {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Saat ini'}
                </p>
                {edu.description && <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{edu.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Edit/Add Education */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">{editingIndex !== null ? 'Edit Pendidikan' : 'Tambah Pendidikan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sekolah/Universitas*</label>
                <input required name="school" value={formData.school} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Gelar</label>
                <input name="degree" value={formData.degree || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bidang Studi</label>
                <input name="fieldOfStudy" value={formData.fieldOfStudy || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tahun Mulai</label>
                  <input type="date" name="startDate" value={formData.startDate ? formData.startDate.substring(0, 10) : ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tahun Selesai</label>
                  <input type="date" name="endDate" value={formData.endDate ? formData.endDate.substring(0, 10) : ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deskripsi</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px]" />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-between items-center">
              <div>
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
