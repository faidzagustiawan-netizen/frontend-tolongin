'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserStore } from '../../../store/userStore';
import { authService } from '../../../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Mail, Lock, User, Building2, Briefcase, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  role: z.enum(['TALENT', 'COMPANY']),
  fullName: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  subscriptionTier: z.enum(['STARTUP', 'KONGLOMERAT', 'CUSTOM']).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'TALENT' && !data.fullName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nama lengkap wajib diisi untuk Talenta',
      path: ['fullName'],
    });
  }
  if (data.role === 'COMPANY') {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nama perusahaan wajib diisi',
        path: ['companyName'],
      });
    }
    if (!data.industry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bidang industri wajib diisi',
        path: ['industry'],
      });
    }
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as 'TALENT' | 'COMPANY') || 'TALENT';
  const { setUser } = useUserStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'TALENT' | 'COMPANY'>(initialRole);
  const [selectedTier, setSelectedTier] = useState<'STARTUP' | 'KONGLOMERAT' | 'CUSTOM'>('STARTUP');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
      subscriptionTier: 'STARTUP',
    },
  });

  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  useEffect(() => {
    setValue('subscriptionTier', selectedTier);
  }, [selectedTier, setValue]);

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    try {
      const data = await authService.register(values);
      if (data?.user) {
        setUser(data.user);
        router.push(data.user.role === 'COMPANY' ? '/challenges' : '/profile');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    }
  };

  const tiers = [
    { id: 'STARTUP', name: 'Startup Tier', price: 'Gratis 14 Hari', desc: 'Akses 5 studi kasus & verifikasi AI dasar' },
    { id: 'KONGLOMERAT', name: 'Konglomerat Tier', price: 'Premium', desc: 'Akses tanpa batas, AI Generator & Prioritas Support' },
    { id: 'CUSTOM', name: 'Custom Enterprise', price: 'Fleksibel', desc: 'Sistem terdedikasi & integrasi ATS internal' },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="font-display font-bold text-2xl text-white">T</span>
            </div>
          </Link>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Mulai Perjalanan Anda
          </h2>
          <p className="text-sm text-gray-400">
            Bergabunglah sebagai talenta terverifikasi atau rekruter global.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-1 bg-dark-bg rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setSelectedRole('TALENT')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedRole === 'TALENT'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            Talenta
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('COMPANY')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedRole === 'COMPANY'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Perusahaan Mitra
          </button>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Alamat Email"
            type="email"
            placeholder="nama@perusahaan.com atau email Anda"
            icon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Kata Sandi"
            type="password"
            placeholder="Minimal 6 karakter"
            icon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {selectedRole === 'TALENT' ? (
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Budi Raharjo"
              icon={<User className="h-5 w-5" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          ) : (
            <>
              <Input
                label="Nama Perusahaan"
                type="text"
                placeholder="PT GoTo Gojek Tokopedia Tbk"
                icon={<Building2 className="h-5 w-5" />}
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Input
                label="Bidang Industri"
                type="text"
                placeholder="E-Commerce & Financial Technology"
                icon={<Briefcase className="h-5 w-5" />}
                error={errors.industry?.message}
                {...register('industry')}
              />

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-300">Pilih Paket Langganan</label>
                <div className="grid grid-cols-1 gap-3">
                  {tiers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTier(t.id as any)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTier === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                          : 'border-dark-border bg-dark-card/50 hover:bg-dark-card'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{t.name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-emerald-400">
                            {t.price}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
                      </div>
                      {selectedTier === t.id && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full shadow-xl py-2.5 mt-4">
            <span>Daftar Akun Sekarang</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs text-gray-400">Sudah memiliki akun di Tolongin.co?</p>
          <Link href="/login" className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300">
            Masuk ke Akun Anda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center"><p className="text-sm text-gray-400">Memuat halaman...</p></div>}>
      <RegisterContent />
    </Suspense>
  );
}
