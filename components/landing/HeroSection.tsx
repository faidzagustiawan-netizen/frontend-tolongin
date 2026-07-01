'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export function HeroSection() {
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const [ripple1, setRipple1] = useState({ x: 0, y: 0, active: false });
  const [ripple2, setRipple2] = useState({ x: 0, y: 0, active: false });

  const handleMouseEnter1 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple1({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeave1 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple1({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: false });
  };

  const handleMouseEnter2 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple2({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeave2 = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple2({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: false });
  };

  const heroWords = ['kesempatan nyata', 'pengalaman industri', 'proyek profesional', 'karier terbaik'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHoveringHero(true)}
      onMouseLeave={() => setIsHoveringHero(false)}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center overflow-hidden hero-no-cursor"
    >
      {isHoveringHero && (
        <motion.div
          style={{
            position: 'fixed',
            left: mouseX,
            top: mouseY,
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            transform: 'translate(-2px, -2px)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            style={{ display: 'block', flexShrink: 0 }}
          >
            <path
              d="M2,2 L18,6 Q9,9 6,18 Z"
              fill="black"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="miter"
            />
          </svg>
          <div
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              marginTop: '9px',
              marginLeft: '-7px',
            }}
            className="text-[11.5px] font-bold px-2.5 py-1.5 rounded-full border shadow-lg text-white-keep"
          >
            You
          </div>
        </motion.div>
      )}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="font-display text-4xl sm:text-6xl md:text-7xl font-medium text-white tracking-tight max-w-5xl mx-auto leading-tight"
      >
        Setiap talenta layak mendapat <br className="hidden sm:block" />
        <div className="relative inline-block h-[1.2em] overflow-visible w-full mt-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={currentWordIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute left-0 right-0 text-transparent bg-clip-text bg-gradient-to-r from-[#1e7f4d] to-[#2aa565]"
            >
              {heroWords[currentWordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link href="/login">
          <Button
            size="lg"
            onMouseEnter={handleMouseEnter1}
            onMouseLeave={handleMouseLeave1}
            className="text-base font-bold px-8 py-4 shadow-2xl relative overflow-hidden bg-[var(--btn-primary-bg-default)] text-white border-transparent hover:border-transparent transition-none"
          >
            <span className="relative z-10 flex items-center justify-center pointer-events-none">
              Mulai Eksplorasi Sekarang
              <ArrowRight className="ml-2 h-5 w-5 pointer-events-none" />
            </span>
            <span
              style={{
                position: 'absolute',
                left: ripple1.x,
                top: ripple1.y,
                transform: `translate(-50%, -50%) scale(${ripple1.active ? 150 : 0})`,
                transition: `transform ${ripple1.active ? '0.5s' : '0.2s'} ease-out`,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--btn-primary-bg-hover)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </Button>
        </Link>
        <Link href="/register?role=COMPANY">
          <Button
            variant="outline"
            size="lg"
            onMouseEnter={handleMouseEnter2}
            onMouseLeave={handleMouseLeave2}
            className="text-base font-bold px-8 py-4 relative overflow-hidden bg-[var(--btn-secondary-bg-default)] border border-[var(--btn-secondary-border-default)] hover:border-[var(--btn-secondary-border-hover)] transition-none"
          >
            <span className="relative z-10 flex items-center justify-center pointer-events-none transition-none" style={{ color: ripple2.active ? 'var(--btn-secondary-text-hover)' : 'var(--btn-secondary-text-default)' }}>
              Bergabung Sebagai Mitra Perusahaan
            </span>
            <span
              style={{
                position: 'absolute',
                left: ripple2.x,
                top: ripple2.y,
                transform: `translate(-50%, -50%) scale(${ripple2.active ? 150 : 0})`,
                transition: `transform ${ripple2.active ? '0.5s' : '0.2s'} ease-out`,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--btn-secondary-bg-hover)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
};
