import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

// `focus-visible` menggantikan `focus`: cincin fokus kini hanya muncul untuk
// navigasi keyboard, tidak setiap kali tombol diklik dengan tetikus. Offset
// juga tidak lagi menunjuk `dark-bg`, warna yang tidak ada di daftar token
// sehingga cincinnya salah warna di light mode.
const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20 focus-visible:ring-emerald-500',
        secondary: 'bg-card border border-border hover:bg-foreground/10 text-foreground focus-visible:ring-emerald-500',
        outline: 'border border-emerald-500/50 hover:bg-emerald-500/10 text-success focus-visible:ring-emerald-500',
        ghost: 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground focus-visible:ring-emerald-500',
        danger: 'bg-danger/10 border border-danger/50 text-danger hover:bg-danger/20 focus-visible:ring-danger',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
