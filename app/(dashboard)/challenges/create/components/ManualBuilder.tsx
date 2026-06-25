import React, { useState } from 'react';
import { Settings, FileText, CheckCircle, Save, CheckCircle2 } from 'lucide-react';
import { CreateChallengePayload } from '../../../../../services/challenges.service';
import { Button } from '../../../../../components/common/Button';
import GeneralForm from './GeneralForm';
import QuestionBuilder from './QuestionBuilder';
import PreviewTab from './PreviewTab';
import { Eye } from 'lucide-react';

interface ManualBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
  handleManualSubmit: (status: 'DRAFT' | 'PUBLISHED') => Promise<void>;
  isSubmitting: boolean;
}

type Tab = 'GENERAL' | 'QUESTIONS' | 'PREVIEW' | 'PUBLISH';

export default function ManualBuilder({ manualData, setManualData, handleManualSubmit, isSubmitting }: ManualBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>('GENERAL');

  const tabs = [
    { id: 'GENERAL', label: 'Informasi Umum', icon: <FileText className="w-4 h-4" /> },
    { id: 'QUESTIONS', label: 'Tahapan (Progress)', icon: <Settings className="w-4 h-4" /> },
    { id: 'PREVIEW', label: 'Candidate Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'PUBLISH', label: 'Review & Publish', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-dark-card border border-dark-border rounded-3xl p-6 shadow-xl">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 px-4">
          Navigasi Pembuatan
        </h3>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded-2xl p-6 md:p-8">
        {activeTab === 'GENERAL' && (
          <GeneralForm manualData={manualData} setManualData={setManualData} />
        )}

        {activeTab === 'QUESTIONS' && (
          <QuestionBuilder manualData={manualData} setManualData={setManualData} />
        )}

        {activeTab === 'PREVIEW' && (
          <PreviewTab manualData={manualData} onClose={() => setActiveTab('QUESTIONS')} />
        )}

        {activeTab === 'PUBLISH' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Review & Publish
              </h3>
              <p className="text-sm text-gray-400">
                Pastikan semua informasi sudah benar sebelum mempublikasikan tantangan ini ke kandidat.
              </p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Judul:</span>
                  <span className="text-white font-medium">{manualData.title || <span className="text-red-400">Belum diisi</span>}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Kategori:</span>
                  <span className="text-white font-medium">{manualData.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Total Seksi:</span>
                  <span className="text-white font-medium">{manualData.sections?.length || 0} Seksi</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Total Soal:</span>
                  <span className="text-white font-medium">
                    {manualData.sections?.reduce((acc, sec) => acc + (sec.components?.length || 0), 0)} Soal
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <Button
                type="button"
                onClick={() => handleManualSubmit('DRAFT')}
                isLoading={isSubmitting}
                disabled={!manualData.title || !manualData.summary || !manualData.description}
                variant="secondary"
                className="px-8 py-3 font-bold bg-dark-bg border border-dark-border hover:border-white/20"
              >
                <Save className="h-5 w-5 mr-2" /> Simpan ke Draf
              </Button>
              <Button
                type="button"
                onClick={() => handleManualSubmit('PUBLISHED')}
                isLoading={isSubmitting}
                disabled={!manualData.title || !manualData.summary || !manualData.description}
                className="px-8 py-3 font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" /> Publikasikan Sekarang
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
