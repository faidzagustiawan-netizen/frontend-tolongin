'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  delayChildren?: number;
}

export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  ...props
}: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  yOffset?: number;
  duration?: number;
}

export const StaggerItem = ({ children, yOffset = 20, duration = 0.4, ...props }: StaggerItemProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
