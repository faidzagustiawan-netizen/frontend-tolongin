import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-3xl border transition-all duration-300 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-dark-card border-dark-border shadow-2xl',
        glass: 'bg-dark-card/60 border-dark-border backdrop-blur-md shadow-2xl',
        gradient: 'bg-gradient-to-r from-dark-card via-emerald-950/30 to-cyan-950/30 border-dark-border shadow-2xl',
        outline: 'bg-transparent border-dark-border',
      },
      interactive: {
        true: 'group hover:bg-dark-card/80',
        false: '',
      },
      hoverEffect: {
        none: '',
        emerald: 'hover:border-emerald-500/50',
        cyan: 'hover:border-cyan-500/50',
        amber: 'hover:border-amber-500/50',
        indigo: 'hover:border-indigo-500/50',
        gray: 'hover:border-gray-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      hoverEffect: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, hoverEffect, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, interactive, hoverEffect, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
