'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShieldAlert, BarChart3, CreditCard, LifeBuoy, FileText, Megaphone } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUserStore();

  if (!user || user.role !== 'ADMIN') {
    return null; // The AuthGuard or page-level effect will handle redirect
  }

  const tabs = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analitik & Laporan', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Finansial (Billing)', href: '/admin/billing', icon: CreditCard },
    { name: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
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
