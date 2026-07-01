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
        <label className="block text-sm font-medium text-gray-300 mb-2">Bio / Tentang Saya</label>
        {isEditingProfile ? (
          <textarea
            className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            rows={4}
            value={editFormData.bio}
            onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
          />
        ) : (
          <p className="text-xs text-gray-400 leading-relaxed bg-dark-bg border border-dark-border p-4 rounded-xl">
            {talentProfile?.bio || 'Belum ada bio.'}
          </p>
        )}
      </div>
    </div>
  );
};
