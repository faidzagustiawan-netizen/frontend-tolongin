'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsService, NotificationItem } from '@/services/notifications.service';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/common/Button';
import { Bell, CheckCheck, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const { user, isAuthenticated, loadUserFromStorage } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: notifData, refetch: refetchNotifs, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getMyNotifications(),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 15000,
  });

  const notifications: NotificationItem[] = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string, linkUrl?: string) => {
    try {
      await notificationsService.markAsRead(id);
      await refetchNotifs();
      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      refetchNotifs();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-emerald-400" />
            Pusat Notifikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Riwayat lengkap semua pemberitahuan, hasil evaluasi, dan pembaruan akun Anda.
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="border-border">
              <CheckCheck className="h-4 w-4 mr-2" /> Tandai Semua Dibaca
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-foreground/10 mx-auto" />
            <div className="h-4 w-32 bg-foreground/10 mx-auto rounded" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {notifications.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleMarkAsRead(n.id, n.linkUrl)}
                  className={`p-6 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-start gap-4 ${
                    !n.isRead 
                      ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                      : 'bg-transparent hover:bg-foreground/5'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {n.title.includes('Berhasil') || n.title.includes('Evaluasi') ? (
                        <div className={`p-2 rounded-full ${!n.isRead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-foreground/5 text-muted-foreground'}`}>
                           <CheckCheck className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-full ${!n.isRead ? 'bg-indigo-500/20 text-indigo-400' : 'bg-foreground/5 text-muted-foreground'}`}>
                           <Bell className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <h4 className={`text-base font-bold ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                          {!n.isRead && (
                            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </h4>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-muted-foreground font-medium' : 'text-muted-foreground/70'}`}>
                        {n.content}
                      </p>
                    </div>
                  </div>
                  
                  {n.linkUrl && (
                    <div className="sm:pl-16 sm:self-center mt-2 sm:mt-0 flex-shrink-0">
                      <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${!n.isRead ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        Buka Tautan <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 rounded-full bg-foreground/5 mx-auto flex items-center justify-center">
               <Info className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Kosong</h3>
            <p className="text-sm">Anda belum memiliki notifikasi apapun saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
