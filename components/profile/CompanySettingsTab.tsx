import React from 'react';
import { Input } from '../common/Input';

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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nama Perusahaan"
          defaultValue={companyProfile?.companyName}
          value={isEditingProfile ? editFormData.companyName : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Bidang Industri"
          defaultValue={companyProfile?.industry}
          value={isEditingProfile ? editFormData.industry : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Ukuran Perusahaan"
          defaultValue={companyProfile?.companySize}
          value={isEditingProfile ? editFormData.companySize : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, companySize: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL Website"
          defaultValue={companyProfile?.websiteUrl}
          value={isEditingProfile ? editFormData.websiteUrl : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Lokasi / Domisili Kantor"
          defaultValue={companyProfile?.location}
          value={isEditingProfile ? editFormData.location : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="URL LinkedIn"
          defaultValue={companyProfile?.linkedinUrl}
          value={isEditingProfile ? editFormData.linkedinUrl : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="URL Logo Perusahaan (Publik)"
          placeholder="https://..."
          defaultValue={companyProfile?.logoUrl}
          value={isEditingProfile ? editFormData.logoUrl : undefined}
          onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
          disabled={!isEditingProfile}
        />
        <Input
          label="Paket Langganan Aktif Saat Ini"
          defaultValue={companyProfile?.subscriptionTier}
          disabled
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Deskripsi Perusahaan</label>
        {isEditingProfile ? (
          <textarea
            className="w-full bg-background border border-border rounded-xl p-4 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            rows={4}
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed bg-background border border-border p-4 rounded-xl">
            {companyProfile?.description || 'Belum ada deskripsi perusahaan.'}
          </p>
        )}
      </div>
    </div>
  );
};
