'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../../services/companies.service';
import { useUserStore } from '../../store/userStore';
import { Button } from '../../components/common/Button';
import { Building2, ArrowRight, ShieldCheck, Users } from 'lucide-react';
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
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          Direktori Perusahaan Mitra
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Temukan berbagai perusahaan teknologi terkemuka yang aktif mencari talenta melalui platform Tolongin. Ikuti studi kasus mereka dan buktikan kemampuan Anda.
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
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card hover:bg-card/80 border border-border rounded-3xl p-6 transition-all shadow-lg hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.companyName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Trust {company.trustScore}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {company.industry}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-emerald-400 transition-colors">
                  {company.companyName}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {company.description || 'Perusahaan teknologi terdepan yang inovatif.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{company._count?.challenges || 0} Studi Kasus</span>
                </div>
                <Link href={`/companies/${company.id}`}>
                  <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 group-hover:px-6 transition-all">
                    Lihat Profil <ArrowRight className="w-4 h-4 ml-2" />
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
