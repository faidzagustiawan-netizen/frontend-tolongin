'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../../services/companies.service';
import { useUserStore } from '../../store/userStore';
import { Button } from '../../components/common/Button';
import { Building2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CompaniesDirectoryPage() {
  const { loadUserFromStorage } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getAll(),
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4 font-jakarta">
        <h1 className="font-jakarta text-3xl sm:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Perusahaan Mitra
        </h1>
        <p className="font-jakarta text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
          Temukan perusahaan teknologi yang mencari talenta sepertimu. Ambil studi kasus mereka dan tunjukkan kinerjamu.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-3xl h-64 animate-pulse p-6" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <p className="text-red-400 font-medium">Gagal memuat daftar perusahaan.</p>
        </div>
      ) : companies?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companies.map((company: any, i: number) => (
            <motion.div
              key={company.slug || company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white dark:bg-card hover:bg-card/80 border border-border rounded-[24px] p-6 transition-all shadow-sm hover:shadow-xl relative overflow-hidden flex flex-col h-full font-jakarta z-10"
            >
              {/* Radial Gradient (Dark Purple) */}
              <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#3B3669] rounded-full blur-[65px] opacity-20 dark:opacity-45 pointer-events-none -z-10" />

              {/* Header: Logo & Trust Badge (Centered Vertically) */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-full bg-pink-600 text-white flex items-center justify-center overflow-hidden flex-shrink-0 text-sm font-bold shadow-md">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-cover" />
                  ) : (
                    company.companyName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00BC7D] text-white text-xs font-bold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Trust {company.trustScore}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-muted-foreground mb-1">
                  {company.industry}
                </span>
                <h3 className="text-xl sm:text-2xl font-jakarta font-extrabold text-foreground mb-2 leading-tight">
                  {company.companyName}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium">
                  {company.description || 'Perusahaan teknologi terdepan yang inovatif.'}
                </p>

                <div className="flex flex-col items-center justify-center mb-6 mt-auto">
                  <span className="text-[3.5rem] font-black text-[#3B3669] dark:text-[#615FFF] leading-none mb-1">
                    {company._count?.challenges || 0}
                  </span>
                  <span className="text-base font-medium text-[#3B3669] dark:text-[#615FFF]">
                    studi kasus
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-border mt-auto">
                <Link href={`/companies/${company.slug || company.id}`} className="block w-full">
                  <Button variant="outline" className="w-full rounded-full border-2 border-[#3B3669] text-[#3B3669] hover:bg-[#615FFF] hover:border-[#615FFF] hover:text-white dark:border-[#615FFF] dark:text-[#615FFF] dark:hover:bg-[#615FFF] dark:hover:border-[#615FFF] dark:hover:text-white transition-all font-bold text-sm h-11 bg-transparent">
                    Lihat profil
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-base text-muted-foreground font-semibold">Belum ada perusahaan mitra.</p>
        </div>
      )}
    </div>
  );
}
