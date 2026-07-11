'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '../../../services/auth.service';
import { useUserStore } from '../../../store/userStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Mail, Lock, User, Building2, Briefcase, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tiers = [
  { id: 'STARTUP', name: 'Startup', price: 'IDR 0 /bulan', desc: 'Cocok untuk coba-coba, max 1 lowongan aktif.' },
  { id: 'KONGLOMERAT', name: 'Konglomerat', price: 'IDR 5jt /bulan', desc: 'Akses tanpa batas ke semua talenta dan fitur unggulan.' },
  { id: 'CUSTOM', name: 'Custom', price: 'Hubungi Kami', desc: 'Solusi *dedicated* untuk kebutuhan korporasi skala besar.' }
];

const industries = [
  'Teknologi Informasi & Software',
  'Keuangan & Perbankan',
  'E-Commerce & Retail',
  'Edukasi & EdTech',
  'Kesehatan & Medis',
  'Manufaktur & Logistik',
  'Lainnya'
];

const registerSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  role: z.enum(['TALENT', 'COMPANY']),
  isJoinTeam: z.boolean().optional(),
  inviteCode: z.string().optional(),
  fullName: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  subscriptionTier: z.enum(['STARTUP', 'KONGLOMERAT', 'CUSTOM']).optional(),
}).superRefine((data, ctx) => {
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
      subscriptionTier: 'STARTUP',
      isJoinTeam: false,
    },
  });

  const isJoinTeam = watch('isJoinTeam');
  const selectedTier = watch('subscriptionTier');
  const selectedIndustry = watch('industry');

  useEffect(() => {
    setValue('role', selectedRole);
  }, [selectedRole, setValue]);

  const maxSteps = selectedRole === 'TALENT' ? 2 : (isJoinTeam ? 3 : 4);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['email', 'password'];
    else if (step === 2 && selectedRole === 'TALENT') fieldsToValidate = ['fullName'];
    else if (step === 3 && selectedRole === 'COMPANY') {
      if (isJoinTeam) fieldsToValidate = ['fullName', 'inviteCode'];
      else fieldsToValidate = ['companyName', 'industry'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => prev - 1);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    try {
      let data;
      if (values.role === 'COMPANY' && values.isJoinTeam && values.inviteCode) {
        data = await authService.registerTeam(values, values.inviteCode);
      } else {
        data = await authService.register(values);
      }
      
      if (data?.user) {
        setUser(data.user);
        router.push(data.user.role === 'COMPANY' ? '/workspace' : '/profile');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(step / maxSteps) * 100}%` }}
          />
        </div>

        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="inline-block mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <span className="font-display font-bold text-2xl text-foreground">T</span>
            </div>
          </Link>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {step === 1 ? 'Pilih Peran Anda' : selectedRole === 'COMPANY' ? 'Profil Perusahaan' : 'Profil Talenta'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Langkah {step} dari {maxSteps}
          </p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative min-h-[300px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-4 absolute w-full"
            >
              
              {/* STEP 1: Basic & Role */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4 p-1 bg-background rounded-xl border border-foreground/10 mb-6">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('TALENT')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedRole === 'TALENT'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <User className="h-4 w-4" /> Talenta
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('COMPANY')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedRole === 'COMPANY'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Building2 className="h-4 w-4" /> Perusahaan
                    </button>
                  </div>

                  <Input
                    label="Alamat Email"
                    type="email"
                    placeholder="nama@perusahaan.com"
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
                </>
              )}

              {/* STEP 2: Path Selection (Only for Company) */}
              {step === 2 && selectedRole === 'COMPANY' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4 text-center">Apa tujuan Anda mendaftar?</h3>
                  <div 
                    onClick={() => setValue('isJoinTeam', false)}
                    className={`border rounded-xl p-5 cursor-pointer transition-all ${
                      !isJoinTeam ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className={`w-6 h-6 ${!isJoinTeam ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <h4 className="font-semibold text-white">Mendaftarkan Perusahaan Baru</h4>
                    </div>
                    <p className="text-sm text-zinc-400 ml-9">Sebagai pemilik atau perwakilan resmi perusahaan.</p>
                  </div>

                  <div 
                    onClick={() => setValue('isJoinTeam', true)}
                    className={`border rounded-xl p-5 cursor-pointer transition-all ${
                      isJoinTeam ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <User className={`w-6 h-6 ${isJoinTeam ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <h4 className="font-semibold text-white">Bergabung ke Tim (Join Team)</h4>
                    </div>
                    <p className="text-sm text-zinc-400 ml-9">Saya memiliki kode undangan dari Admin/HR perusahaan saya.</p>
                  </div>
                </div>
              )}

              {/* STEP 2 for TALENT */}
              {step === 2 && selectedRole === 'TALENT' && (
                <Input
                  label="Nama Lengkap"
                  type="text"
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
                        placeholder="PT Teknologi Masa Depan"
                        icon={<Building2 className="h-5 w-5" />}
                        error={errors.companyName?.message}
                        {...register('companyName')}
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Sektor Industri</label>
                        <select
                          className={`flex h-11 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors bg-zinc-900 border-zinc-800 text-white`}
                          {...register('industry')}
                        >
                          <option value="">Pilih Industri...</option>
                          {industries.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                        {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4 for COMPANY: Subscription */}
              {step === 4 && selectedRole === 'COMPANY' && !isJoinTeam && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-muted-foreground text-center mb-4">Pilih Paket Eksekutif Anda</label>
                  {tiers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setValue('subscriptionTier', t.id as any)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTier === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                          : 'border-border bg-card/50 hover:bg-card'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-foreground/5 border border-foreground/10 px-2 py-0.5 rounded-full text-emerald-400">
                            {t.price}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                      </div>
                      {selectedTier === t.id && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Spacer to push buttons down since relative container is fixed height */}
          <div className="pt-80"></div>
          
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep} className="px-4 border-zinc-700">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {step < maxSteps ? (
              <Button type="button" onClick={nextStep} className="w-full">
                <span>Selanjutnya</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} className="w-full shadow-xl">
                <span>Selesaikan Pendaftaran</span>
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs text-muted-foreground">Sudah memiliki akun di Tolongin.co?</p>
          <Link href="/login" className="inline-block mt-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
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
