'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserStore } from '../../../store/userStore';
import { authService } from '../../../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired');
  const { setUser } = useUserStore();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const data = await authService.login(values);
      if (data?.user) {
        setUser(data.user);
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Email atau kata sandi salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-2">
            <Image
              src="/logo_tolongin.svg"
              alt="Tolongin"
              width={64}
              height={64}
              className="h-14 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk ke akun Anda untuk melanjutkan pembuktian kinerja atau merekrut talenta.
          </p>
        </div>

        {expired && (
          <div
            role="status"
            className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3 text-warning"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold">Sesi Anda telah berakhir</p>
              <p>Silakan masuk kembali untuk melanjutkan aktivitas Anda.</p>
            </div>
          </div>
        )}

        {authError && (
          <div
            role="alert"
            className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 text-danger"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
            placeholder="••••••••"
            icon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs">
            {/* Kotak ini sekarang benar-benar mengubah perilaku: tanpa dicentang
                sesi disimpan di sessionStorage dan berakhir saat tab ditutup.
                Lihat lib/authStorage.ts. */}
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="rounded bg-bg border-border text-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
                {...register('remember')}
              />
              <span>Tetap masuk di perangkat ini</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-success hover:opacity-80 font-medium transition-opacity"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full shadow-xl py-2.5">
            <span>Masuk Sekarang</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-muted-foreground font-semibold tracking-wider">Atau</span>
          </div>
        </div>

        <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Belum memiliki akun di Tolongin.co?</p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/register?role=TALENT" className="text-success hover:opacity-80 transition-opacity">
              Daftar Talenta
            </Link>
            <span className="text-muted-foreground" aria-hidden="true">•</span>
            <Link href="/register?role=COMPANY" className="text-info hover:opacity-80 transition-opacity">
              Daftar Perusahaan
            </Link>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider text-center mb-3">Dev Auto Login</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-xs bg-black/40 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                onClick={() => {
                  setValue('email', 'faidzagustiawan@gmail.com');
                  setValue('password', '123456');
                }}
              >
                Talent 1
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-xs bg-black/40 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                onClick={() => {
                  setValue('email', 'company1@test.com');
                  setValue('password', 'password123');
                }}
              >
                Company 1
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-xs bg-black/40 hover:bg-purple-500/20 border-purple-500/30 text-purple-400"
                onClick={() => {
                  setValue('email', 'admin@tolongin.co');
                  setValue('password', 'AdminPassword123');
                }}
              >
                Admin
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-sm text-muted-foreground">Memuat halaman...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
