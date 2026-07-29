'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { AlertCircle, ArrowLeft, Mail, MailCheck } from 'lucide-react';

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  // Backend sengaja menjawab sama untuk email terdaftar dan tidak terdaftar.
  // Layar ini mengikuti: yang ditampilkan adalah konfirmasi pengiriman, bukan
  // konfirmasi bahwa akunnya ada.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (values: ForgotFormValues) => {
    setAuthError(null);
    try {
      await authService.forgotPassword(values.email);
      setSentTo(values.email);
    } catch (err: any) {
      setAuthError(
        err.message || 'Gagal mengirim tautan pemulihan. Silakan coba lagi.',
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
            Pemulihan Kata Sandi
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email akun Anda. Kami kirim tautan untuk mengatur ulang
            kata sandi.
          </p>
        </div>

        {sentTo ? (
          <div
            role="status"
            className="bg-success/10 border border-success/30 rounded-xl p-5 space-y-3 text-center"
          >
            <MailCheck
              className="h-10 w-10 mx-auto text-success"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-foreground">
              Tautan sudah dikirim
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Jika <span className="font-semibold">{sentTo}</span> terdaftar,
              email berisi tautan pemulihan sudah masuk ke kotak masuk Anda.
              Tautan berlaku 1 jam dan hanya bisa dipakai sekali. Cek folder
              spam jika belum terlihat.
            </p>
          </div>
        ) : (
          <>
            {authError && (
              <div
                role="alert"
                className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 text-danger"
              >
                <AlertCircle
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium leading-relaxed">
                  {authError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full shadow-xl py-2.5"
              >
                Kirim Tautan Pemulihan
              </Button>
            </form>
          </>
        )}

        <div className="border-t border-border pt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-success hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
