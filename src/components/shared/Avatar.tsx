import React from 'react';
import { cn } from '../../types';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  src?: string;
}

export function Avatar({ name, size = 'md', className, src }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const colors = [
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  ];

  const colorIndex = name.length % colors.length;

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-800 shadow-sm shrink-0 overflow-hidden',
      sizes[size],
      !src && colors[colorIndex],
      className
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  );
}
