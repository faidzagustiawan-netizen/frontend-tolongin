import React from 'react';
import { Input, Textarea } from '../../../../../components/common/Input';
import { CreateChallengePayload } from '../../../../../services/challenges.service';

interface GeneralFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

export default function GeneralForm({ manualData, setManualData }: GeneralFormProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Informasi Umum</h3>
        <p className="text-sm text-gray-400 mb-6">Lengkapi informasi dasar mengenai studi kasus yang akan Anda buat.</p>
      </div>

      <Input
        label="Judul Studi Kasus"
        placeholder="Contoh: Implementasi Payment Gateway Berbasis Microservices"
        value={manualData.title}
        onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Kategori Pekerjaan <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={manualData.category}
            onChange={(e) => setManualData({ ...manualData, category: e.target.value as any })}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
          >
            <option value="FRONTEND">Frontend Development</option>
            <option value="BACKEND">Backend Development</option>
            <option value="UI_UX">UI/UX Design</option>
            <option value="DATA_SCIENCE">Data Science / ML</option>
            <option value="MARKETING">Digital Marketing</option>
            <option value="PRODUCT">Product Management</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tingkat Kesulitan <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={manualData.difficulty}
            onChange={(e) => setManualData({ ...manualData, difficulty: e.target.value as any })}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
          >
            <option value="JUNIOR">Junior (1-2 Tahun)</option>
            <option value="MEDIOR">Medior (3-5 Tahun)</option>
            <option value="SENIOR">Senior (5+ Tahun)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Batas Akhir / Deadline Global <span className="text-red-500 ml-1">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">Menentukan kapan challenge ini ditutup secara keseluruhan.</p>
        <input
          type="datetime-local"
          value={manualData.deadlineAt ? new Date(manualData.deadlineAt).toISOString().slice(0, 16) : ''}
          onChange={(e) => setManualData({ ...manualData, deadlineAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          className="w-full md:w-1/2 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          required
        />
      </div>

      <Textarea
        label="Ringkasan Pendek (Summary)"
        placeholder="Deskripsi singkat yang akan muncul di card direktori..."
        value={manualData.summary}
        onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
        rows={2}
        required
      />

      <Textarea
        label="Deskripsi Lengkap & Instruksi"
        placeholder="Gunakan Markdown untuk membuat poin-poin latar belakang, objektif, dan persyaratan teknis..."
        value={manualData.description}
        onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
        rows={8}
        required
      />
    </div>
  );
}
