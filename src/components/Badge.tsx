import React from 'react';
import type { RiskLevel } from '../types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: RiskLevel | 'info' | 'accent' | 'neutral';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'critical':
      variantClasses = 'bg-danger-bg text-danger border-danger-line border';
      break;
    case 'warning':
      variantClasses = 'bg-warn-bg text-warn border-warn-line border';
      break;
    case 'safe':
      variantClasses = 'bg-safe-bg text-safe border-safe-line border';
      break;
    case 'accent':
      variantClasses = 'bg-accent/15 text-accent border-accent/40 border';
      break;
    case 'info':
      variantClasses = 'bg-sky-950/40 text-sky-400 border-sky-800 border dark:bg-sky-950/40 dark:text-sky-300 light:bg-sky-100 light:text-sky-700 light:border-sky-300';
      break;
    case 'neutral':
    default:
      variantClasses = 'bg-surface text-muted border-line border';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded tracking-tight transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
