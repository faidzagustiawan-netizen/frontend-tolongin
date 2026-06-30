'use client';

import * as React from 'react';
import { useAnimation } from 'framer-motion';

type AnimationControls = ReturnType<typeof useAnimation>;

// 1. Definisikan Type/Interface dasar
export interface IconProps<TAnimation = string> extends Omit<React.SVGProps<SVGSVGElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'values'> {
  size?: number;
  animateOnHover?: boolean;
  animate?: boolean;
  animationType?: TAnimation;
}

interface AnimateIconContextType {
  controls: AnimationControls;
}

// 2. Buat Context untuk mengontrol animasi
const AnimateIconContext = React.createContext<AnimateIconContextType | null>(null);

export function useAnimateIconContext() {
  const context = React.useContext(AnimateIconContext);
  if (!context) {
    throw new Error('useAnimateIconContext must be used within an IconWrapper');
  }
  return context;
}

// 3. Helper untuk mapping variants
export function getVariants(animations: Record<string, any>) {
  const group: Record<string, any> = {};
  const path1: Record<string, any> = {};
  const path2: Record<string, any> = {};

  Object.entries(animations).forEach(([key, value]: [string, any]) => {
    if (value.group) group[key] = value.group;
    if (value.path1) path1[key] = value.path1;
    if (value.path2) path2[key] = value.path2;
  });

  return { group, path1, path2 };
}

// 4. Wrapper Komponen yang mendengarkan event Hover
export function IconWrapper({
  icon: Icon,
  size = 24,
  animateOnHover = true,
  animate = false,
  ...props
}: {
  icon: React.ComponentType<any>;
  size?: number;
  animateOnHover?: boolean;
  animate?: boolean;
  [key: string]: any;
}) {
  const controls = useAnimation();

  React.useEffect(() => {
    if (animate) {
      controls.start('animate');
    } else {
      controls.start('initial');
    }
  }, [animate, controls]);

  const handleMouseEnter = () => {
    if (animateOnHover) {
      controls.start('animate');
    }
  };

  const handleMouseLeave = () => {
    if (animateOnHover) {
      controls.start('initial');
    }
  };

  return (
    <AnimateIconContext.Provider value={{ controls }}>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-flex', cursor: 'pointer' }}
      >
        <Icon size={size} {...props} />
      </span>
    </AnimateIconContext.Provider>
  );
}