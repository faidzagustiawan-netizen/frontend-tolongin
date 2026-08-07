'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { StaggerContainer, StaggerItem } from '../animations';

export function HeroSection() {
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mascotX = useSpring(
    useTransform(mouseX, [0, 1400], [35, -35]),
    { stiffness: 50, damping: 15 }
  );
  const mascotY = useSpring(
    useTransform(mouseY, [0, 800], [35, -35]),
    { stiffness: 50, damping: 15 }
  );

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
      className="relative w-full max-w-none px-4 sm:px-8 lg:px-16 xl:px-24 pt-24 pb-32 overflow-hidden hero-no-cursor"
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
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block', flexShrink: 0 }}>
            <path d="M2,2 L18,6 Q9,9 6,18 Z" fill="black" stroke="white" strokeWidth="1.5" strokeLinejoin="miter" />
          </svg>
          <div style={{ backgroundColor: '#000000', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)', marginTop: '9px', marginLeft: '-7px' }} className="text-[11.5px] font-bold px-2.5 py-1.5 rounded-full border shadow-lg text-foreground-keep">You</div>
        </motion.div>
      )}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Maskot Melayang Interaktif di Sisi Kanan Mentok */}
      <motion.div
        style={{ x: mascotX, y: mascotY }}
        animate={{
          y: [0, -22, 0],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          y: { repeat: Infinity, duration: 3.8, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 5.5, ease: 'easeInOut' },
        }}
        className="hidden lg:block absolute right-4 lg:right-12 xl:right-20 top-[85%] -translate-y-1/2 w-80 h-80 lg:w-[380px] lg:h-[380px] xl:w-[460px] xl:h-[460px] pointer-events-none z-10"
      >
        <Image
          src="/mascot-fly.svg"
          alt="Maskot Fly"
          fill
          className="object-contain drop-shadow-[0_25px_35px_rgba(30,127,77,0.3)]"
          priority
        />
      </motion.div>

      <StaggerContainer className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto text-center relative z-20">
        <StaggerItem className="font-display text-4xl sm:text-6xl md:text-7xl font-medium text-title tracking-tight max-w-full mx-auto leading-tight">
          Setiap talenta layak mendapat <br className="hidden sm:block" />
          <div className="relative inline-block min-h-[1.2em] h-auto pb-2 overflow-visible w-full mt-2">
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
        </StaggerItem>

        <StaggerItem className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              onMouseEnter={handleMouseEnter1}
              onMouseLeave={handleMouseLeave1}
              aria-label="Mulai Eksplorasi Sekarang"
              className="text-base font-bold px-8 py-4 shadow-2xl relative overflow-hidden bg-[var(--btn-primary-bg-default)] text-white border-transparent hover:border-transparent transition-none"
            >
              <span className="relative z-10 flex items-center justify-center pointer-events-none">
                Mulai Eksplorasi Sekarang
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
              size="lg"
              onMouseEnter={handleMouseEnter2}
              onMouseLeave={handleMouseLeave2}
              aria-label="Bergabung Sebagai Mitra Perusahaan"
              className="text-base font-bold px-8 py-4 shadow-2xl relative overflow-hidden bg-[#F1732E] text-white border-transparent hover:border-transparent transition-none"
            >
              <span className="relative z-10 flex items-center justify-center pointer-events-none transition-none text-white">
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
                  backgroundColor: '#f38545',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            </Button>
          </Link>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
};
