'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShieldAlert, BarChart3, CreditCard, LifeBuoy, FileText, Megaphone, ScanFace, Building2 } from 'lucide-react';
import { useAdminGuard } from '@/hooks/useAdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isHydrated } = useAdminGuard();

  // Sesi belum terbaca: jangan putuskan apa pun dulu, termasuk jangan
  // menuduh pengguna bukan admin.
  if (!isHydrated) {
    return null;
  }

  // Bukan admin. `useAdminGuard` sudah menjadwalkan pengalihan, tetapi
  // mengembalikan `null` sambil menunggu berarti pengguna melihat area kosong
  // lalu mendarat di beranda tanpa satu kata pun — tidak bisa dibedakan dari
  // tautan rusak. Toast di dalam guard sering tertelan karena pengalihannya
  // terjadi dalam hitungan milidetik, jadi alasannya ditulis di sini.
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-3 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Halaman Khusus Admin</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Akun Anda tidak punya akses ke panel admin. Anda sedang dialihkan kembali ke beranda.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analitik & Laporan', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Finansial (Billing)', href: '/admin/billing', icon: CreditCard },
    { name: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
    { name: 'Tinjauan Identitas', href: '/admin/identity-reviews', icon: ScanFace },
    { name: 'Verifikasi Perusahaan', href: '/admin/company-verifications', icon: Building2 },
    { name: 'Moderasi Tantangan', href: '/admin/challenges', icon: ShieldAlert },
    { name: 'Tiket Bantuan', href: '/admin/tickets', icon: LifeBuoy },
    { name: 'Pengumuman (CMS)', href: '/admin/cms', icon: Megaphone },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sticky top-24">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-3">
              Admin Menu
            </h2>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[#E3FF00]/10 text-[#E3FF00]' 
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

      </div>
    </div>
  );
}
