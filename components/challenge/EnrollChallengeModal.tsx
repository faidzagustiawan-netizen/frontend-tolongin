import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface EnrollChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  enrollmentError: string | null;
  ndaAccepted: boolean;
  setNdaAccepted: (val: boolean) => void;
  onEnroll: () => void;
  isEnrolling: boolean;
}

export const EnrollChallengeModal = ({
  isOpen,
  onClose,
  companyName,
  enrollmentError,
  ndaAccepted,
  setNdaAccepted,
  onEnroll,
  isEnrolling
}: EnrollChallengeModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Persetujuan Digital NDA">
      <div className="space-y-6">
        <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 space-y-4 max-h-60 overflow-y-auto text-xs text-gray-300 leading-relaxed">
          <h4 className="font-bold text-white text-sm">PERJANJIAN KERAHASIAAN INFORMASI (NON-DISCLOSURE AGREEMENT)</h4>
          <p>Dengan menekan tombol setuju di bawah ini, Anda menyatakan sepakat untuk mematuhi ketentuan kerahasiaan berikut:</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Seluruh data sampel, arsitektur sistem, dan API internal yang disediakan oleh <strong>{companyName || 'Perusahaan Mitra'}</strong> bersifat rahasia.</li>
            <li>Anda dilarang mendistribusikan, menjual, atau mempublikasikan dataset ini untuk kepentingan komersial di luar platform Tolongin.co.</li>
            <li>Solusi kode yang Anda buat tetap menjadi hak milik Anda dan dapat digunakan sebagai portofolio publik di Tolongin.co.</li>
          </ol>
        </div>

        {enrollmentError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{enrollmentError}</p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={ndaAccepted}
            onChange={(e) => setNdaAccepted(e.target.checked)}
            className="mt-0.5 rounded bg-dark-bg border-dark-border text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-200 font-medium leading-relaxed">
            Saya telah membaca, memahami, dan menyetujui seluruh ketentuan Digital NDA di atas.
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={onEnroll} isLoading={isEnrolling} disabled={!ndaAccepted}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Setuju & Mulai Mengerjakan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
