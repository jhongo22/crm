import React from 'react';
import { cn } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/20',
    secondary: 'bg-text-secondary text-white hover:opacity-90',
    outline: 'border border-slate-200/50 dark:border-slate-800 text-text-secondary hover:bg-hover',
    danger: 'bg-danger text-white hover:opacity-90 shadow-sm shadow-danger/20',
    ghost: 'text-text-muted hover:bg-hover',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-bold',
    md: 'px-4 py-2.5 text-sm font-bold',
    lg: 'px-6 py-3.5 text-base font-bold',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none gap-2 whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
