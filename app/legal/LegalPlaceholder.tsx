import Link from 'next/link';
import { FileText } from 'lucide-react';
import { WHATSAPP_SALES_URL } from '@/lib/plans';

/**
 * Kerangka halaman dokumen legal.
 *
 * Isinya sengaja tidak dikarang. Halaman ini ada supaya kotak persetujuan di
 * formulir pendaftaran menunjuk ke sesuatu yang nyata alih-alih ke 404 —
 * naskah Syarat Layanan dan Kebijakan Privasi yang mengikat harus disusun
 * oleh tim hukum, bukan diisi teks contoh.
 */
export function LegalPlaceholder({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
      </header>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FileText
            className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Naskah lengkap belum diterbitkan
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dokumen versi final sedang disiapkan. Sampai naskahnya terbit di
              halaman ini, Anda bisa meminta salinannya langsung kepada tim
              kami sebelum menyetujui apa pun.
            </p>
          </div>
        </div>

        <a
          href={WHATSAPP_SALES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-bold text-success hover:opacity-80 transition-opacity"
        >
          Minta salinan dokumen
        </a>
      </div>

      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
