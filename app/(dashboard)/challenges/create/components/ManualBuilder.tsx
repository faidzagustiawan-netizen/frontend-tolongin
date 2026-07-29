import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Save,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { CreateChallengePayload } from '@/services/challenges.service';
import { Button } from '@/components/common/Button';
import BasicsForm from './BasicsForm';
import ScheduleAssetsForm from './ScheduleAssetsForm';
import QuestionBuilder from './QuestionBuilder';
import ScoringSecurityForm from './ScoringSecurityForm';
import PreviewTab from './PreviewTab';
import PublishSummary from './PublishSummary';

interface ManualBuilderProps {
  manualData: CreateChallengePayload;
  setManualData: React.Dispatch<React.SetStateAction<CreateChallengePayload>>;
  handleManualSubmit: (status: 'DRAFT' | 'PUBLISHED') => Promise<void>;
  isSubmitting: boolean;
}

type Tab = 'BASICS' | 'SCHEDULE' | 'QUESTIONS' | 'SCORING' | 'PREVIEW' | 'PUBLISH';

/**
 * Langkah penyusunan dipecah menurut keputusan yang berbeda, bukan digabung
 * jadi satu layar "Informasi Umum" berisi lima belas kolom.
 *
 * Urutannya juga berubah: penilaian dan pengawasan datang SETELAH soal
 * disusun. Bobot rubrik holistik hanya mengikat ketika tidak ada soal berpoin,
 * jadi menanyakannya lebih dulu berarti meminta keputusan atas sesuatu yang
 * belum bisa diketahui jawabannya.
 */
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'BASICS', label: 'Informasi Dasar', icon: <FileText className="w-5 h-5" /> },
  { id: 'SCHEDULE', label: 'Jadwal & Aset', icon: <CalendarClock className="w-5 h-5" /> },
  { id: 'QUESTIONS', label: 'Tahapan & Soal', icon: <Settings className="w-5 h-5" /> },
  { id: 'SCORING', label: 'Penilaian & Keamanan', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'PREVIEW', label: 'Pratinjau', icon: <Eye className="w-5 h-5" /> },
  { id: 'PUBLISH', label: 'Review & Publish', icon: <CheckCircle className="w-5 h-5" /> },
];

const RUBRIC_SYSTEM_KEYS = [
  'proctoringSettings',
  'customOutputs',
  'durationHours',
  'requireProctoring',
];

export default function ManualBuilder({
  manualData,
  setManualData,
  handleManualSubmit,
  isSubmitting,
}: ManualBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>('BASICS');

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const isFirstStep = currentTabIndex === 0;
  const isLastStep = currentTabIndex === TABS.length - 1;

  const handleNext = () => {
    if (!isLastStep) setActiveTab(TABS[currentTabIndex + 1].id);
  };

  const handleBack = () => {
    if (!isFirstStep) setActiveTab(TABS[currentTabIndex - 1].id);
  };

  // Backend menolak penyuntingan untuk PUBLISHED maupun CLOSED.
  const isPublished = manualData.status === 'PUBLISHED';
  const isClosed = manualData.status === 'CLOSED';
  const isLocked = isPublished || isClosed;

  const totalComponents = (manualData.sections || []).reduce(
    (acc, sec) => acc + (sec.components?.length || 0),
    0,
  );

  // Rubrik holistik hanya berlaku ketika tidak ada soal berpoin; di situ
  // backend mewajibkan totalnya 100%. Diperiksa di sini juga supaya penolakan
  // tidak baru datang setelah seluruh formulir panjang selesai diisi.
  const rubricWeights = Object.entries(manualData.gradingRubric || {}).filter(
    ([key]) => !RUBRIC_SYSTEM_KEYS.includes(key),
  );
  const rubricTotal = rubricWeights.reduce((acc, [, value]) => acc + (Number(value) || 0), 0);
  const rubricBlocksPublish =
    totalComponents === 0 && rubricWeights.length > 0 && rubricTotal !== 100;

  const missingBasics = !manualData.title || !manualData.summary || !manualData.description;
  const hasSection = (manualData.sections || []).length > 0;

  const publishBlockReason = missingBasics
    ? 'Judul, Ringkasan, dan Deskripsi wajib diisi di langkah Informasi Dasar.'
    : !hasSection
      ? 'Tambahkan minimal satu tahap di langkah Tahapan & Soal.'
      : rubricBlocksPublish
        ? `Total bobot rubrik harus 100%, saat ini ${rubricTotal}%.`
        : null;

  return (
    <div className="flex flex-col gap-6">
      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-amber-400 text-sm leading-relaxed">
            <strong>Mode Baca-Saja (Read-Only)</strong>:{' '}
            {isClosed
              ? 'Studi kasus ini sudah diarsipkan. Anda masih dapat meninjau strukturnya, namun tidak dapat mengubah atau menyimpannya.'
              : 'Studi kasus ini telah dipublikasikan. Anda dapat melihat dan mereview seluruh strukturnya, namun Anda tidak dapat lagi mengubah atau menyimpannya.'}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xl w-full">
        <div className="flex items-center justify-between relative gap-1">
          <div className="absolute left-0 top-6 w-full h-1 bg-border z-0 rounded-full hidden sm:block" />
          <div
            className="absolute left-0 top-6 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 z-0 rounded-full hidden sm:block transition-all duration-500"
            style={{ width: `${(currentTabIndex / (TABS.length - 1)) * 100}%` }}
          />

          {TABS.map((tab, idx) => {
            const isActive = idx === currentTabIndex;
            const isCompleted = idx < currentTabIndex;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'step' : undefined}
                className="relative z-10 flex flex-col items-center gap-2 sm:bg-card sm:px-2 flex-1 min-w-0"
              >
                <span
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-transparent text-white shadow-lg shadow-emerald-500/20 scale-110'
                      : isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-background border-border text-muted-foreground hover:border-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : tab.icon}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-bold hidden sm:block text-center leading-tight ${
                    isActive
                      ? 'text-foreground'
                      : isCompleted
                        ? 'text-emerald-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl w-full">
        <div className="min-h-[400px]">
          {activeTab === 'BASICS' && (
            <BasicsForm manualData={manualData} setManualData={setManualData} />
          )}

          {activeTab === 'SCHEDULE' && (
            <ScheduleAssetsForm manualData={manualData} setManualData={setManualData} />
          )}

          {activeTab === 'QUESTIONS' && (
            <QuestionBuilder manualData={manualData} setManualData={setManualData} />
          )}

          {activeTab === 'SCORING' && (
            <ScoringSecurityForm
              manualData={manualData}
              setManualData={setManualData}
              totalComponents={totalComponents}
            />
          )}

          {activeTab === 'PREVIEW' && (
            <PreviewTab
              manualData={manualData}
              onClose={() => setActiveTab('QUESTIONS')}
              onApprove={() => setActiveTab('PUBLISH')}
            />
          )}

          {activeTab === 'PUBLISH' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" /> Review
                  &amp; Publish
                </h3>
                <p className="text-sm text-muted-foreground">
                  Periksa seluruh isinya sekali lagi sebelum diterbitkan ke kandidat.
                </p>
              </div>

              <PublishSummary manualData={manualData} onJumpTo={setActiveTab} />

              {!isLocked && (
                <div className="space-y-4">
                  {publishBlockReason && (
                    <div
                      role="status"
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      <AlertCircle
                        className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-amber-500 leading-relaxed">
                        Belum bisa diterbitkan: {publishBlockReason}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      onClick={() => handleManualSubmit('DRAFT')}
                      isLoading={isSubmitting}
                      disabled={missingBasics}
                      variant="secondary"
                      className="w-full sm:w-auto px-8 py-3 font-bold bg-background border border-border hover:border-foreground/20"
                    >
                      <Save className="h-5 w-5 mr-2" aria-hidden="true" /> Simpan ke Draf
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleManualSubmit('PUBLISHED')}
                      isLoading={isSubmitting}
                      disabled={!!publishBlockReason}
                      className="w-full sm:w-auto px-8 py-3 font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" aria-hidden="true" /> Publikasikan
                      Sekarang
                    </Button>
                  </div>
                </div>
              )}

              {isLocked && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    disabled
                    variant="secondary"
                    className="w-full sm:w-auto px-8 py-3 font-bold opacity-50 cursor-not-allowed"
                  >
                    {isClosed ? 'Tantangan Telah Diarsipkan' : 'Tantangan Telah Dipublikasi'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pratinjau punya tombol aksinya sendiri di bilah atasnya, jadi navigasi
            bawah disembunyikan di sana agar tidak ada dua jalan keluar yang
            saling bersaing di satu layar. */}
        {activeTab !== 'PUBLISH' && activeTab !== 'PREVIEW' && (
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className={`w-full sm:w-auto font-bold px-6 py-2.5 ${
                isFirstStep ? 'hidden sm:block opacity-0 pointer-events-none' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" aria-hidden="true" /> Sebelumnya
            </Button>
            <Button
              onClick={handleNext}
              className="w-full sm:w-auto font-bold px-6 py-2.5 bg-foreground text-background hover:opacity-90"
            >
              Lanjutkan <ChevronRight className="w-5 h-5 ml-1" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
