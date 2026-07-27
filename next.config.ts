import type { NextConfig } from "next";

/**
 * Host gambar jarak jauh yang diizinkan.
 *
 * Sebelumnya di sini ada `hostname: "**"` untuk http dan https sekaligus.
 * Pengoptimal gambar Next mengambil URL di sisi server, sehingga pola bebas
 * itu mengubah aplikasi menjadi proxy gambar terbuka: siapa pun bisa memanggil
 * /_next/image?url=... untuk membuat server kita mengambil alamat mana pun
 * (termasuk alamat internal) dan memakai bandwidth kita sebagai CDN gratis.
 *
 * Tambahkan host baru di sini bila memang dibutuhkan.
 */
const storageHost =
  process.env.NEXT_PUBLIC_STORAGE_HOST || 'storage.tolongin.co';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@vladmandic/face-api'],
  },
  images: {
    // Tetap dibutuhkan karena logo dan ikon landing memakai berkas .svg lokal
    // lewat <Image>. Risikonya ditekan oleh dua baris di bawah (skrip dimatikan
    // + sandbox) dan oleh daftar host yang kini terbatas.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: storageHost },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      // Avatar pihak ketiga yang lazim dipakai profil talenta.
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
    ],
  },
  async rewrites() {
    // Tujuan proxy harus mengikuti lingkungan. Nilai localhost yang dipatok
    // membuat rewrite ini menunjuk ke tempat yang salah saat di-deploy.
    const apiOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:3001';
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
