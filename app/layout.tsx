import type { Metadata } from "next";
import { Inter, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { AuthGuard } from "../components/providers/AuthGuard";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tolongin.co - Real-Performance Hiring & AI Assessment",
  description: "Platform rekrutmen masa depan berbasis pembuktian kinerja nyata (Real-Performance Hiring) yang dipadukan dengan penilaian otomatis dan verifikasi identitas AI.",
  keywords: ["hiring", "recruitment", "ai assessment", "tech talent", "tolongin"],
  openGraph: {
    title: "Tolongin.co - Real-Performance Hiring",
    description: "Platform rekrutmen masa depan berbasis pembuktian kinerja nyata.",
    url: "https://tolongin.co",
    siteName: "Tolongin",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tolongin.co",
    description: "Platform rekrutmen masa depan berbasis pembuktian kinerja nyata.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${outfit.variable} ${plusJakartaSans.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthGuard>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
