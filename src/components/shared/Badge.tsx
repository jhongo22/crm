import React from 'react';
import { cn } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  key?: any;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-card-alt text-text-secondary border-slate-200/50 dark:border-slate-800',
    success: 'bg-success-bg text-success border-success/20',
    warning: 'bg-warning-bg text-warning border-warning/20',
    danger: 'bg-danger-bg text-danger border-danger/20',
    info: 'bg-brand-bg text-brand border-brand/20',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2.5 py-0.5 text-[10px]',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-black uppercase tracking-wider rounded-full border',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
