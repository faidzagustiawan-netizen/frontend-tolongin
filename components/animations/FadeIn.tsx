'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  y?: number;
}

export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  y = 20, 
  ...props 
}: FadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
