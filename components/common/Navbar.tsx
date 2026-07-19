'use client';

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../../store/userStore';
import { notificationsService, NotificationItem } from '../../services/notifications.service';
import { tokenService } from '../../services/tokenService';
import { useSocket } from '../../contexts/SocketContext';
import { Button } from './Button';
import { Code2, Trophy, Briefcase, Menu, X, User as UserIcon, LogOut, Bell, CheckCheck, Info, Coins, CreditCard, Sun, Moon, Building2, Users, MoreVertical, LayoutDashboard, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadUserFromStorage } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);
  const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const isDark = newTheme === 'dark';

    // If View Transitions API is not supported, fallback to simple toggle
    if (!document.startViewTransition) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return;
    }

    // Get click coordinates for ripple origin
    const x = e.clientX;
    const y = e.clientY;
    
    // Calculate distance to furthest corner
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getMyNotifications(),
    enabled: isAuthenticated && !!user?.id,
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification: any) => {
      // Invalidate query to trigger immediate refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      
      // Show toast for the notification
      if (notification?.title?.toLowerCase().includes('berhasil')) {
        toast.success(notification.title || 'Ada notifikasi baru');
      } else if (notification?.title?.toLowerCase().includes('gagal') || notification?.title?.toLowerCase().includes('ditolak')) {
        toast.error(notification.title || 'Ada notifikasi baru');
      } else {
        toast(notification?.title || 'Ada notifikasi baru', { icon: 'ℹ️' });
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user, queryClient]);

  const { data: tokenData, refetch: refetchTokens } = useQuery({
    queryKey: ['tokens', user?.id],
    queryFn: () => tokenService.getBalance(),
    enabled: isAuthenticated && user?.role === 'TALENT',
  });

  const notifications: NotificationItem[] = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const tokenBalance = tokenData?.tokenBalance || 0;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      refetchNotifs();
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

  const talentNavLinks = [
    { name: 'Dashboard', href: '/', icon: CheckCheck },
    { name: 'Cari Tantangan', href: '/challenges', icon: Briefcase },
    { name: 'Perusahaan Mitra', href: '/companies', icon: Building2 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const companyNavLinks = [
    { name: 'Dashboard', href: '/', icon: CheckCheck },
    { name: 'Leaderboard Talenta', href: '/leaderboard', icon: Trophy },
  ];

  const adminNavLinks = [
    { name: 'Panel Admin', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  const guestNavLinks = [
    { name: 'Cari Tantangan', href: '/challenges', icon: Briefcase },
    { name: 'Direktori Perusahaan', href: '/companies', icon: Building2 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const navLinks = !isAuthenticated 
    ? guestNavLinks 
    : user?.role === 'ADMIN' 
      ? adminNavLinks 
      : user?.role === 'COMPANY' 
        ? companyNavLinks 
        : talentNavLinks;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center group">
              <Image
                src={!mounted || theme === 'dark' ? '/logo_whites.svg' : '/logo_green.svg'}
                alt="Logo Tolongin"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-foreground/10 text-white shadow-inner'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-all duration-200 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-400" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (dropdownOpen) setDropdownOpen(false);
                    }}
                    className="relative p-2.5 rounded-full bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl py-3 z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                          <h3 className="font-display font-bold text-foreground text-sm">Notifikasi</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-border custom-scrollbar">
                          {notifications.length > 0 ? (
                            <>
                              {notifications.slice(0, 5).map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    handleMarkAsRead(n.id);
                                    if (n.linkUrl) {
                                      setNotifOpen(false);
                                      router.push(n.linkUrl);
                                    }
                                  }}
                                  className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                                  !n.isRead ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-foreground/5'
                                }`}
                              >
                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-emerald-400 animate-pulse' : 'bg-transparent'}`} />
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-muted-foreground'}`}>{n.title}</h4>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(n.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.content}</p>
                                </div>
                              </div>
                              ))}
                              <div className="p-3 bg-card border-t border-border text-center sticky bottom-0">
                                <Link
                                  href="/notifications"
                                  onClick={() => setNotifOpen(false)}
                                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                  Lihat Semua Notifikasi
                                </Link>
                              </div>
                            </>
                          ) : (
                            <div className="py-12 text-center text-muted-foreground px-4 space-y-2">
                              <Info className="h-8 w-8 mx-auto opacity-50" />
                              <p className="text-xs font-medium">Belum ada notifikasi baru.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      if (notifOpen) setNotifOpen(false);
                    }}
                    className="flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors"
                    aria-label="Profile Menu"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-xs overflow-hidden">
                      {user?.profile?.avatarUrl || user?.profile?.logoUrl ? (
                        <img src={(user.profile.avatarUrl as string) || (user.profile.logoUrl as string)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        (user?.profile as any)?.fullName?.[0]?.toUpperCase() || (user?.profile as any)?.companyName?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-foreground max-w-[120px] truncate">{(user?.profile as any)?.fullName || (user?.profile as any)?.companyName || user?.fullName || user?.email?.split('@')[0]}</p>
                      <p className="text-[10px] text-emerald-400 font-semibold capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                      >
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-emerald-400" />
                          {user?.role === 'COMPANY' ? 'Profil & Legalitas KYB' : 'Profil & Identitas'}
                        </Link>
                        {user?.role === 'TALENT' && (
                          <Link
                            href="/talent/tokens"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Coins className="h-4 w-4 text-amber-400" />
                              Saldo & Token
                            </div>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{tokenBalance} Token</span>
                          </Link>
                        )}
                        {user?.role === 'COMPANY' && (
                          <>
                            <Link
                              href="/company/billing"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                            >
                              <CreditCard className="h-4 w-4 text-amber-400" />
                              Langganan & Tagihan
                            </Link>
                          </>
                        )}
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                            router.push('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Masuk</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Daftar</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            {/* Theme Toggle for Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-400" />
              )}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (mobileMenuOpen) setMobileMenuOpen(false);
                }}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                aria-label="Mobile Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (notifOpen) setNotifOpen(false);
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus:outline-none"
              aria-label="Mobile Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-foreground/10 bg-background/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-4"
          >
            <div className="space-y-1">
              <div className="px-4 py-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Menu Utama</span>
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                      isActive ? 'bg-foreground/10 text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-foreground/10 pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-foreground/5 rounded-lg transition-colors mx-2"
                    onClick={() => setMobileProfileMenuOpen(!mobileProfileMenuOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-base overflow-hidden">
                        {user?.profile?.avatarUrl || user?.profile?.logoUrl ? (
                          <img src={(user.profile.avatarUrl as string) || (user.profile.logoUrl as string)} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          (user?.profile as any)?.fullName?.[0]?.toUpperCase() || (user?.profile as any)?.companyName?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{(user?.profile as any)?.fullName || (user?.profile as any)?.companyName || user?.fullName || user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-emerald-400 font-semibold capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg text-muted-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {mobileProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-1"
                      >
                        <div className="px-4 py-2 pt-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Akun Saya</span>
                        </div>
                        <Link
                          href="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                        >
                          <UserIcon className="h-5 w-5 text-emerald-400" />
                          {user?.role === 'COMPANY' ? 'Profil & Legalitas KYB' : 'Profil & Identitas'}
                        </Link>
                        {user?.role === 'TALENT' && (
                          <Link
                            href="/talent/tokens"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-3 mx-2 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                          >
                            <div className="flex items-center gap-3">
                              <Coins className="h-5 w-5 text-amber-400" />
                              Saldo & Token
                            </div>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{tokenBalance} Token</span>
                          </Link>
                        )}
                        {user?.role === 'COMPANY' && (
                          <>
                            <Link
                              href="/company/billing"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                            >
                              <CreditCard className="h-5 w-5 text-amber-400" />
                              Langganan & Tagihan
                            </Link>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      // refresh
                      window.location.reload();
                      // navigate
                      router.push('/login')
                      
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-red-400 hover:bg-red-500/10 text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 px-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full justify-center">Masuk</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-center">Daftar</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifOpen && !mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 right-4 left-4 bg-card border border-border rounded-2xl shadow-2xl py-3 z-50 max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border flex-shrink-0">
              <h3 className="font-display font-bold text-foreground text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="overflow-y-auto divide-y divide-border custom-scrollbar flex-1">
              {notifications.length > 0 ? (
                <>
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        if (n.linkUrl) {
                          setNotifOpen(false);
                          router.push(n.linkUrl);
                        }
                      }}
                      className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-foreground/5'
                      }`}
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-emerald-400 animate-pulse' : 'bg-transparent'}`} />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-muted-foreground'}`}>{n.title}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-card border-t border-border text-center sticky bottom-0">
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Lihat Semua Notifikasi
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground px-4 space-y-2">
                  <Info className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-xs font-medium">Belum ada notifikasi baru.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
