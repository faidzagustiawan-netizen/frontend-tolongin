import React from 'react';
import { Input } from '../common/Input';

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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nama Lengkap"
          defaultValue={talentProfile?.fullName}
          value={isEditingProfile ? editFormData.fullName : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Keahlian Utama (Headline)"
          defaultValue={talentProfile?.headline}
          value={isEditingProfile ? editFormData.headline : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, headline: e.target.value })}
          disabled={!isEditingProfile}
        />
        <div className="md:col-span-2">
          <Input
            label="Foto Profil Publik (URL Gambar Bebas)"
            placeholder="https://contoh.com/foto-saya.jpg"
            defaultValue={talentProfile?.avatarUrl}
            value={isEditingProfile ? editFormData.avatarUrl : undefined}
            onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
            disabled={!isEditingProfile}
          />
          <p className="text-[10px] text-muted-foreground mt-1 ml-1">
            Ini adalah foto publik yang dilihat semua orang. Anda bebas mengubahnya. Foto ini **tidak akan** mengubah atau memengaruhi wajah identitas asli (KTP) yang terkunci di sistem keamanan kami.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="NIK KTP"
          defaultValue={talentProfile?.ktpNik}
          value={isEditingProfile ? editFormData.ktpNik : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, ktpNik: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Daftar Keahlian (Pisahkan dengan koma)"
          defaultValue={talentProfile?.skills?.join(', ')}
          value={isEditingProfile ? editFormData.skills : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Domisili (Location)"
          placeholder="Cth: Jakarta, Bandung, dll."
          defaultValue={talentProfile?.location}
          value={isEditingProfile ? editFormData.location : undefined}
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
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Fullstack">Fullstack</option>
              <option value="UI/UX">UI/UX</option>
              <option value="Data Science">Data Science</option>
              <option value="Mobile">Mobile Developer</option>
              <option value="Product Manager">Product Manager</option>
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
          defaultValue={talentProfile?.githubUrl}
          value={isEditingProfile ? editFormData.githubUrl : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL LinkedIn"
          defaultValue={talentProfile?.linkedinUrl}
          value={isEditingProfile ? editFormData.linkedinUrl : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL Figma"
          defaultValue={talentProfile?.figmaUrl}
          value={isEditingProfile ? editFormData.figmaUrl : undefined}
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
            value={editFormData.bio}
            onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
          />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed bg-background border border-border p-4 rounded-xl">
            {talentProfile?.bio || 'Belum ada bio.'}
          </p>
        )}
      </div>

      <div className="pt-6 border-t border-border">
        <h4 className="text-lg font-bold text-foreground mb-1">Showcase Tantangan</h4>
        <p className="text-xs text-muted-foreground mb-4">Pilih dan urutkan tantangan terbaik yang telah Anda selesaikan untuk dipamerkan di profil publik Anda.</p>
        
        {isEditingProfile ? (
          <div className="space-y-3">
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
                        <p className="text-xs text-emerald-400 mt-1">{sub.challenge?.category}</p>
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
    </div>
  );
};
