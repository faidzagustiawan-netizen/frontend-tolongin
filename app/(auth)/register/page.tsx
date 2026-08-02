'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../../services/auth.service';
import { useUserStore } from '../../../store/userStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import {
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Link as LinkIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Pemilihan paket dihapus dari alur pendaftaran.
//
// Langkah ini menuliskan `subscriptionTier` pilihan pengguna langsung ke
// profil (users.service.ts), sehingga siapa pun bisa memilih paket berbayar
// tanpa melewati pembayaran. Harga yang ditampilkannya pun tidak pernah cocok
// dengan yang ditagih Midtrans. Semua akun kini mulai dari STARTUP dan
// peningkatan paket berjalan lewat /company/billing.

const industries = [
  'Teknologi Informasi & Software',
  'Keuangan & Perbankan',
  'E-Commerce & Retail',
  'Edukasi & EdTech',
  'Kesehatan & Medis',
  'Manufaktur & Logistik',
  'Lainnya',
];

const registerSchema = z
  .object({
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Ulangi kata sandi Anda'),
    role: z.enum(['TALENT', 'COMPANY']),
    isJoinTeam: z.boolean().optional(),
    inviteCode: z.string().optional(),
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    industry: z.string().optional(),
    legalEntityName: z.string().optional(),
    businessRegistrationNumber: z.string().optional(),
    legalDocumentUrl: z.string().optional(),
    acceptTerms: z.literal(true, {
      message: 'Anda perlu menyetujui Syarat Layanan dan Kebijakan Privasi',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kedua kata sandi tidak sama',
        path: ['confirmPassword'],
      });
    }
    if (data.role === 'TALENT' && !data.fullName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama lengkap wajib diisi', path: ['fullName'] });
    }
    if (data.role === 'COMPANY') {
      if (data.isJoinTeam) {
        if (!data.inviteCode) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kode undangan wajib diisi', path: ['inviteCode'] });
        }
        if (!data.fullName) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama lengkap wajib diisi', path: ['fullName'] });
        }
      } else {
        if (!data.companyName) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nama perusahaan wajib diisi', path: ['companyName'] });
        }
        if (!data.industry) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Industri wajib diisi', path: ['industry'] });
        }
        // Legalitas ikut dikumpulkan di sini, bukan diserahkan ke halaman
        // profil sesudahnya. Akun yang mendaftar tanpa dokumen tidak pernah
        // masuk antrean tinjauan admin dan menunggu persetujuan yang tidak
        // akan pernah datang.
        if (!data.businessRegistrationNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nomor NIB atau NPWP wajib diisi', path: ['businessRegistrationNumber'] });
        }
        if (!data.legalDocumentUrl) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tautan dokumen legalitas wajib diisi', path: ['legalDocumentUrl'] });
        } else if (!/^https?:\/\/\S+$/i.test(data.legalDocumentUrl)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tautan dokumen harus berupa URL lengkap (diawali http:// atau https://)', path: ['legalDocumentUrl'] });
        }
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
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
      isJoinTeam: false,
    },
  });

  const isJoinTeam = watch('isJoinTeam');

  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  const maxSteps = selectedRole === 'TALENT' ? 2 : 3;

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['email', 'password', 'confirmPassword'];
    else if (step === 2 && selectedRole === 'TALENT') fieldsToValidate = ['fullName'];

    const isStepValid =
      fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate);
    if (isStepValid) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    try {
      const { confirmPassword: _confirmPassword, acceptTerms: _acceptTerms, ...submitData } = values;
      let data;
      if (submitData.role === 'COMPANY' && submitData.isJoinTeam && submitData.inviteCode) {
        data = await authService.registerTeam(submitData, submitData.inviteCode);
      } else {
        data = await authService.register(submitData);
      }

      if (data?.user) {
        setUser(data.user);
        router.push('/');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
  };

  const stepTitle =
    step === 1
      ? 'Pilih Peran Anda'
      : selectedRole === 'COMPANY'
        ? step === 2
          ? 'Tujuan Pendaftaran'
          : 'Profil Perusahaan'
        : 'Profil Talenta';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-hidden relative">

        {/* Progress Bar */}
        <div
          className="absolute top-0 left-0 w-full h-1 bg-foreground/10"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={maxSteps}
          aria-label={`Langkah ${step} dari ${maxSteps}`}
        >
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / maxSteps) * 100}%` }}
          />
        </div>

        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="inline-block mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="font-display font-bold text-2xl text-white">T</span>
            </div>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {stepTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            Langkah {step} dari {maxSteps}
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 text-danger mb-6"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs font-medium leading-relaxed">{authError}</p>
          </div>
        )}

        {/* Tinggi kontainer mengikuti isinya.
            Versi sebelumnya memposisikan isi langkah secara absolut lalu
            mengganjalnya dengan `pt-80` — ruang mati 320px yang tetap sama
            besar untuk langkah pendek maupun panjang, dan mendorong tombol
            navigasinya jauh di bawah lipatan layar ponsel. */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >

              {/* STEP 1: Basic & Role */}
              {step === 1 && (
                <>
                  <fieldset>
                    <legend className="sr-only">Peran akun</legend>
                    <div className="grid grid-cols-2 gap-4 p-1 bg-background rounded-xl border border-border mb-6">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('TALENT')}
                        aria-pressed={selectedRole === 'TALENT'}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          selectedRole === 'TALENT'
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <User className="h-4 w-4" aria-hidden="true" /> Talenta
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('COMPANY')}
                        aria-pressed={selectedRole === 'COMPANY'}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          selectedRole === 'COMPANY'
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Building2 className="h-4 w-4" aria-hidden="true" /> Perusahaan
                      </button>
                    </div>
                  </fieldset>

                  <Input
                    label="Alamat Email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    icon={<Mail className="h-5 w-5" />}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Kata Sandi"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    icon={<Lock className="h-5 w-5" />}
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  {/* Konfirmasi kata sandi: pendaftaran ini tidak mengirim email
                      verifikasi, jadi satu salah ketik pada kata sandi berarti
                      akun yang langsung terkunci. */}
                  <Input
                    label="Ulangi Kata Sandi"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ketik ulang kata sandi"
                    icon={<Lock className="h-5 w-5" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </>
              )}

              {/* STEP 2: Path Selection (Only for Company) */}
              {step === 2 && selectedRole === 'COMPANY' && (
                /* Dulu dua `<div onClick>`: tidak bisa difokus, tidak bisa
                   dipilih dengan keyboard, dan tanpa semantik pilihan apa pun.
                   Kini radiogroup sungguhan. */
                <fieldset className="space-y-4">
                  <legend className="text-lg font-medium text-foreground mb-4 text-center w-full">
                    Apa tujuan Anda mendaftar?
                  </legend>

                  <label
                    className={`block border rounded-xl p-5 cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                      !isJoinTeam ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="registration-path"
                      checked={!isJoinTeam}
                      onChange={() => setValue('isJoinTeam', false)}
                    />
                    <span className="flex items-center gap-3 mb-2">
                      <Building2
                        className={`w-6 h-6 ${!isJoinTeam ? 'text-success' : 'text-muted-foreground'}`}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-foreground">Mendaftarkan Perusahaan Baru</span>
                    </span>
                    <span className="block text-sm text-muted-foreground ml-9">
                      Sebagai pemilik atau perwakilan resmi perusahaan.
                    </span>
                  </label>

                  <label
                    className={`block border rounded-xl p-5 cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                      isJoinTeam ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name="registration-path"
                      checked={!!isJoinTeam}
                      onChange={() => setValue('isJoinTeam', true)}
                    />
                    <span className="flex items-center gap-3 mb-2">
                      <User
                        className={`w-6 h-6 ${isJoinTeam ? 'text-success' : 'text-muted-foreground'}`}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-foreground">Bergabung ke Tim</span>
                    </span>
                    <span className="block text-sm text-muted-foreground ml-9">
                      Saya memiliki kode undangan dari Admin/HR perusahaan saya.
                    </span>
                  </label>
                </fieldset>
              )}

              {/* STEP 2 for TALENT */}
              {step === 2 && selectedRole === 'TALENT' && (
                <Input
                  label="Nama Lengkap"
                  type="text"
                  autoComplete="name"
                  placeholder="Budi Raharjo"
                  icon={<User className="h-5 w-5" />}
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              )}

              {/* STEP 3 for COMPANY: Details */}
              {step === 3 && selectedRole === 'COMPANY' && (
                <div className="space-y-4">
                  {isJoinTeam ? (
                    <>
                      <Input
                        label="Nama Lengkap Anda"
                        type="text"
                        autoComplete="name"
                        placeholder="Budi Raharjo"
                        icon={<User className="h-5 w-5" />}
                        error={errors.fullName?.message}
                        {...register('fullName')}
                      />
                      <Input
                        label="Kode Undangan Tim"
                        type="text"
                        placeholder="Masukkan kode unik"
                        icon={<Lock className="h-5 w-5" />}
                        error={errors.inviteCode?.message}
                        {...register('inviteCode')}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label="Nama Perusahaan"
                        type="text"
                        autoComplete="organization"
                        placeholder="PT Teknologi Masa Depan"
                        icon={<Building2 className="h-5 w-5" />}
                        error={errors.companyName?.message}
                        {...register('companyName')}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor="register-industry"
                          className="block text-sm font-medium text-muted-foreground mb-1.5"
                        >
                          Sektor Industri
                        </label>
                        <select
                          id="register-industry"
                          aria-invalid={errors.industry ? true : undefined}
                          aria-describedby={errors.industry ? 'register-industry-error' : undefined}
                          className={`flex h-11 w-full rounded-lg border px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors ${
                            errors.industry ? 'border-danger' : 'border-border'
                          }`}
                          {...register('industry')}
                        >
                          <option value="">Pilih Industri...</option>
                          {industries.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                        {errors.industry && (
                          <p id="register-industry-error" role="alert" className="text-xs text-danger mt-1">
                            {errors.industry.message}
                          </p>
                        )}
                      </div>

                      {/* Legalitas usaha dikumpulkan di sini, bukan setelah
                          pendaftaran selesai. Sebelumnya kotak di bawah hanya
                          menjanjikan bahwa dokumennya diminta "di halaman
                          profil"; akun yang tidak pernah ke sana tidak pernah
                          masuk antrean tinjauan admin dan menunggu persetujuan
                          yang memang tidak sedang berjalan. */}
                      <Input
                        label="Nama Entitas Hukum (opsional)"
                        type="text"
                        placeholder="PT Teknologi Masa Depan Indonesia"
                        icon={<Building2 className="h-5 w-5" />}
                        error={errors.legalEntityName?.message}
                        {...register('legalEntityName')}
                      />
                      <Input
                        label="Nomor NIB / NPWP"
                        type="text"
                        placeholder="12.345.678.9-012.000"
                        icon={<ShieldCheck className="h-5 w-5" />}
                        error={errors.businessRegistrationNumber?.message}
                        {...register('businessRegistrationNumber')}
                      />
                      <Input
                        label="Tautan Dokumen Legalitas"
                        type="url"
                        placeholder="https://drive.google.com/..."
                        icon={<LinkIcon className="h-5 w-5" />}
                        error={errors.legalDocumentUrl?.message}
                        {...register('legalDocumentUrl')}
                      />
                      <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                        Unggah NIB, NPWP, atau akta perusahaan ke penyimpanan
                        Anda (Google Drive, Dropbox, situs resmi), lalu tempelkan
                        tautannya di sini. Pastikan tautannya dapat dibuka tim
                        peninjau.
                      </p>

                      {/* Ekspektasi yang dulu tidak pernah disebutkan.
                          Perusahaan mengisi tiga langkah, menekan "Selesaikan
                          Pendaftaran", lalu langsung menabrak dinding
                          "Menunggu Persetujuan Admin" tanpa pernah diberi tahu
                          bahwa persetujuan itu ada. */}
                      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                        <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-warning">
                            Akun perusahaan ditinjau dulu sebelum aktif
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Dokumen legalitas yang Anda kirim di atas ditinjau
                            tim kami dalam 1x24 jam kerja. Membuat studi kasus,
                            melihat kandidat, mengelola tim, dan mengatur
                            langganan baru terbuka setelah peninjauan selesai.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Persetujuan diletakkan di langkah terakhir, tepat sebelum
                  tombol kirim. */}
              {step === maxSteps && (
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-border text-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
                      aria-invalid={errors.acceptTerms ? true : undefined}
                      {...register('acceptTerms')}
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Saya menyetujui{' '}
                      <Link href="/terms" className="font-semibold text-success underline underline-offset-4">
                        Syarat Layanan
                      </Link>{' '}
                      dan{' '}
                      <Link href="/privacy" className="font-semibold text-success underline underline-offset-4">
                        Kebijakan Privasi
                      </Link>{' '}
                      Tolongin.
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p role="alert" className="text-xs text-danger mt-1.5">
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                aria-label="Kembali ke langkah sebelumnya"
                className="px-4"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}

            {step < maxSteps ? (
              <Button type="button" onClick={nextStep} className="w-full">
                <span>Selanjutnya</span>
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} className="w-full shadow-xl">
                <span>Selesaikan Pendaftaran</span>
                <CheckCircle2 className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">Sudah memiliki akun di Tolongin.co?</p>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm font-semibold text-success hover:opacity-80 transition-opacity"
          >
            Masuk ke Dasbor Anda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center"><p className="text-sm text-muted-foreground">Memuat halaman...</p></div>}>
      <RegisterContent />
    </Suspense>
  );
}
