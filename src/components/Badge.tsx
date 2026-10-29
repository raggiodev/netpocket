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
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

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
    case 'info':
      variantClasses = 'bg-accent/15 text-accent border-accent/40 border';
      break;
    case 'neutral':
    default:
      variantClasses = 'bg-surface text-muted border-line border';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded tracking-tight transition-colors whitespace-normal text-left leading-tight break-words max-w-full ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
