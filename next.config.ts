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

      // Avatar dan logo bawaan. Seluruh talenta dan perusahaan yang belum
      // mengunggah gambar sendiri memakai host ini, jadi menghapusnya membuat
      // hampir semua profil gagal dirender oleh next/image.
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // Ikon badge gamifikasi.
      { protocol: 'https', hostname: 'placehold.co' },

      // Avatar pihak ketiga yang lazim dipakai profil talenta.
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'img.magnific.com' },

      // Host tambahan tanpa perlu mengubah berkas ini. Isi dengan daftar
      // dipisah koma, misal: "cdn.contoh.com,img.contoh.id"
      ...(process.env.NEXT_PUBLIC_EXTRA_IMAGE_HOSTS || '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean)
        .map((hostname) => ({ protocol: 'https' as const, hostname })),
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
