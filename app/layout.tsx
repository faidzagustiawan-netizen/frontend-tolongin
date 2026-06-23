import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tolongin.co - Real-Performance Hiring & AI Assessment",
  description: "Platform rekrutmen masa depan berbasis pembuktian kinerja nyata (Real-Performance Hiring) yang dipadukan dengan penilaian otomatis dan verifikasi identitas AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-dark-bg text-gray-100">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'dummy_client_key'}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
