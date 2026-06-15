'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../../store/userStore';
import { notificationsService, NotificationItem } from '../../services/notifications.service';
import { tokenService } from '../../services/tokenService';
import { Button } from './Button';
import { Code2, Trophy, Briefcase, Menu, X, User as UserIcon, LogOut, Bell, CheckCheck, Info, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadUserFromStorage } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsService.getMyNotifications(),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 15000,
  });

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
    { name: 'Directory', href: '/challenges', icon: Briefcase },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const companyNavLinks = [
    { name: 'Review Submisi', href: '/workspace', icon: CheckCheck },
    { name: 'Buat Challenge', href: '/challenges/create', icon: Code2 },
  ];

  const navLinks = user?.role === 'COMPANY' ? companyNavLinks : talentNavLinks;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-dark-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:opacity-90 transition-opacity">
                <span className="font-display font-bold text-xl text-white">T</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Tolongin<span className="text-emerald-500">.co</span>
              </span>
            </Link>

            {isAuthenticated && (
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
                          ? 'bg-white/10 text-white shadow-inner'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : ''}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Token Balance */}
                {user?.role === 'TALENT' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Coins className="h-4 w-4" />
                    <span className="text-xs font-bold font-mono">{tokenBalance} Tokens</span>
                  </div>
                )}

                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (dropdownOpen) setDropdownOpen(false);
                    }}
                    className="relative p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
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
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-dark-card border border-dark-border rounded-2xl shadow-2xl py-3 z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-dark-border">
                          <h3 className="font-display font-bold text-white text-sm">Notifikasi</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-dark-border custom-scrollbar">
                          {notifications.length > 0 ? (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => handleMarkAsRead(n.id)}
                                className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                                  !n.isRead ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-white/5'
                                }`}
                              >
                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-emerald-400 animate-pulse' : 'bg-transparent'}`} />
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</h4>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(n.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{n.content}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-gray-500 px-4 space-y-2">
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
                <div className="relative">
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      if (notifOpen) setNotifOpen(false);
                    }}
                    className="flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-white max-w-[120px] truncate">{user?.email}</p>
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
                        className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-emerald-400" />
                          Profil & Verifikasi
                        </Link>
                        <Link
                          href="/workspace"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Briefcase className="h-4 w-4 text-cyan-400" />
                          Dashboard
                        </Link>
                        <div className="border-t border-dark-border my-1" />
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
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
            {isAuthenticated && (
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (mobileMenuOpen) setMobileMenuOpen(false);
                }}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
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
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none"
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
            className="md:hidden border-b border-white/10 bg-dark-bg/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-4"
          >
            {isAuthenticated && (
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium ${
                        isActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : ''}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-semibold text-base">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user?.email}</p>
                      <p className="text-xs text-emerald-400 font-semibold capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    <UserIcon className="h-5 w-5 text-emerald-400" />
                    Profil & Verifikasi
                  </Link>
                  <Link
                    href="/workspace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    <Briefcase className="h-5 w-5 text-cyan-400" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
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
        {notifOpen && mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-dark-card px-4 py-4 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border">
              <h3 className="font-display font-bold text-white text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-emerald-400 font-medium"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className="py-3 border-b border-dark-border/50 last:border-0"
                >
                  <h4 className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>{n.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{n.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Belum ada notifikasi.</p>
            )}
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
};
