import React from 'react';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase',
  {
    variants: {
      variant: {
        emerald: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
        cyan: 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400',
        amber: 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
        gray: 'bg-white/5 border border-white/10 text-gray-300',
        outline: 'bg-transparent border border-white/10 text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'emerald',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, className }))} {...props}>
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
