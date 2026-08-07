'use client';

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

const baseInputStyles =
  'block w-full rounded-lg bg-card border py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200 text-sm';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightElement, showPasswordToggle, id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const shouldShowToggle = showPasswordToggle !== undefined ? showPasswordToggle : isPasswordType;

    const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : (type || 'text');

    const renderRightElement = () => {
      if (rightElement) return rightElement;
      if (isPasswordType && shouldShowToggle) {
        return (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors p-1 rounded hover:bg-white/5"
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        );
      }
      return null;
    };

    const hasRightElement = rightElement || (isPasswordType && shouldShowToggle);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
            {/* Penanda wajib tidak lagi bergantung pada isi field. Versi
                sebelumnya menyembunyikan tanda bintangnya begitu pengguna
                mengetik, sehingga field wajib dan opsional jadi tidak bisa
                dibedakan saat formulir sudah terisi sebagian. */}
            {props.required && (
              <span className="text-danger ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              baseInputStyles,
              icon ? 'pl-10' : 'px-4',
              hasRightElement ? 'pr-10' : 'pr-4',
              error ? 'border-danger focus:ring-danger' : 'border-border',
              className
            )}
            {...props}
          />
          {hasRightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {renderRightElement()}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error && textareaId ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
            {props.required && (
              <span className="text-danger ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            baseInputStyles,
            'px-4',
            error ? 'border-danger focus:ring-danger' : 'border-border',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
