import React, { useState, useRef } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X } from 'lucide-react';

interface CompanySettingsTabProps {
  companyProfile: any;
  isEditingProfile: boolean;
  editFormData: any;
  setEditFormData: (data: any) => void;
}

export const CompanySettingsTab = ({
  companyProfile,
  isEditingProfile,
  editFormData,
  setEditFormData,
}: CompanySettingsTabProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [logoMethod, setLogoMethod] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Harap upload file gambar yang valid (JPG, PNG, GIF, dll).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran gambar tidak boleh melebihi 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setEditFormData({ ...editFormData, logoUrl: result });
        setIsUploadModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nama Perusahaan"
          value={isEditingProfile ? (editFormData.companyName || '') : (companyProfile?.companyName || '')}
          onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Bidang Industri"
          value={isEditingProfile ? (editFormData.industry || '') : (companyProfile?.industry || '')}
          onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Ukuran Perusahaan"
          value={isEditingProfile ? (editFormData.companySize || '') : (companyProfile?.companySize || '')}
          onChange={(e) => setEditFormData({ ...editFormData, companySize: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL Website"
          value={isEditingProfile ? (editFormData.websiteUrl || '') : (companyProfile?.websiteUrl || '')}
          onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Lokasi / Domisili Kantor"
          value={isEditingProfile ? (editFormData.location || '') : (companyProfile?.location || '')}
          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL LinkedIn"
          value={isEditingProfile ? (editFormData.linkedinUrl || '') : (companyProfile?.linkedinUrl || '')}
          onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isEditingProfile && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Logo Perusahaan</label>
            <div className="flex gap-4 items-start mb-6">
              <div className="w-16 h-16 rounded-xl bg-foreground/5 border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                {editFormData.logoUrl ? (
                  <img src={editFormData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground opacity-50" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="radio" 
                      checked={logoMethod === 'url'} 
                      onChange={() => setLogoMethod('url')} 
                      className="accent-emerald-500" 
                    />
                    Gunakan URL
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="radio" 
                      checked={logoMethod === 'upload'} 
                      onChange={() => setLogoMethod('upload')} 
                      className="accent-emerald-500" 
                    />
                    Upload File
                  </label>
                </div>
                {logoMethod === 'url' ? (
                  <Input
                    placeholder="https://..."
                    value={editFormData.logoUrl || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                  />
                ) : (
                  <div className="flex gap-3 items-center">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="flex-shrink-0 h-[42px]" 
                      onClick={() => setIsUploadModalOpen(true)}
                    >
                      Pilih Gambar
                    </Button>
                    <span className="text-xs text-muted-foreground">Upload file dari perangkat Anda</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <Input
          label="Paket Langganan Aktif Saat Ini"
          value={companyProfile?.subscriptionTier || ''}
          disabled
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Deskripsi Perusahaan</label>
        {isEditingProfile ? (
          <textarea
            className="w-full bg-background border border-border rounded-xl p-4 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            rows={4}
            value={editFormData.description || ''}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed bg-background border border-border p-4 rounded-xl">
            {companyProfile?.description || 'Belum ada deskripsi perusahaan.'}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/5 text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-bold text-foreground mb-1">Upload Logo Perusahaan</h3>
              <p className="text-xs text-muted-foreground mb-6">Pilih atau tarik gambar dari perangkat Anda. (Maksimal 5MB, format gambar saja)</p>

              <div 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-colors cursor-pointer overflow-hidden ${
                  dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:bg-foreground/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center text-center p-4 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-3 text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    <span className="text-emerald-500">Klik untuk upload</span> atau drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF hingga 5MB</p>
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-red-500 mt-4 text-center font-medium">{uploadError}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
