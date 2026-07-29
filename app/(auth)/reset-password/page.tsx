'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Ulangi kata sandi baru Anda'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Kedua kata sandi tidak sama',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [authError, setAuthError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (values: ResetFormValues) => {
    if (!token) return;
    setAuthError(null);
    try {
      await authService.resetPassword(token, values.password);
      setIsDone(true);
      // Jeda singkat supaya konfirmasi sempat terbaca, lalu ke halaman masuk.
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setAuthError(
        err.message ||
          'Tautan pemulihan tidak berlaku atau sudah kedaluwarsa. Silakan minta tautan baru.',
      );
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
            Atur Kata Sandi Baru
          </h1>
        </div>

        {/* Tautan tanpa token tidak bisa berbuat apa pun. Dikatakan di awal,
            bukan setelah pengguna mengetik kata sandi baru dua kali. */}
        {!token ? (
          <div
            role="alert"
            className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start gap-3 text-danger">
              <AlertCircle
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-xs font-medium leading-relaxed">
                Tautan pemulihan tidak lengkap. Buka tautan langsung dari email
                yang kami kirim, atau minta tautan baru.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-block text-sm font-semibold text-success hover:opacity-80 transition-opacity"
            >
              Minta tautan baru
            </Link>
          </div>
        ) : isDone ? (
          <div
            role="status"
            className="bg-success/10 border border-success/30 rounded-xl p-5 space-y-3 text-center"
          >
            <CheckCircle2
              className="h-10 w-10 mx-auto text-success"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-foreground">
              Kata sandi berhasil diperbarui
            </p>
            <p className="text-xs text-muted-foreground">
              Anda akan diarahkan ke halaman masuk.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-semibold text-success hover:opacity-80 transition-opacity"
            >
              Masuk sekarang
            </Link>
          </div>
        ) : (
          <>
            {authError && (
              <div
                role="alert"
                className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3 text-danger">
                  <AlertCircle
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-medium leading-relaxed">
                    {authError}
                  </p>
                </div>
                <Link
                  href="/forgot-password"
                  className="inline-block text-sm font-semibold text-success hover:opacity-80 transition-opacity"
                >
                  Minta tautan baru
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Kata Sandi Baru"
                type="password"
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                icon={<Lock className="h-5 w-5" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Ulangi Kata Sandi Baru"
                type="password"
                autoComplete="new-password"
                placeholder="Ketik ulang kata sandi baru"
                icon={<Lock className="h-5 w-5" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full shadow-xl py-2.5"
              >
                Simpan Kata Sandi Baru
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat halaman...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
