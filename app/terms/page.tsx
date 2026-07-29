import type { Metadata } from 'next';
import { LegalPlaceholder } from '../legal/LegalPlaceholder';

export const metadata: Metadata = {
  title: 'Syarat Layanan - Tolongin.co',
};

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Syarat Layanan"
      summary="Ketentuan penggunaan platform Tolongin bagi talenta maupun perusahaan, termasuk hak dan kewajiban masing-masing pihak atas studi kasus, penilaian, dan data yang dipertukarkan."
    />
  );
}
