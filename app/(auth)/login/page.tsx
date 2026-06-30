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
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
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
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const data = await authService.login(values);
      if (data?.user) {
        setUser(data.user);
        router.push(data.user.role === 'COMPANY' ? '/challenges' : '/workspace');
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
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Selamat Datang Kembali
          </h2>
          <p className="text-sm text-gray-400">
            Masuk ke akun Anda untuk melanjutkan pembuktian kinerja atau merekrut talenta.
          </p>
        </div>

        {expired && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold">Sesi Anda telah berakhir</p>
              <p>Silakan masuk kembali untuk melanjutkan aktivitas Anda.</p>
            </div>
          </div>
        )}

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
            placeholder="••••••••"
            icon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input type="checkbox" className="rounded bg-bg border-border text-emerald-500 focus:ring-emerald-500" />
              <span>Ingat saya</span>
            </label>
            <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Lupa kata sandi?
            </a>
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
            <span className="bg-card px-4 text-gray-500 font-semibold tracking-wider">Atau</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center space-y-2">
          <p className="text-xs text-gray-400">Belum memiliki akun di Tolongin.co?</p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/register?role=TALENT" className="text-emerald-400 hover:text-emerald-300">
              Daftar Talenta
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/register?role=COMPANY" className="text-cyan-400 hover:text-cyan-300">
              Daftar Perusahaan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-sm text-gray-400">Memuat halaman...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
