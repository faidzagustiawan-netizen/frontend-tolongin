import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

export interface Experience {
  id?: string;
  title: string;
  companyName: string;
  employmentType?: string | null;
  locationType?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience | null;
  onSave: (experience: Experience) => Promise<void>;
  onDelete?: () => Promise<void>;
  onRemoveSection?: () => void;
}

const MOCK_POSITIONS = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Marketing Manager'];
const MOCK_COMPANIES = ['Gojek', 'Tokopedia', 'Traveloka', 'Shopee', 'Microsoft', 'Google', 'Amazon', 'Facebook', 'PT Telkom Indonesia'];

const EMPLOYMENT_TYPES = [
  'Penuh waktu',
  'Paruh waktu',
  'Pekerja mandiri',
  'Pekerja lepas',
  'Kontrak',
  'Magang jangka pendek',
  'Magang',
  'Musiman'
];

const LOCATION_TYPES = [
  'Di lokasi',
  'Gabungan',
  'Jarak jauh'
];

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YEARS = Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i);

const AutocompleteInput = ({ label, name, value, onChange, placeholder, required = false, suggestionsList, hasError, errorMessage }: any) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (searchTerm && showDropdown) {
      const filtered = suggestionsList.filter((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, showDropdown, suggestionsList]);

  const handleSelect = (val: string) => {
    setSearchTerm(val);
    setShowDropdown(false);
    onChange({ target: { name, value: val } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, suggestions.length - 1);
          document.getElementById(`${name}-suggestion-${next}`)?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          document.getElementById(`${name}-suggestion-${next}`)?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelect(suggestions[focusedIndex]);
        } else {
          setShowDropdown(false);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-1 relative">
      <label className="text-sm font-medium text-foreground block">{label}{required && '*'}</label>
      <input
        type="text"
        name={name}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e);
          setShowDropdown(true);
          setFocusedIndex(-1);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-background border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-emerald-500'} rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:border-transparent outline-none transition-colors`}
      />
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">{errorMessage}</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1">Disarankan</p>
            {suggestions.map((s, index) => (
              <button
                type="button"
                key={s}
                id={`${name}-suggestion-${index}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  focusedIndex === index ? 'bg-emerald-500/10 text-emerald-600 font-medium' : 'hover:bg-foreground/5 text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ExperienceModal = ({ isOpen, onClose, experience, onSave, onDelete, onRemoveSection }: ExperienceModalProps) => {
  const [formData, setFormData] = useState<Experience>({ title: '', companyName: '', isCurrent: true });
  const [startMonth, setStartMonth] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  
  const [showTitleError, setShowTitleError] = useState(false);
  const [showCompanyError, setShowCompanyError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (experience) {
        setFormData(experience);
        if (experience.startDate) {
          const d = new Date(experience.startDate);
          setStartMonth(d.getMonth().toString());
          setStartYear(d.getFullYear().toString());
        } else {
          setStartMonth(''); setStartYear('');
        }
        if (experience.endDate) {
          const d = new Date(experience.endDate);
          setEndMonth(d.getMonth().toString());
          setEndYear(d.getFullYear().toString());
        } else {
          setEndMonth(''); setEndYear('');
        }
      } else {
        setFormData({ title: '', companyName: '', employmentType: '', locationType: '', location: '', description: '', isCurrent: true });
        setStartMonth(''); setStartYear('');
        setEndMonth(''); setEndYear('');
      }
      setShowTitleError(false);
      setShowCompanyError(false);
      setIsSaving(false);
    }
  }, [isOpen, experience]);

  if (!isOpen) return null;

  const buildDate = (year: string, month: string) => {
    if (!year) return null;
    const m = month ? parseInt(month) : 0;
    return new Date(parseInt(year), m, 1).toISOString();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;
    if (!formData.title || !formData.title.trim()) {
      setShowTitleError(true);
      hasErr = true;
    }
    if (!formData.companyName || !formData.companyName.trim()) {
      setShowCompanyError(true);
      hasErr = true;
    }
    if (hasErr) return;
    
    setIsSaving(true);
    const finalData = {
      ...formData,
      startDate: buildDate(startYear, startMonth),
      endDate: formData.isCurrent ? null : buildDate(endYear, endMonth),
    };

    await onSave(finalData);
    setIsSaving(false);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    
    if (name === 'title' && value.trim()) setShowTitleError(false);
    if (name === 'companyName' && value.trim()) setShowCompanyError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{experience ? 'Edit pengalaman' : 'Tambahkan pengalaman'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <p className="text-xs text-muted-foreground">* Wajib diisi</p>
          
          <AutocompleteInput 
            label="Posisi"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Misalnya: Manajer Penjualan Ritel"
            required={true}
            suggestionsList={MOCK_POSITIONS}
            hasError={showTitleError}
            errorMessage="Posisi wajib diisi"
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground block">Jenis pekerjaan</label>
            <select 
              name="employmentType" 
              value={formData.employmentType || ''} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Silakan pilih</option>
              {EMPLOYMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <AutocompleteInput 
            label="Perusahaan atau organisasi"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Misalnya: Microsoft"
            required={true}
            suggestionsList={MOCK_COMPANIES}
            hasError={showCompanyError}
            errorMessage="Perusahaan atau organisasi wajib diisi"
          />

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isCurrent" 
              name="isCurrent"
              checked={formData.isCurrent} 
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-foreground cursor-pointer">
              Ini adalah peran saya pada saat ini
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Tanggal mulai</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Bulan</label>
                <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tahun*</label>
                <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {!formData.isCurrent && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tanggal berakhir</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Bulan</label>
                  <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Tahun*</label>
                  <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lokasi</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location || ''} 
              onChange={handleChange} 
              placeholder="Mis.: London, Inggris"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground block">Jenis lokasi</label>
            <select 
              name="locationType" 
              value={formData.locationType || ''} 
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Silakan pilih</option>
              {LOCATION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Pilih jenis lokasi (mis.: jarak jauh)</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Deskripsi</label>
            <textarea 
              name="description" 
              value={formData.description || ''} 
              onChange={handleChange} 
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px]" 
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center bg-card">
          <div>
            {onRemoveSection && (
              <Button variant="outline" onClick={onRemoveSection} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/50">
                Hapus Bagian Ini
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {experience && onDelete && (
              <Button variant="outline" onClick={onDelete} isLoading={isSaving} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent">
                Hapus Item
              </Button>
            )}
            <Button onClick={handleSave} isLoading={isSaving} className="rounded-full px-6 bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold">
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
