import type { Metadata } from 'next';
import { LegalPlaceholder } from '../legal/LegalPlaceholder';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - Tolongin.co',
};

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Kebijakan Privasi"
      summary="Bagaimana Tolongin mengumpulkan, memakai, dan menyimpan data Anda — termasuk data biometrik untuk verifikasi identitas, dokumen legalitas perusahaan, dan hasil pengerjaan studi kasus."
    />
  );
}
