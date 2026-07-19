import React, { useState } from 'react';
import { Settings, FileText, CheckCircle, Save, CheckCircle2, ChevronRight, ChevronLeft, Eye, AlertCircle } from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { Button } from '@/components/common/Button';
import GeneralForm from './GeneralForm';
import QuestionBuilder from './QuestionBuilder';
import PreviewTab from './PreviewTab';

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
    { id: 'GENERAL', label: 'Informasi Umum', icon: <FileText className="w-5 h-5" /> },
    { id: 'QUESTIONS', label: 'Tahapan & Soal', icon: <Settings className="w-5 h-5" /> },
    { id: 'PREVIEW', label: 'Preview Kandidat', icon: <Eye className="w-5 h-5" /> },
    { id: 'PUBLISH', label: 'Review & Publish', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const isFirstStep = currentTabIndex === 0;
  const isLastStep = currentTabIndex === tabs.length - 1;

  const handleNext = () => {
    if (!isLastStep) setActiveTab(tabs[currentTabIndex + 1].id as Tab);
  };

  const handleBack = () => {
    if (!isFirstStep) setActiveTab(tabs[currentTabIndex - 1].id as Tab);
  };

  const isPublished = manualData.status === 'PUBLISHED';

  return (
    <div className="flex flex-col gap-6">
      {isPublished && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-amber-400 text-sm leading-relaxed">
            <strong>Mode Baca-Saja (Read-Only)</strong>: Studi kasus ini telah dipublikasikan. Anda dapat melihat dan mereview seluruh strukturnya, namun Anda tidak dapat lagi mengubah atau menyimpannya.
          </div>
        </div>
      )}
      {/* Horizontal Stepper Navigation */}
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xl w-full">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border z-0 rounded-full hidden sm:block"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 z-0 rounded-full hidden sm:block transition-all duration-500"
            style={{ width: `${(currentTabIndex / (tabs.length - 1)) * 100}%` }}
          ></div>

          {tabs.map((tab, idx) => {
            const isActive = idx === currentTabIndex;
            const isCompleted = idx < currentTabIndex;
            return (
              <div key={tab.id} className="relative z-10 flex flex-col items-center gap-2 sm:bg-card sm:px-4 cursor-pointer" onClick={() => setActiveTab(tab.id as Tab)}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-transparent text-foreground shadow-lg shadow-emerald-500/20 scale-110' 
                    : isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-background border-border text-muted-foreground hover:border-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : tab.icon}
                </div>
                <span className={`text-xs sm:text-sm font-bold hidden sm:block ${isActive ? 'text-foreground' : isCompleted ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl w-full">
        <div className="min-h-[400px]">
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
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Review & Publish
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pastikan semua informasi sudah benar sebelum mempublikasikan tantangan ini ke kandidat.
                </p>
              </div>

              <div className="bg-background border border-border rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Judul:</span>
                    <span className="text-foreground font-medium">{manualData.title || <span className="text-red-400">Belum diisi</span>}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Kategori:</span>
                    <span className="text-foreground font-medium">{manualData.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Total Seksi:</span>
                    <span className="text-foreground font-medium">{manualData.sections?.length || 0} Seksi</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Total Soal:</span>
                    <span className="text-foreground font-medium">
                      {manualData.sections?.reduce((acc, sec) => acc + (sec.components?.length || 0), 0)} Soal
                    </span>
                  </div>
                </div>
              </div>

              {!isPublished && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={() => handleManualSubmit('DRAFT')}
                    isLoading={isSubmitting}
                    disabled={!manualData.title || !manualData.summary || !manualData.description}
                    variant="secondary"
                    className="w-full sm:w-auto px-8 py-3 font-bold bg-background border border-border hover:border-foreground/20"
                  >
                    <Save className="h-5 w-5 mr-2" /> Simpan ke Draf
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleManualSubmit('PUBLISHED')}
                    isLoading={isSubmitting}
                    disabled={!manualData.title || !manualData.summary || !manualData.description}
                    className="w-full sm:w-auto px-8 py-3 font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" /> Publikasikan Sekarang
                  </Button>
                </div>
              )}
              {isPublished && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    disabled
                    variant="secondary"
                    className="w-full sm:w-auto px-8 py-3 font-bold opacity-50 cursor-not-allowed"
                  >
                    Tantangan Telah Dipublikasi
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (Next / Prev) */}
        {activeTab !== 'PUBLISH' && (
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className={`w-full sm:w-auto font-bold px-6 py-2.5 ${isFirstStep ? 'hidden sm:block opacity-0 pointer-events-none' : ''}`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Sebelumnya
            </Button>
            <Button
              onClick={handleNext}
              className="w-full sm:w-auto font-bold px-6 py-2.5 bg-foreground text-background hover:opacity-90"
            >
              Lanjutkan <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


