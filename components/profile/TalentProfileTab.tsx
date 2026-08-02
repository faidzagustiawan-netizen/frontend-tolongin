import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X } from 'lucide-react';
import { skillsService } from '@/services/skills.service';

interface TalentProfileTabProps {
  talentProfile: any;
  isEditingProfile: boolean;
  editFormData: any;
  setEditFormData: (data: any) => void;
}

export const TalentProfileTab = ({
  talentProfile,
  isEditingProfile,
  editFormData,
  setEditFormData,
}: TalentProfileTabProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarMethod, setAvatarMethod] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Bidang diambil dari direktori keahlian, bukan daftar tetap di berkas ini.
   *
   * Tujuh pilihan yang dulu ditulis tangan di sini ("Frontend", "Backend",
   * "UI/UX", ...) adalah satu-satunya sumber nilai `roleCategory` yang pernah
   * tersimpan, dan tidak satu pun cocok dengan penyaring di papan peringkat
   * maupun dengan nama bidang yang dipakai perusahaan saat membuat studi
   * kasus. Ketiganya sekarang membaca direktori yang sama.
   */
  const { data: categories } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => skillsService.listCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // Nilai lama yang sudah tersimpan tetapi tidak (lagi) ada di direktori harus
  // tetap muncul sebagai pilihan. Tanpa ini `<select>` jatuh ke "Pilih
  // Kategori..." dan menyimpan profil diam-diam menghapus bidang talenta.
  const categoryOptions = React.useMemo(() => {
    const names = (categories ?? []).map((c) => c.name);
    const current = editFormData.roleCategory?.trim();
    return current && !names.includes(current) ? [current, ...names] : names;
  }, [categories, editFormData.roleCategory]);

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
        setEditFormData({ ...editFormData, avatarUrl: result });
        setIsUploadModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nama Lengkap"
          value={isEditingProfile ? (editFormData.fullName || '') : (talentProfile?.fullName || '')}
          onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Keahlian Utama (Headline)"
          value={isEditingProfile ? (editFormData.headline || '') : (talentProfile?.headline || '')}
          onChange={(e) => setEditFormData({ ...editFormData, headline: e.target.value })}
          disabled={!isEditingProfile}
        />
        <div className="md:col-span-2">
        {isEditingProfile && (
          <>
          <label className="block text-sm font-medium text-foreground mb-1.5">Foto Profil Publik</label>
          <div className="flex gap-4 items-start mb-6">
            <div className="w-16 h-16 rounded-full bg-foreground/5 border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
              {editFormData.avatarUrl ? (
                <img src={editFormData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input 
                    type="radio" 
                    checked={avatarMethod === 'url'} 
                    onChange={() => setAvatarMethod('url')} 
                    className="accent-emerald-500" 
                  />
                  Gunakan URL
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input 
                    type="radio" 
                    checked={avatarMethod === 'upload'} 
                    onChange={() => setAvatarMethod('upload')} 
                    className="accent-emerald-500" 
                  />
                  Upload File
                </label>
              </div>
              {avatarMethod === 'url' ? (
                <Input
                  placeholder="https://contoh.com/foto-saya.jpg"
                  value={editFormData.avatarUrl || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
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
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Ini adalah foto publik yang dilihat semua orang. Anda bebas mengubahnya. Foto ini **tidak akan** mengubah atau memengaruhi wajah identitas asli (KTP) yang terkunci di sistem keamanan kami.
              </p>
            </div>
          </div>
        </>
        )}
      </div>
    </div>
      <div className={`grid grid-cols-1 ${isEditingProfile ? 'md:grid-cols-2' : ''} gap-6`}>
        {isEditingProfile && (
          <Input
            label="NIK KTP (Privat)"
            value={editFormData.ktpNik || ''}
            onChange={(e) => setEditFormData({ ...editFormData, ktpNik: e.target.value })}
          />
        )}
        <Input
          label="Daftar Keahlian (Pisahkan dengan koma)"
          value={isEditingProfile ? (editFormData.skills || '') : (talentProfile?.skills?.join(', ') || '')}
          onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Domisili (Location)"
          placeholder="Cth: Jakarta, Bandung, dll."
          value={isEditingProfile ? (editFormData.location || '') : (talentProfile?.location || '')}
          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
          disabled={!isEditingProfile}
        />
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Kategori Peran Utama</label>
          {isEditingProfile ? (
            <select
              className="w-full h-11 bg-background border border-border rounded-xl px-4 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
              value={editFormData.roleCategory || ''}
              onChange={(e) => setEditFormData({ ...editFormData, roleCategory: e.target.value })}
            >
              <option value="">Pilih Kategori...</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm flex items-center opacity-70">
              {talentProfile?.roleCategory || '-'}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="URL GitHub"
          value={isEditingProfile ? (editFormData.githubUrl || '') : (talentProfile?.githubUrl || '')}
          onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL LinkedIn"
          value={isEditingProfile ? (editFormData.linkedinUrl || '') : (talentProfile?.linkedinUrl || '')}
          onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL Figma"
          value={isEditingProfile ? (editFormData.figmaUrl || '') : (talentProfile?.figmaUrl || '')}
          onChange={(e) => setEditFormData({ ...editFormData, figmaUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Bio / Tentang Saya</label>
        {isEditingProfile ? (
          <textarea
            className="w-full bg-background border border-border rounded-xl p-4 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            rows={4}
            value={editFormData.bio || ''}
            onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
          />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed bg-background border border-border p-4 rounded-xl">
            {talentProfile?.bio || 'Belum ada bio.'}
          </p>
        )}
      </div>

      <div className="pt-6 border-t border-border">
        <h4 className="text-lg font-bold text-foreground mb-1">
          {isEditingProfile ? 'Showcase Tantangan' : 'Portofolio Tantangan'}
        </h4>
        {isEditingProfile && (
          <p className="text-xs text-muted-foreground mb-4">Pilih dan urutkan tantangan terbaik yang telah Anda selesaikan untuk dipamerkan di profil publik Anda.</p>
        )}
        
        {isEditingProfile ? (
          <div className="space-y-3 mt-4">
            {talentProfile?.submissions?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {talentProfile.submissions.map((sub: any) => {
                  const isSelected = (editFormData.showcasedSubmissionIds || []).includes(sub.id);
                  return (
                    <div 
                      key={sub.id} 
                      className={`p-4 border rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card hover:border-emerald-500/50'}`}
                      onClick={() => {
                        let current = editFormData.showcasedSubmissionIds || [];
                        if (isSelected) {
                          current = current.filter((id: string) => id !== sub.id);
                        } else {
                          current = [...current, sub.id];
                        }
                        setEditFormData({ ...editFormData, showcasedSubmissionIds: current });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{sub.challenge?.title || 'Tantangan Tidak Diketahui'}</p>
                          <p className="text-xs text-muted-foreground">{sub.challenge?.category}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Anda belum memiliki submisi tantangan.</p>
            )}
            {editFormData.showcasedSubmissionIds?.length > 0 && (
              <p className="text-xs text-emerald-500 font-medium">Tips: Tantangan akan ditampilkan sesuai urutan Anda mengkliknya.</p>
            )}
          </div>
        ) : (
          <div>
            {talentProfile?.showcasedSubmissionIds?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {talentProfile.showcasedSubmissionIds.map((id: string) => {
                  const sub = talentProfile.submissions?.find((s: any) => s.id === id);
                  if (!sub) return null;
                  
                  const isDeadlinePassed = sub.challenge?.deadlineAt && new Date(sub.challenge.deadlineAt) < new Date();
                  const solutionUrl = sub.repositoryUrl || sub.figmaUrl || sub.liveDemoUrl || sub.solutionFilesUrl;

                  return (
                    <div key={id} className="p-4 border border-border bg-card rounded-xl flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="text-sm font-bold text-foreground line-clamp-2">{sub.challenge?.title}</p>
                        <p className="text-xs text-emerald-400 mt-1 mb-3">{sub.challenge?.category}</p>
                        
                        {(sub.aiScore !== null || sub.softSkillScore !== null) && (
                          <div className="flex items-center gap-4 text-xs font-medium">
                            {sub.aiScore !== null && (
                              <div className="flex items-center gap-1.5 text-foreground bg-foreground/5 px-2 py-1 rounded-md border border-border">
                                <span className="text-muted-foreground">Hard Skill:</span>
                                <span>{sub.aiScore}/100</span>
                              </div>
                            )}
                            {sub.softSkillScore !== null && (
                              <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                                <span className="text-cyan-500/70">Soft Skill:</span>
                                <span>{sub.softSkillScore}/100</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        {isDeadlinePassed ? (
                          <a href={solutionUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 font-semibold hover:underline block text-center">
                            Lihat Solusi Submisi
                          </a>
                        ) : (
                          <p className="text-[10px] text-muted-foreground text-center italic">
                            Solusi disembunyikan hingga tenggat waktu tantangan berlalu.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum ada tantangan yang di-showcase.</p>
            )}
          </div>
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
              
              <h3 className="text-lg font-bold text-foreground mb-1">Upload Foto Profil</h3>
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
