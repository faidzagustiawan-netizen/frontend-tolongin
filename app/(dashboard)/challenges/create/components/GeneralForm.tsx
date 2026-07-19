import React from 'react';
import { Calendar, ShieldAlert, Plus, Trash2, PieChart } from 'lucide-react';
import { Input, Textarea } from '@/components/common/Input';
import { DateTimePicker } from '@/components/common/DateTimePicker';
import { CreateChallengePayload } from '@/services/challenges.service';

interface GeneralFormProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
}

export default function GeneralForm({ manualData, setManualData }: GeneralFormProps) {
  const rubricKeys = Object.keys(manualData.gradingRubric || {}).filter(k => 
    !['proctoringSettings', 'customOutputs', 'durationHours', 'requireProctoring'].includes(k)
  );

  const calculateTotalWeight = () => {
    return rubricKeys.reduce((acc, key) => acc + ((manualData.gradingRubric as any)[key] || 0), 0);
  };

  const handleAddCriteria = () => {
    setManualData({
      ...manualData,
      gradingRubric: {
        ...manualData.gradingRubric,
        [`kriteria_${rubricKeys.length + 1}`]: 0
      }
    });
  };

  const handleRemoveCriteria = (keyToRemove: string) => {
    const newRubric = { ...manualData.gradingRubric } as any;
    delete newRubric[keyToRemove];
    setManualData({
      ...manualData,
      gradingRubric: newRubric
    });
  };

  const handleUpdateCriteria = (oldKey: string, newKey: string, value: number) => {
    const newRubric = { ...manualData.gradingRubric } as any;
    if (oldKey !== newKey) {
      delete newRubric[oldKey];
    }
    newRubric[newKey] = value;
    setManualData({
      ...manualData,
      gradingRubric: newRubric
    });
  };

  const totalWeight = calculateTotalWeight();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Informasi Umum</h3>
        <p className="text-sm text-muted-foreground mb-6">Lengkapi informasi dasar mengenai studi kasus yang akan Anda buat.</p>
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
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Kategori Pekerjaan {!manualData.category && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={manualData.category}
            onChange={(e) => setManualData({ ...manualData, category: e.target.value as any })}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
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
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Tingkat Kesulitan {!manualData.difficulty && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={manualData.difficulty}
            onChange={(e) => setManualData({ ...manualData, difficulty: e.target.value as any })}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            required
          >
            <option value="BEGINNER">Beginner (Pemanasan untuk pemula yang baru belajar)</option>
            <option value="INTERMEDIATE">Intermediate (Tantangan menengah, butuh pemahaman kuat)</option>
            <option value="ADVANCED">Advanced (Misi kompleks untuk penyelesaian masalah tingkat tinggi)</option>
          </select>
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <DateTimePicker
          label="Batas Akhir / Deadline Global"
          value={manualData.deadlineAt}
          onChange={(isoString) => setManualData({ ...manualData, deadlineAt: isoString })}
          placeholder="Tentukan batas akhir..."
          required
        />
        <p className="text-xs text-muted-foreground mt-2">Menentukan kapan challenge ini ditutup secara keseluruhan.</p>
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

      <div className="pt-6 mt-8 border-t border-border">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            Kriteria & Bobot Penilaian (Rubrik)
          </h3>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            Total: {totalWeight}% {totalWeight !== 100 && '(Wajib 100%)'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Tentukan parameter penilaian ujian ini. Berlaku sebagai panduan tim Rekruter untuk evaluasi manual, maupun instruksi mutlak untuk AI Evaluator (jika paket langganan Anda mendukung).
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-500 font-medium">
            <span className="font-bold">Penting:</span> Jika Anda menambahkan soal/tahapan pada langkah berikutnya, rubrik persentase holistik ini akan otomatis dinonaktifkan. Penilaian AI akan didasarkan murni pada Poin Maksimal dari masing-masing soal.
          </p>
        </div>

        <div className="space-y-3">
          {rubricKeys.length === 0 && (
            <div className="text-center p-6 bg-background border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">Belum ada kriteria penilaian. Tambahkan kriteria pertama Anda.</p>
            </div>
          )}
          {rubricKeys.map((key, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Nama Kriteria (misal: Kualitas Kode)"
                value={key}
                onChange={(e) => handleUpdateCriteria(key, e.target.value, (manualData.gradingRubric as any)[key])}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={(manualData.gradingRubric as any)[key]}
                  onChange={(e) => handleUpdateCriteria(key, key, parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCriteria(key)}
                className="p-2.5 text-muted-foreground hover:text-red-500 bg-background border border-border rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCriteria}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-400 mt-4"
          >
            <Plus className="w-4 h-4" /> Tambah Kriteria Baru
          </button>
        </div>
      </div>

      <div className="pt-6 mt-8 border-t border-border">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Pengaturan Keamanan & Anti-Kecurangan
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Konfigurasi seberapa ketat pengawasan yang diberlakukan selama peserta mengerjakan ujian.</p>
        
        <div className="space-y-4 bg-background border border-border p-6 rounded-xl">
          {[
            { id: 'requireFaceScan', label: 'Wajib Verifikasi Wajah (KYC)', desc: 'Kandidat wajib melakukan pemindaian wajah sebelum dapat memulai ujian.' },
            { id: 'continuousTracking', label: 'Pelacakan Wajah Berkelanjutan', desc: 'Kamera aktif selama ujian berlangsung untuk memastikan wajah kandidat tidak hilang atau diganti.' },
            { id: 'trackTabSwitches', label: 'Lacak Perpindahan Tab / Jendela', desc: 'Sistem mencatat atau memblokir jika kandidat berpindah ke aplikasi atau tab browser lain.' },
            { id: 'blockCopyPaste', label: 'Blokir Copy-Paste', desc: 'Kandidat tidak dapat melakukan aksi salin/tempel (Ctrl+C, Ctrl+V) di dalam editor atau form ujian.' },
            { id: 'blockRightClick', label: 'Blokir Klik Kanan', desc: 'Mencegah inspeksi elemen atau aksi konteks menu bawaan browser.' },
            { id: 'enforceFullscreen', label: 'Wajib Layar Penuh (Fullscreen)', desc: 'Mengunci pengerjaan hanya dapat dilakukan dalam mode layar penuh.' },
          ].map((setting) => (
            <div key={setting.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={setting.id}
                checked={!!(manualData.gradingRubric as any)?.proctoringSettings?.[setting.id]}
                onChange={(e) => {
                  const currentSettings = (manualData.gradingRubric as any)?.proctoringSettings || {};
                  setManualData({
                    ...manualData,
                    gradingRubric: {
                      ...manualData.gradingRubric,
                      proctoringSettings: {
                        ...currentSettings,
                        [setting.id]: e.target.checked
                      }
                    }
                  });
                }}
                className="mt-1 w-4 h-4 text-emerald-500 bg-background border-border rounded focus:ring-emerald-500 focus:ring-offset-bg"
              />
              <label htmlFor={setting.id} className="flex flex-col cursor-pointer">
                <span className="text-sm font-semibold text-foreground">{setting.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{setting.desc}</span>
              </label>
            </div>
          ))}

          {/* If trackTabSwitches is on, show maxTabSwitches input */}
          {!!(manualData.gradingRubric as any)?.proctoringSettings?.trackTabSwitches && (
            <div className="ml-7 mt-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Batas Toleransi Pindah Tab (0 = Hanya dicatat, tidak diblokir)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={(manualData.gradingRubric as any)?.proctoringSettings?.maxTabSwitches || 0}
                onChange={(e) => {
                  const currentSettings = (manualData.gradingRubric as any)?.proctoringSettings || {};
                  setManualData({
                    ...manualData,
                    gradingRubric: {
                      ...manualData.gradingRubric,
                      proctoringSettings: {
                        ...currentSettings,
                        maxTabSwitches: parseInt(e.target.value) || 0
                      }
                    }
                  });
                }}
                className="w-24 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


