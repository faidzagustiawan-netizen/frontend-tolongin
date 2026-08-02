'use client';

import React, { useEffect, useState } from 'react';
import { Toaster, toast, resolveValue } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { submissionsService } from '../../services/submissions.service';
import { useUserStore } from '../../store/userStore';
import { Briefcase, ArrowRight, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const GlobalToaster = () => {
  const { user, isAuthenticated } = useUserStore();
  const router = useRouter();
  const [ongoingChallengeId, setOngoingChallengeId] = useState<string | null>(null);

  // Poll for ongoing challenges only if user is a TALENT and authenticated
  const { data: enrollmentsData } = useQuery({
    queryKey: ['my-enrollments-toast', user?.id],
    queryFn: () => submissionsService.getMyEnrollments(),
    enabled: isAuthenticated && user?.role === 'TALENT',
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  });

  useEffect(() => {
    if (enrollmentsData?.data && Array.isArray(enrollmentsData.data)) {
      const activeEnrollment = enrollmentsData.data.find(
        (e: any) => e.status === 'ENROLLED' || e.status === 'IN_PROGRESS'
      );

      if (activeEnrollment && activeEnrollment.id !== ongoingChallengeId) {
        setOngoingChallengeId(activeEnrollment.id);
        
        // Cek waktu terakhir toast ini dimunculkan
        const lastToastTime = localStorage.getItem(`last-toast-${activeEnrollment.id}`);
        const now = Date.now();
        const TOAST_COOLDOWN = 1000 * 60 * 60; // 1 jam
        
        if (!lastToastTime || (now - parseInt(lastToastTime)) > TOAST_COOLDOWN) {
          // Trigger the premium pop-up
          toast.custom((t) => (
            <AnimatePresence>
              {t.visible && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="bg-card/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-4 w-80 sm:w-96"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-bold text-sm">Challenge Sedang Berjalan!</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        Anda memiliki studi kasus aktif <b>{activeEnrollment.challenge?.title}</b> yang belum disubmit.
                      </p>
                    </div>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="p-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        router.push(`/workspace/${activeEnrollment.id}`);
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Lanjutkan Pengerjaan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ), { duration: 8000, id: `ongoing-${activeEnrollment.id}` });
          
          localStorage.setItem(`last-toast-${activeEnrollment.id}`, now.toString());
        }
      }
    }
  }, [enrollmentsData, ongoingChallengeId, router]);

  // Wrapper untuk render default toast
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        // Default options for normal toasts
        className: 'bg-card border border-border text-white',
        style: {
          background: 'rgba(23, 23, 23, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          borderRadius: '16px',
        },
        success: {
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
        },
        error: {
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          style: {
            border: '1px solid rgba(244, 63, 94, 0.3)',
          },
        },
      }}
    >
      {(t) => {
        // If it's a custom toast, react-hot-toast will render what we passed.
        // For standard (string) toasts, we can wrap them in framer-motion for smooth entrance.
        if (t.type === 'custom') {
          return <>{resolveValue(t.message, t)}</>;
        }

        return (
          <AnimatePresence>
            {t.visible && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex items-center gap-3 px-4 py-3 bg-card/90 backdrop-blur-xl border border-foreground/10 rounded-xl shadow-xl pointer-events-auto"
                style={t.style}
              >
                {t.icon}
                <p className="text-sm font-medium">{resolveValue(t.message, t)}</p>
                {t.type !== 'loading' && (
                  <button 
                    onClick={() => toast.dismiss(t.id)} 
                    className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        );
      }}
    </Toaster>
  );
};
